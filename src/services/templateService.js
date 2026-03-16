import mammoth from 'mammoth';
import PizZip from 'pizzip';
import { sendChatMessage, processTemplateBlocks } from '../apis/openai/chat';
import { logger } from "@/utils/logger";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "@/apis/firebase/config";


export async function extractPrompts(docxFile) {
  try {
    const arrayBuffer = await docxFile.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    const promptRegex = /\{\{\{([\s\S]*?)\}\}\}/g;
    const prompts = [];
    let match;

    while ((match = promptRegex.exec(text)) !== null) {
      prompts.push({
        text: match[1].trim(),
        fullMatch: match[0]
      });
    }
    
    return prompts;
  } catch (error) {
    logger.error('Error extracting prompts:', error);
    throw new Error('Failed to extract prompts from template');
  }
}

export function validateTemplate(text) {
  const errors = [];
  
  const openBraces = (text.match(/\{\{\{/g) || []).length;
  const closeBraces = (text.match(/\}\}\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} opening {{{ but ${closeBraces} closing }}}`);
  }
  
  const malformedRegex = /\{\{\{(?![^}]*\}\}\})/g;
  const malformed = text.match(malformedRegex);
  if (malformed) {
    errors.push(`Found ${malformed.length} unclosed prompts`);
  }
  
  return errors;
}

export async function getPromptResponse(prompt, transcriptions, onProgress = null) {
  try {
    if (onProgress) {
      onProgress({
        type: 'ai_thinking',
        message: `🤖 Analyzing "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}" from your voice notes...`,
        promptText: prompt
      });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a technical report generator. Extract and present ONLY factual information from voice notes.

CRITICAL RULES:
- NO conversational phrases like "Here is...", "Based on...", "I hope this helps", etc.
- NO markdown formatting (no **, ##, -, *, etc.)
- NO opening or closing statements
- Start directly with the technical content
- Use plain text only
- For multiple items, put each on a new line
- Be concise, factual, and technical`
      },
      {
        role: 'user',
        content: `Extract relevant information from the voice notes for this report field. Provide ONLY the factual content without any conversational framing.

Voice Notes Transcriptions:
${transcriptions}

Report Field to Populate:
${prompt}

Output ONLY the factual content - no introductions, no conclusions, no markdown. Put each separate item on its own line.`
      }
    ];

    const response = await sendChatMessage(messages);

    if (onProgress) {
      onProgress({
        type: 'ai_complete',
        message: `✨ Got some great insights for "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}!"`,
        promptText: prompt,
        preview: response.substring(0, 100) + (response.length > 100 ? '...' : '')
      });
    }

    return response;
  } catch (error) {
    logger.error('Error getting AI response:', error);
    if (onProgress) {
      onProgress({
        type: 'ai_error',
        message: `😅 Hit a snag with "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}", but I'll keep going...`,
        promptText: prompt
      });
    }
    return "AI encountered an error";
  }
}

export async function processTemplate(docxFile, selectedNotes, projectName, onProgress = null) {
  try {
    if (onProgress) {
      onProgress({
        type: 'start',
        message: '🤖 Hey! I\'m working on your report...',
        step: 0,
        totalSteps: 5
      });
    }

    const arrayBuffer = await docxFile.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    if (onProgress) {
      onProgress({
        type: 'analyzing',
        message: '📄 Analyzing your template structure...',
        step: 1,
        totalSteps: 5
      });
    }

    const transcriptions = selectedNotes
      .filter(note => {
        return typeof note.hasTranscription === 'function' 
          ? note.hasTranscription() 
          : note.transcription && note.transcription.trim();
      })
      .map(note => note.transcription)
      .join('\n\n');
    
    const documentXml = zip.files['word/document.xml'];
    if (!documentXml) {
      throw new Error('Invalid DOCX file structure');
    }
    
    let content = documentXml.asText();
    const promptRegex = /\{\{\{([\s\S]*?)\}\}\}/g;
    const prompts = [];
    let match;

    while ((match = promptRegex.exec(content)) !== null) {
      prompts.push({
        fullMatch: match[0],
        promptText: match[1].trim()
      });
    }

    if (onProgress) {
      onProgress({
        type: 'prompts_found',
        message: `📝 Found ${prompts.length} sections to fill out! Now analyzing your voice notes...`,
        step: 2,
        totalSteps: 5,
        promptCount: prompts.length
      });
    }

    // Prepare blocks for batch processing
    const blocksForApi = prompts.map((prompt, index) => ({
      id: index,
      promptText: prompt.promptText
    }));

    if (onProgress) {
      onProgress({
        type: 'processing_prompt',
        message: `🎯 Generating all ${prompts.length} sections in one go for better quality...`,
        step: 3,
        totalSteps: 5,
        currentPrompt: 1,
        totalPrompts: prompts.length
      });
    }

    // Single API call for all blocks - eliminates repetition by giving LLM full context
    const blockResponses = await processTemplateBlocks(blocksForApi, transcriptions, projectName);

    // Replace each block with its generated content
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const aiResponse = blockResponses[String(i)] || 'No information provided';
      // Keep brackets around AI response for preview functionality
      content = content.replace(prompt.fullMatch, `{{{${aiResponse}}}}`);
    }

    if (onProgress) {
      onProgress({
        type: 'assembling',
        message: '📄 Almost done! Putting everything together into your final report...',
        step: 4,
        totalSteps: 5
      });
    }

    zip.file('word/document.xml', content);
    const modifiedBuffer = zip.generate({ type: 'arraybuffer' });

    if (onProgress) {
      onProgress({
        type: 'complete',
        message: '🎉 Your report is ready! Preparing download...',
        step: 5,
        totalSteps: 5
      });
    }
    
    return new Blob([modifiedBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
  } catch (error) {
    logger.error('Error processing template:', error);
    if (onProgress) {
      onProgress({
        type: 'error',
        message: '😅 Oops! Something went wrong, but don\'t worry - we can try again!',
        error: error.message
      });
    }
    // Preserve the original error message for debugging
    throw new Error(`Failed to process template: ${error.message}`);
  }
}

export function generateReportFilename() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);

  return `flow_report_${day}_${month}_${year}.docx`;
}

/**
 * Clean a report by removing all {{{ and }}} markers while keeping content
 * @param {string} downloadURL - The Firebase Storage download URL
 * @returns {Promise<Blob>} - Cleaned document blob
 */
export async function cleanReportForDownload(downloadURL) {
  try {
    const response = await fetch(downloadURL);
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const documentXml = zip.files['word/document.xml'];
    if (!documentXml) {
      throw new Error('Invalid DOCX file structure');
    }

    let content = documentXml.asText();

    // Remove all {{{ and }}} markers while keeping the content inside
    content = content.replace(/\{\{\{/g, '');
    content = content.replace(/\}\}\}/g, '');

    zip.file('word/document.xml', content);
    const cleanedBuffer = zip.generate({ type: 'arraybuffer' });

    return new Blob([cleanedBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    logger.error('Error cleaning report:', error);
    throw new Error('Failed to clean report for download');
  }
}

/**
 * Extract blocks from a template stored in Firebase Storage
 * @param {string} downloadURL - The Firebase Storage download URL
 * @returns {Promise<Array>} - Array of { id, text } objects
 */
export async function extractBlocksFromTemplate(downloadURL) {
  try {
    const response = await fetch(downloadURL);
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const documentXml = zip.files['word/document.xml'];
    if (!documentXml) {
      throw new Error('Invalid DOCX file structure');
    }

    const content = documentXml.asText();
    // Use [\s\S]*? to match any character including newlines
    const promptRegex = /\{\{\{([\s\S]*?)\}\}\}/g;
    const blocks = [];
    let match;
    let id = 0;

    while ((match = promptRegex.exec(content)) !== null) {
      blocks.push({
        id: id++,
        text: match[1].trim(),           // Trimmed for display/editing
        originalText: match[1],          // Keep original with whitespace for replacement
        fullMatch: match[0]              // Store full match including {{{ }}}
      });
    }

    logger.info('Extracted blocks from template:', blocks.length);
    return blocks;
  } catch (error) {
    logger.error('Error extracting blocks:', error);
    throw new Error('Failed to extract blocks from template');
  }
}

/**
 * Save updated blocks back to the template
 * @param {string} downloadURL - The Firebase Storage download URL
 * @param {string} storagePath - The storage path for re-upload
 * @param {string} templateId - The Firestore document ID
 * @param {string} userId - The user ID
 * @param {Array} blocks - Array of { id, text, originalText } objects
 * @returns {Promise<string>} - New download URL
 */
export async function saveBlocksToTemplate(downloadURL, storagePath, templateId, userId, blocks) {
  try {
    // Download the original template
    const response = await fetch(downloadURL);
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const documentXml = zip.files['word/document.xml'];
    if (!documentXml) {
      throw new Error('Invalid DOCX file structure');
    }

    let content = documentXml.asText();

    // Replace each block that was modified
    for (const block of blocks) {
      // Compare trimmed text to detect changes (originalText is untrimmed)
      const originalTrimmed = block.originalText.trim();
      if (block.text !== originalTrimmed) {
        // Use fullMatch to find exact string in XML (includes whitespace)
        const newBlock = `{{{${block.text}}}}`;
        content = content.replace(block.fullMatch, newBlock);
        logger.info('Replaced block: ' + originalTrimmed.substring(0, 50) + '... -> ' + block.text.substring(0, 50) + '...');
      }
    }

    // Save the modified content back to the zip
    zip.file('word/document.xml', content);
    const modifiedBuffer = zip.generate({ type: 'arraybuffer' });
    const modifiedBlob = new Blob([modifiedBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Re-upload to Firebase Storage (same path overwrites)
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, modifiedBlob);
    const newDownloadURL = await getDownloadURL(fileRef);

    // Update Firestore with new URL
    const templateDoc = doc(db, 'users', userId, 'templates', templateId);
    await updateDoc(templateDoc, {
      downloadURL: newDownloadURL,
      lastModified: new Date()
    });

    logger.info('Template saved successfully');
    return newDownloadURL;
  } catch (error) {
    logger.error('Error saving template:', error);
    throw new Error('Failed to save template');
  }
}

/**
 * Save modified blocks back to a report's DOCX file
 * @param {string} downloadURL - Firebase Storage download URL
 * @param {string} storagePath - Firebase Storage path
 * @param {string} reportId - Firestore document ID
 * @param {string} userId - User ID
 * @param {Array} blocks - Array of block objects with text and originalText
 * @returns {Promise<string>} - New download URL
 */
export async function saveBlocksToReport(downloadURL, storagePath, reportId, userId, blocks) {
  try {
    // Download the original report
    const response = await fetch(downloadURL);
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const documentXml = zip.files['word/document.xml'];
    if (!documentXml) {
      throw new Error('Invalid DOCX file structure');
    }

    let content = documentXml.asText();

    // Replace each block that was modified
    for (const block of blocks) {
      // Compare trimmed text to detect changes (originalText is untrimmed)
      const originalTrimmed = block.originalText.trim();
      if (block.text !== originalTrimmed) {
        // Use fullMatch to find exact string in XML (includes whitespace)
        const newBlock = `{{{${block.text}}}}`;
        content = content.replace(block.fullMatch, newBlock);
        logger.info('Replaced block: ' + originalTrimmed.substring(0, 50) + '... -> ' + block.text.substring(0, 50) + '...');
      }
    }

    // Save the modified content back to the zip
    zip.file('word/document.xml', content);
    const modifiedBuffer = zip.generate({ type: 'arraybuffer' });
    const modifiedBlob = new Blob([modifiedBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Re-upload to Firebase Storage (same path overwrites)
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, modifiedBlob);
    const newDownloadURL = await getDownloadURL(fileRef);

    // Update Firestore with new URL (reports collection instead of templates)
    const reportDoc = doc(db, 'users', userId, 'reports', reportId);
    await updateDoc(reportDoc, {
      downloadURL: newDownloadURL,
      lastModified: new Date()
    });

    logger.info('Report saved successfully');
    return newDownloadURL;
  } catch (error) {
    logger.error('Error saving report:', error);
    throw new Error('Failed to save report');
  }
}