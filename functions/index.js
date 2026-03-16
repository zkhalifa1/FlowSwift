const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = require("docx");
const { checkAllRateLimits, RATE_LIMITS } = require("./rateLimiter");

admin.initializeApp();

// Initialize OpenAI with API key from Firebase config
// Set with: firebase functions:config:set openai.key="your-key-here"
const getOpenAIClient = () => {
  const apiKey = functions.config().openai?.key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({ apiKey });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function verifyAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }
  return context.auth.uid;
}

async function checkMonthlyQuota(userId, limitType = "transcription") {
  const db = admin.firestore();
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() || {};

  // Legacy users have unlimited access (grandfathered)
  if (userData.isLegacyUser === true) {
    return true;
  }

  // Get subscription tier and status
  const tier = userData.subscriptionTier || "starter";
  const subscriptionStatus = userData.subscriptionStatus || "active";

  // Check if payment is past due - block access
  if (subscriptionStatus === "past_due") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Your payment is past due. Please update your payment method to continue using the service."
    );
  }

  // Define monthly limits per tier
  const limits = {
    starter: { transcription: 50, reports: 50, chat: 100 },
    professional: { transcription: 1000, reports: 1000, chat: 1000 },
    enterprise: { transcription: -1, reports: -1, chat: -1 }, // unlimited
  };

  const limit = limits[tier][limitType];
  if (limit === -1) return true; // unlimited

  // Check current usage
  const usageField = `${limitType}Usage`;
  const currentUsage = userData[usageField] || 0;

  if (currentUsage >= limit) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      `Monthly ${limitType} limit of ${limit} reached. Please upgrade your plan to continue.`
    );
  }

  return true;
}

async function incrementUsage(userId, limitType) {
  const db = admin.firestore();
  const usageField = `${limitType}Usage`;

  console.log(`📈 Incrementing ${usageField} for user ${userId}`);
  await db.collection("users").doc(userId).update({
    [usageField]: admin.firestore.FieldValue.increment(1),
    lastUsed: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ Successfully incremented ${usageField}`);
}

async function logApiUsage(userId, endpoint, success, metadata = {}) {
  const db = admin.firestore();

  await db.collection("apiUsage").add({
    userId,
    endpoint,
    success,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ...metadata,
  });
}

// ============================================
// CLOUD FUNCTION 1: TRANSCRIBE AUDIO
// ============================================

exports.transcribeAudio = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 540,
    memory: "1GB"
  })
  .https.onCall(async (data, context) => {
    const userId = await verifyAuth(context);
    const { audioStoragePath } = data;

    if (!audioStoragePath) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "audioStoragePath is required"
      );
    }

    // Check advanced rate limits (per-minute, per-hour, per-day)
    await checkAllRateLimits(userId, "transcribeAudio");

    // Check monthly subscription quota
    await checkMonthlyQuota(userId, "transcription");

    try {
      const openai = getOpenAIClient();

      // Download audio from Firebase Storage
      console.log('Downloading audio from storage path:', audioStoragePath);
      const bucket = admin.storage().bucket();
      const file = bucket.file(audioStoragePath);
      const [audioBuffer] = await file.download();
      console.log('Audio buffer size:', audioBuffer.length, 'bytes');

      // Get file extension from path (default to webm)
      const fileExtension = audioStoragePath.split('.').pop() || 'webm';
      const fileName = `audio.${fileExtension}`;
      console.log('Processing file:', fileName);

      // Call OpenAI Whisper API (server-side, secure)
      // In Node.js, we need to create a File-like object for the OpenAI SDK
      console.log('Creating file object for OpenAI...');
      const audioFile = await toFile(audioBuffer, fileName);
      console.log('Calling OpenAI Whisper API...');

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
      });

      console.log('Transcription successful, length:', transcription.text.length);

      // Update usage tracking
      await incrementUsage(userId, "transcription");

      // Log for audit
      await logApiUsage(userId, "transcribeAudio", true, {
        audioPath: audioStoragePath,
      });

      return {
        transcription: transcription.text,
        success: true
      };
    } catch (error) {
      console.error("Transcription error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        type: error.type,
      });

      await logApiUsage(userId, "transcribeAudio", false, {
        error: error.message,
        errorStack: error.stack,
        audioPath: audioStoragePath,
      });

      // Provide helpful error messages
      if (error.status === 401) {
        throw new functions.https.HttpsError("unauthenticated", "Invalid OpenAI API key configuration");
      } else if (error.status === 429) {
        throw new functions.https.HttpsError("resource-exhausted", "OpenAI rate limit exceeded. Please try again later.");
      } else if (error.code === 'storage/object-not-found') {
        throw new functions.https.HttpsError("not-found", "Audio file not found in storage");
      }

      throw new functions.https.HttpsError("internal", error.message || "Transcription failed");
    }
  });

// ============================================
// CLOUD FUNCTION 2: GENERATE REPORT
// ============================================

exports.generateReport = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB"
  })
  .https.onCall(async (data, context) => {
    const userId = await verifyAuth(context);
    const { selectedNotes, dateRange, projectName } = data;

    if (!selectedNotes || !Array.isArray(selectedNotes) || selectedNotes.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "selectedNotes array is required"
      );
    }

    // Check advanced rate limits (per-minute, per-hour, per-day)
    await checkAllRateLimits(userId, "generateReport");

    // Check monthly subscription quota
    await checkMonthlyQuota(userId, "reports");

    try {
      const openai = getOpenAIClient();

      // Prepare transcriptions for AI analysis
      const transcriptions = selectedNotes
        .filter(note => note.transcription)
        .map((note, index) => {
          const timestamp = formatTimestamp(note.timestamp);
          return `Note ${index + 1} (${timestamp}):\n${note.transcription}`;
        })
        .join('\n\n');

      if (!transcriptions) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "No transcriptions found in selected notes"
        );
      }

      // Generate AI summary
      const prompt = `Analyze these construction voice note transcriptions and categorize the information for a professional construction report.

Project: ${projectName || 'Construction Project'}
Date Range: ${dateRange?.start || 'N/A'} - ${dateRange?.end || 'N/A'}

Voice Notes:
${transcriptions}

Categorize and organize this information into a structured JSON format suitable for construction reporting. Return a JSON object with this structure:

{
  "summary": "Brief overall summary of the day's activities",
  "categories": {
    "workPerformed": {
      "content": "Description of work completed",
      "details": ["specific tasks", "locations", "progress made"]
    },
    "safetyIncidents": {
      "content": "Any safety issues or incidents mentioned",
      "details": ["specific incidents", "safety measures taken"]
    },
    "materials": {
      "content": "Materials used, delivered, or needed",
      "details": ["material types", "quantities", "suppliers"]
    },
    "equipment": {
      "content": "Equipment used or issues",
      "details": ["equipment types", "maintenance", "problems"]
    },
    "weather": {
      "content": "Weather conditions affecting work",
      "details": ["conditions", "impact on work"]
    },
    "crew": {
      "content": "Crew information and workforce details",
      "details": ["crew size", "personnel", "subcontractors"]
    },
    "issues": {
      "content": "Problems encountered or delays",
      "details": ["specific issues", "causes", "resolutions"]
    },
    "progress": {
      "content": "Overall project progress assessment",
      "details": ["completion percentages", "milestones", "schedule status"]
    }
  },
  "keyEvents": ["list of most important events"],
  "recommendations": ["suggested actions or follow-ups"]
}

Only include categories that have relevant information. Respond with valid JSON only.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a construction project manager expert. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const aiSummary = completion.choices[0].message.content;

      // Usage tracking for reports removed - not implemented yet
      // await incrementUsage(userId, "reports");

      // Log for audit
      await logApiUsage(userId, "generateReport", true, {
        projectName,
        noteCount: selectedNotes.length,
      });

      return {
        aiSummary,
        success: true
      };
    } catch (error) {
      console.error("Report generation error:", error);

      await logApiUsage(userId, "generateReport", false, {
        error: error.message,
        projectName,
      });

      if (error.status === 429) {
        throw new functions.https.HttpsError("resource-exhausted", "OpenAI rate limit exceeded. Please try again later.");
      }

      throw new functions.https.HttpsError("internal", `Report generation failed: ${error.message}`);
    }
  });

// ============================================
// CLOUD FUNCTION 3: SEND CHAT MESSAGE
// ============================================

exports.sendChatMessage = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 60,
    memory: "512MB"
  })
  .https.onCall(async (data, context) => {
    const userId = await verifyAuth(context);
    const { messages, voiceNoteContext } = data;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "messages array is required"
      );
    }

    // Check advanced rate limits (per-minute, per-hour, per-day)
    await checkAllRateLimits(userId, "sendChatMessage");

    // Check monthly subscription quota
    await checkMonthlyQuota(userId, "chat");

    try {
      const openai = getOpenAIClient();

      // Build system message with context
      const systemMessage = {
        role: "system",
        content: `You are a helpful AI assistant helping a user understand and analyze their voice notes.

${voiceNoteContext ? `Here's the context from their recent voice notes:

${voiceNoteContext}

Use this context to provide relevant and helpful responses about their voice notes.` : 'No voice note context is currently available.'}

Be conversational, helpful, and concise.`
      };

      const conversationMessages = [systemMessage, ...messages];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationMessages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;

      // Usage tracking for chat removed - not implemented yet
      // await incrementUsage(userId, "chat");

      // Log for audit
      await logApiUsage(userId, "sendChatMessage", true, {
        messageCount: messages.length,
      });

      return {
        response,
        success: true
      };
    } catch (error) {
      console.error("Chat error:", error);

      await logApiUsage(userId, "sendChatMessage", false, {
        error: error.message,
      });

      if (error.status === 429) {
        throw new functions.https.HttpsError("resource-exhausted", "OpenAI rate limit exceeded. Please try again later.");
      }

      throw new functions.https.HttpsError("internal", `Chat failed: ${error.message}`);
    }
  });

// ============================================
// CLOUD FUNCTION 4: STREAMING CHAT MESSAGE
// ============================================

exports.streamChatMessage = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB"
  })
  .https.onRequest(async (req, res) => {
    // Handle CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let userId;

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const { messages, voiceNoteContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    try {
      // Check rate limits
      await checkAllRateLimits(userId, "sendChatMessage");
      await checkMonthlyQuota(userId, "chat");

      const openai = getOpenAIClient();

      // Build system message with context
      const systemMessage = {
        role: "system",
        content: `You are a helpful AI assistant helping a user understand and analyze their voice notes.

${voiceNoteContext ? `Here's the context from their recent voice notes:

${voiceNoteContext}

Use this context to provide relevant and helpful responses about their voice notes.` : 'No voice note context is currently available.'}

Be conversational, helpful, and concise.`
      };

      const conversationMessages = [systemMessage, ...messages];

      // Set up SSE headers
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationMessages,
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      });

      // Stream chunks to client
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Send done signal
      res.write('data: [DONE]\n\n');
      res.end();

      // Log for audit
      await logApiUsage(userId, "streamChatMessage", true, {
        messageCount: messages.length,
      });

    } catch (error) {
      console.error("Streaming chat error:", error);

      await logApiUsage(userId, "streamChatMessage", false, {
        error: error.message,
      });

      // If headers haven't been sent, send error as JSON
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        // If streaming has started, send error in stream format
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  });

// ============================================
// CLOUD FUNCTION: PROCESS TEMPLATE BLOCKS (BATCH)
// ============================================

exports.processTemplateBlocks = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB"
  })
  .https.onCall(async (data, context) => {
    const userId = await verifyAuth(context);
    const { blocks, transcriptions, projectName } = data;

    // Validate input
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "blocks array is required"
      );
    }

    if (!transcriptions || typeof transcriptions !== 'string') {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "transcriptions string is required"
      );
    }

    // Check rate limits and quota
    await checkAllRateLimits(userId, "generateReport");
    await checkMonthlyQuota(userId, "reports");

    try {
      const openai = getOpenAIClient();

      // Build the sections list for the prompt
      const sectionsList = blocks
        .map((block, index) => `${index}: ${block.promptText}`)
        .join('\n');

      // Build the comprehensive prompt
      const systemPrompt = `You are a construction report generator. You will receive voice note transcriptions and a list of report sections to fill.

CRITICAL INSTRUCTIONS:
- Each piece of information should appear in ONLY ONE section (the most relevant one)
- Do NOT repeat the same information across multiple sections
- EXCEPTION: Summary sections may reference information from other sections
- If NO relevant information is found in the voice notes for a section, respond with exactly: "No information provided"
- Do NOT make up or assume information that is not explicitly stated in the voice notes
- Be factual and concise
- Use plain text only, no markdown formatting (no **, ##, -, *, etc.)
- For lists, put each item on a new line without bullet points

You MUST respond with a valid JSON object where keys are the section indices (as strings) and values are the content for each section.`;

      const userPrompt = `PROJECT: ${projectName || 'Construction Project'}

VOICE NOTES TRANSCRIPTIONS:
${transcriptions}

REPORT SECTIONS TO FILL:
${sectionsList}

Respond with a JSON object. Example format:
{
  "0": "Content for first section...",
  "1": "No information provided",
  "2": "Content for third section..."
}

Generate the content for each section based ONLY on the information in the voice notes:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;

      // Parse the JSON response
      let blockResponses;
      try {
        blockResponses = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", responseText);
        throw new Error("AI response was not valid JSON");
      }

      // Increment usage
      await incrementUsage(userId, "reports");

      // Log for audit
      await logApiUsage(userId, "processTemplateBlocks", true, {
        blockCount: blocks.length,
        projectName: projectName || 'unknown'
      });

      return {
        blockResponses,
        success: true
      };
    } catch (error) {
      console.error("Process template blocks error:", error);

      await logApiUsage(userId, "processTemplateBlocks", false, {
        error: error.message,
        blockCount: blocks?.length || 0
      });

      if (error.status === 429) {
        throw new functions.https.HttpsError("resource-exhausted", "OpenAI rate limit exceeded. Please try again later.");
      }

      throw new functions.https.HttpsError("internal", `Template processing failed: ${error.message}`);
    }
  });

// ============================================
// CLOUD FUNCTION 5: GENERATE WORD DOCUMENT
// ============================================

exports.generateWordDocument = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB"
  })
  .https.onCall(async (data, context) => {
    const userId = await verifyAuth(context);
    const { reportData, projectName, dateRange } = data;

    if (!reportData) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "reportData is required"
      );
    }

    // Check advanced rate limits
    await checkAllRateLimits(userId, "generateReport");

    try {
      // Parse AI summary if it's a string
      let parsedReport;
      try {
        parsedReport = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;
      } catch (error) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid report data format"
        );
      }

      // Sanitize all text content
      const sanitizedProjectName = sanitizeTextForWord(projectName || 'Construction Project');
      const sanitizedDateRange = `${dateRange?.start || 'N/A'} - ${dateRange?.end || 'N/A'}`;

      // Create Word document with docx library
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: sanitizedProjectName,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Date Range
            new Paragraph({
              text: `Daily Report: ${sanitizedDateRange}`,
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Summary Section
            ...(parsedReport.summary ? [
              new Paragraph({
                text: "Executive Summary",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              new Paragraph({
                text: sanitizeTextForWord(parsedReport.summary),
                spacing: { after: 300 },
              }),
            ] : []),

            // Categories
            ...generateCategorySections(parsedReport.categories || {}),

            // Key Events
            ...(parsedReport.keyEvents && parsedReport.keyEvents.length > 0 ? [
              new Paragraph({
                text: "Key Events",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              ...parsedReport.keyEvents.map(event =>
                new Paragraph({
                  text: `• ${sanitizeTextForWord(event)}`,
                  spacing: { after: 100 },
                })
              ),
            ] : []),

            // Recommendations
            ...(parsedReport.recommendations && parsedReport.recommendations.length > 0 ? [
              new Paragraph({
                text: "Recommendations",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              ...parsedReport.recommendations.map(rec =>
                new Paragraph({
                  text: `• ${sanitizeTextForWord(rec)}`,
                  spacing: { after: 100 },
                })
              ),
            ] : []),
          ],
        }],
      });

      // Convert document to buffer
      const buffer = await Packer.toBuffer(doc);

      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `reports/${userId}/${Date.now()}_report.docx`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          metadata: {
            userId,
            projectName: sanitizedProjectName,
          },
        },
      });

      // Get signed URL (valid for 1 hour)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      // Log for audit
      await logApiUsage(userId, "generateWordDocument", true, {
        projectName: sanitizedProjectName,
        fileName,
      });

      return {
        downloadUrl: url,
        fileName: fileName.split('/').pop(),
        success: true,
      };
    } catch (error) {
      console.error("Word document generation error:", error);

      await logApiUsage(userId, "generateWordDocument", false, {
        error: error.message,
      });

      throw new functions.https.HttpsError("internal", `Document generation failed: ${error.message}`);
    }
  });

/**
 * Generate paragraphs for report categories
 */
function generateCategorySections(categories) {
  const sections = [];
  const categoryLabels = {
    workPerformed: "Work Performed",
    safetyIncidents: "Safety Incidents",
    materials: "Materials",
    equipment: "Equipment",
    weather: "Weather Conditions",
    crew: "Crew Information",
    issues: "Issues and Delays",
    progress: "Project Progress",
  };

  for (const [key, data] of Object.entries(categories)) {
    if (!data || !data.content) continue;

    const label = categoryLabels[key] || key;

    sections.push(
      new Paragraph({
        text: label,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
      new Paragraph({
        text: sanitizeTextForWord(data.content),
        spacing: { after: 200 },
      })
    );

    // Add details if available
    if (data.details && Array.isArray(data.details) && data.details.length > 0) {
      sections.push(
        ...data.details.map(detail =>
          new Paragraph({
            text: `• ${sanitizeTextForWord(detail)}`,
            spacing: { after: 100 },
          })
        )
      );
    }
  }

  return sections;
}

// ============================================
// CLOUD FUNCTION 5: INITIALIZE NEW USERS
// ============================================

exports.initializeUser = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  await db.collection("users").doc(user.uid).set({
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionTier: "starter",
    transcriptionUsage: 0,
    // Reports and chat usage tracking removed - not implemented yet
    currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
    currentPeriodEnd: getNextMonthTimestamp(),
    subscriptionStatus: "active", // active on free tier
    isLegacyUser: false, // New users are not legacy
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTimestamp(ts) {
  if (!ts) return "Unknown time";
  if (typeof ts === 'object' && ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "Unknown time";
  }
}

function getNextMonthTimestamp() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return admin.firestore.Timestamp.fromDate(nextMonth);
}

/**
 * Sanitize text for Word document
 * Removes potentially dangerous content and ensures safe rendering
 */
function sanitizeTextForWord(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove any potential XML/HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit length to prevent DoS
  if (sanitized.length > 50000) {
    sanitized = sanitized.slice(0, 50000) + '... (truncated)';
  }

  return sanitized;
}

// ============================================
// CLOUD FUNCTION 6: ENSURE USER DOCUMENT EXISTS
// ============================================

/**
 * Callable function to ensure a user document exists
 * This helps with existing users who signed up before the initializeUser trigger was deployed
 */
exports.ensureUserDocument = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const userId = await verifyAuth(context);
    const db = admin.firestore();

    try {
      const userDocRef = db.collection("users").doc(userId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        const user = context.auth.token;
        await userDocRef.set({
          email: user.email,
          displayName: user.name || null,
          photoURL: user.picture || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          subscriptionTier: "starter",
          transcriptionUsage: 0,
          // Reports and chat usage tracking removed - not implemented yet
          currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
          currentPeriodEnd: getNextMonthTimestamp(),
          subscriptionStatus: "active",
          isLegacyUser: false,
        });

        return {
          created: true,
          message: "User document created successfully"
        };
      }

      return {
        created: false,
        message: "User document already exists"
      };
    } catch (error) {
      console.error("Error ensuring user document:", error);
      throw new functions.https.HttpsError("internal", `Failed to ensure user document: ${error.message}`);
    }
  });

