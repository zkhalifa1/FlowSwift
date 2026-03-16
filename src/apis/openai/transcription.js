import { httpsCallable } from 'firebase/functions';
import { cloudFunctions } from '../firebase/config';
import { logger } from "@/utils/logger";


// Initialize Cloud Function callable
const transcribeAudioFunction = httpsCallable(cloudFunctions, 'transcribeAudio');

/**
 * Transcribe audio file using OpenAI Whisper API (via secure Cloud Function)
 * @param {string} audioStoragePath - Storage path of the audio file (e.g., "voice_notes/userId/filename.webm")
 * @param {string} fileName - Name of the audio file (for reference only)
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioStoragePath, fileName = 'audio.webm') {
  try {
    // Call secure Cloud Function instead of OpenAI directly
    const result = await transcribeAudioFunction({
      audioStoragePath
    });

    if (!result.data.success) {
      throw new Error('Transcription failed');
    }

    return result.data.transcription;
  } catch (error) {
    logger.error('Transcription error:', error);

    // Handle specific error types from Cloud Functions
    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to transcribe audio');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('Monthly transcription limit reached. Please upgrade your plan.');
    }

    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Estimate transcription cost based on audio duration
 * @param {number} durationMinutes - Duration in minutes
 * @returns {number} - Estimated cost in USD
 */
export function estimateTranscriptionCost(durationMinutes) {
  const costPerMinute = 0.006; // $0.006 per minute as of 2024
  return durationMinutes * costPerMinute;
}

/**
 * Check if transcription is configured (Cloud Functions should always be available)
 * @returns {boolean} - True if Cloud Functions are available
 */
export function isTranscriptionConfigured() {
  // With Cloud Functions, transcription is always available if user is authenticated
  return true;
}