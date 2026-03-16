import { httpsCallable } from 'firebase/functions';
import { cloudFunctions, auth } from '../firebase/config';
import { logger } from "@/utils/logger";

// Cloud Function URLs
const FUNCTIONS_BASE_URL = 'https://us-central1-flowswift-1a8cc.cloudfunctions.net';

// Initialize Cloud Function callables
const sendChatMessageFunction = httpsCallable(cloudFunctions, 'sendChatMessage');
const processTemplateBlocksFunction = httpsCallable(cloudFunctions, 'processTemplateBlocks');

/**
 * Send a message to OpenAI GPT and get response (via secure Cloud Function)
 * @param {Array} messages - Array of message objects {role: 'user'|'assistant'|'system', content: string}
 * @param {string} voiceNoteContext - Context from voice note transcriptions
 * @returns {Promise<string>} - AI response
 */
export async function sendChatMessage(messages, voiceNoteContext = '') {
  try {
    // Call secure Cloud Function instead of OpenAI directly
    const result = await sendChatMessageFunction({
      messages,
      voiceNoteContext
    });

    if (!result.data.success) {
      throw new Error('Chat failed');
    }

    return result.data.response;
  } catch (error) {
    logger.error('Chat completion error:', error);

    // Handle specific error types from Cloud Functions
    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to use chat');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('Monthly chat limit reached. Please upgrade your plan or try again later.');
    }

    throw new Error(`Chat failed: ${error.message}`);
  }
}

/**
 * Process multiple template blocks in a single API call (via secure Cloud Function)
 * This batches all blocks together so the LLM can see the full report structure
 * and avoid repetitive content across sections.
 *
 * @param {Array} blocks - Array of block objects {id: number, promptText: string}
 * @param {string} transcriptions - Combined voice note transcriptions
 * @param {string} projectName - Name of the project
 * @returns {Promise<Object>} - Object mapping block IDs to their generated content
 */
export async function processTemplateBlocks(blocks, transcriptions, projectName) {
  try {
    const result = await processTemplateBlocksFunction({
      blocks,
      transcriptions,
      projectName
    });

    if (!result.data.success) {
      throw new Error('Template processing failed');
    }

    return result.data.blockResponses;
  } catch (error) {
    logger.error('Process template blocks error:', error);

    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to generate reports');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('Monthly report limit reached. Please upgrade your plan or try again later.');
    }

    throw new Error(`Template processing failed: ${error.message}`);
  }
}

/**
 * Send a streaming message to OpenAI GPT (via secure Cloud Function)
 * @param {Array} messages - Array of message objects
 * @param {string} voiceNoteContext - Context from voice note transcriptions
 * @param {Function} onChunk - Callback for each chunk of text
 * @returns {Promise<string>} - Complete AI response
 */
export async function streamChatMessage(messages, voiceNoteContext = '', onChunk) {
  try {
    // Get current user's ID token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }
    const idToken = await user.getIdToken();

    const response = await fetch(`${FUNCTIONS_BASE_URL}/streamChatMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        messages,
        voiceNoteContext,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Streaming failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              onChunk?.(parsed.content, fullResponse);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    logger.error('Streaming chat error:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

/**
 * Estimate chat cost based on token usage
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} - Estimated cost in USD
 */
export function estimateChatCost(inputTokens, outputTokens) {
  // GPT-4o-mini pricing as of 2024
  const inputCostPerToken = 0.00000015; // $0.150 per 1M tokens
  const outputCostPerToken = 0.0000006; // $0.600 per 1M tokens
  
  return (inputTokens * inputCostPerToken) + (outputTokens * outputCostPerToken);
}

/**
 * Check if chat is configured properly (Cloud Functions should always be available)
 * @returns {boolean} - True if Cloud Functions are available
 */
export function isChatConfigured() {
  // With Cloud Functions, chat is always available if user is authenticated
  return true;
}

/**
 * Count approximate tokens in text (rough estimation)
 * @param {string} text - Text to count tokens for
 * @returns {number} - Approximate token count
 */
export function estimateTokens(text) {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}