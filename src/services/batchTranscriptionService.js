import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/apis/firebase/config';
import { transcribeAudio, isTranscriptionConfigured } from '@/apis/openai/transcription';
import { logger } from "@/utils/logger";


/**
 * Service for batch transcription of existing voice notes
 */

/**
 * Analyze voice notes to find ones that need transcription
 * @param {Array} voiceNotes - Array of voice note objects
 * @returns {Object} Analysis of transcription needs
 */
export function analyzeTranscriptionNeeds(voiceNotes) {
  const analysis = {
    total: voiceNotes.length,
    needsTranscription: [],
    completed: [],
    pending: [],
    processing: [],
    failed: []
  };

  voiceNotes.forEach(note => {
    // Check if note needs transcription
    if (!note.downloadURL) {
      // Skip notes without audio files
      return;
    }

    switch (note.transcriptionStatus) {
      case 'completed':
        if (note.transcription) {
          analysis.completed.push(note);
        } else {
          // Has completed status but no transcription - needs retry
          analysis.needsTranscription.push(note);
        }
        break;
      case 'processing':
        analysis.processing.push(note);
        break;
      case 'failed':
        analysis.failed.push(note);
        analysis.needsTranscription.push(note);
        break;
      case 'pending':
      default:
        analysis.pending.push(note);
        analysis.needsTranscription.push(note);
        break;
    }
  });

  return analysis;
}

/**
 * Batch transcribe multiple voice notes with progress tracking
 * @param {Array} voiceNotes - Array of voice notes to transcribe
 * @param {string} userId - User ID for Firestore updates
 * @param {Function} onProgress - Progress callback (current, total, note)
 * @param {Function} onError - Error callback (error, note)
 * @returns {Promise<Object>} Results summary
 */
export async function batchTranscribe(voiceNotes, userId, onProgress = null, onError = null) {
  if (!isTranscriptionConfigured()) {
    throw new Error('OpenAI API key not configured');
  }

  const results = {
    total: voiceNotes.length,
    completed: 0,
    failed: 0,
    errors: []
  };

  // Process notes sequentially to avoid rate limiting
  for (let i = 0; i < voiceNotes.length; i++) {
    const note = voiceNotes[i];
    
    try {
      if (onProgress) {
        onProgress(i + 1, voiceNotes.length, note);
      }

      await transcribeVoiceNote(note, userId);
      results.completed++;
      
    } catch (error) {
      logger.error(`Failed to transcribe note ${note.id}:`, error);
      results.failed++;
      results.errors.push({ noteId: note.id, error: error.message });
      
      if (onError) {
        onError(error, note);
      }
    }

    // Add a small delay between requests to be respectful to the API
    if (i < voiceNotes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }

  return results;
}

/**
 * Transcribe a single voice note and update Firestore
 * @param {Object} note - Voice note object
 * @param {string} userId - User ID for Firestore path
 */
async function transcribeVoiceNote(note, userId) {
  const noteRef = doc(db, 'users', userId, 'voiceNotes', note.id);

  // Update status to processing
  await updateDoc(noteRef, {
    transcriptionStatus: 'processing',
    lastTranscriptionAttempt: new Date(),
    transcriptionError: null
  });

  try {
    // Perform transcription
    const transcription = await transcribeAudio(note.downloadURL, `${note.id}.webm`);

    // Update with successful transcription
    await updateDoc(noteRef, {
      transcription,
      transcriptionStatus: 'completed',
      transcriptionError: null
    });

    return transcription;
  } catch (error) {
    // Update with error status
    await updateDoc(noteRef, {
      transcriptionStatus: 'failed',
      transcriptionError: error.message
    });

    throw error;
  }
}

/**
 * Estimate cost for batch transcription
 * @param {Array} voiceNotes - Array of voice notes
 * @returns {Object} Cost estimation
 */
export function estimateBatchCost(voiceNotes) {
  // Rough estimate: assume average 2 minutes per voice note
  const averageMinutesPerNote = 2;
  const totalMinutes = voiceNotes.length * averageMinutesPerNote;
  const costPerMinute = 0.006; // OpenAI Whisper pricing
  const estimatedCost = totalMinutes * costPerMinute;

  return {
    noteCount: voiceNotes.length,
    estimatedMinutes: totalMinutes,
    estimatedCost: estimatedCost,
    costFormatted: `$${estimatedCost.toFixed(2)}`
  };
}

/**
 * Get batch transcription recommendations
 * @param {Object} analysis - Result from analyzeTranscriptionNeeds
 * @returns {Object} Recommendations
 */
export function getBatchRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.needsTranscription.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'All voice notes are already transcribed!'
    });
  } else {
    recommendations.push({
      type: 'info',
      message: `${analysis.needsTranscription.length} voice notes need transcription`
    });

    if (analysis.failed.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${analysis.failed.length} notes failed previously and will be retried`
      });
    }

    if (analysis.processing.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${analysis.processing.length} notes are currently being processed`
      });
    }
  }

  return {
    canProceed: analysis.needsTranscription.length > 0,
    recommendations
  };
}