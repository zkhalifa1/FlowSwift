import { logger } from "./logger";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Generate a short, descriptive name for a voice note based on its transcription
 * @param {string} transcription - The transcription text
 * @returns {Promise<string>} - A short descriptive name (max 50 chars)
 */
export async function generateNoteName(transcription) {
  logger.info("Attempting to generate AI name...");
  logger.info("API Key present:", !!OPENAI_API_KEY);
  logger.info("API Key length:", OPENAI_API_KEY?.length || 0);

  if (!OPENAI_API_KEY) {
    logger.warn("OpenAI API key not configured for AI name generation");
    return null;
  }

  if (!transcription || transcription.trim().length === 0) {
    logger.warn("No transcription provided for name generation");
    return null;
  }

  logger.info("Transcription length:", transcription.length);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates short, descriptive titles for construction daily report voice notes. Generate a concise title (maximum 50 characters) that captures the main topic or activity described in the transcription. Return only the title, nothing else.",
          },
          {
            role: "user",
            content: `Generate a title for this voice note: "${transcription}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 30,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedName = data.choices[0]?.message?.content?.trim();

    if (generatedName) {
      // Remove quotes if present
      const cleanedName = generatedName.replace(/^["']|["']$/g, "");
      logger.info("AI name generated successfully:", cleanedName);
      return cleanedName;
    }

    logger.warn("No name in API response");
    return null;
  } catch (error) {
    logger.error("Error generating AI name:", error);
    return null;
  }
}
