import { useState, useCallback } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/apis/firebase/config';
import { useAuth } from '@/contexts/authContext';
import { transcribeAudio, isTranscriptionConfigured } from '@/apis/openai/transcription';
// Audio validation disabled - OpenAI Whisper handles validation on backend
// import { validateAudioForTranscription } from '@/apis/audio/validation';
import { logger } from "@/utils/logger";
import { generateNoteName } from '@/utils/aiNameGenerator';


// Audio validation disabled - helper function removed
// OpenAI Whisper API handles all validation on the backend

/**
 * Hook for managing voice note transcription
 */
export function useTranscription() {
  const { currentUser } = useAuth();
  const [isTranscribing, setIsTranscribing] = useState(false);

  /**
   * Transcribe a voice note with audio validation
   * @param {string} noteId - Firestore document ID
   * @param {string} downloadURL - URL of the audio file
   * @param {string} fileName - Name of the audio file
   */
  const transcribeNote = useCallback(async (noteId, downloadURL, fileName = 'audio.webm') => {
    if (!currentUser || !noteId || !downloadURL) {
      throw new Error('Missing required parameters for transcription');
    }

    if (!isTranscriptionConfigured()) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    setIsTranscribing(true);
    const noteRef = doc(db, 'users', currentUser.uid, 'voiceNotes', noteId);

    try {
      // Update status to processing
      await updateDoc(noteRef, {
        transcriptionStatus: 'processing',
        lastTranscriptionAttempt: new Date(),
        transcriptionError: null
      });

      // Get the storagePath from the note document (required by Cloud Function)
      const noteDoc = await getDoc(noteRef);
      const noteData = noteDoc.data();
      const storagePath = noteData?.storagePath;

      if (!storagePath) {
        throw new Error('Storage path not found in note document');
      }

      // Call transcription directly - OpenAI Whisper handles validation
      const transcription = await transcribeAudio(storagePath, fileName);

      // Generate AI name from transcription
      const aiGeneratedName = await generateNoteName(transcription);

      // Update with successful transcription and AI name
      await updateDoc(noteRef, {
        transcription,
        transcriptionStatus: 'completed',
        transcriptionError: null,
        aiGeneratedName: aiGeneratedName || null
      });

      return transcription;
    } catch (error) {
      logger.error('Transcription failed:', error);
      
      // If not already updated with skip status, mark as failed
      if (!error.message.includes('Audio validation failed')) {
        await updateDoc(noteRef, {
          transcriptionStatus: 'failed',
          transcriptionError: error.message
        });
      }

      throw error;
    } finally {
      setIsTranscribing(false);
    }
  }, [currentUser]);

  /**
   * Retry transcription for a failed note
   * @param {Object} note - Voice note object
   */
  const retryTranscription = useCallback(async (note) => {
    if (!note.storagePath && !note.downloadURL) {
      throw new Error('No storage path or download URL available for transcription');
    }

    // Prefer storagePath, fall back to downloadURL (for old notes)
    const pathOrUrl = note.storagePath || note.downloadURL;
    return transcribeNote(note.id, pathOrUrl, `${note.id}.webm`);
  }, [transcribeNote]);

  /**
   * Check if a note needs transcription
   * @param {Object} note - Voice note object
   * @returns {boolean}
   */
  const needsTranscription = useCallback((note) => {
    return !note.transcription && 
           note.transcriptionStatus !== 'processing' &&
           note.downloadURL;
  }, []);

  /**
   * Get transcription status display info
   * @param {Object} note - Voice note object
   * @returns {Object} Status info for UI display
   */
  const getTranscriptionStatus = useCallback((note) => {
    if (!note.transcriptionStatus) {
      return { status: 'pending', message: 'Pending transcription', color: 'text-gray-500' };
    }

    switch (note.transcriptionStatus) {
      case 'pending':
        return { status: 'pending', message: 'Pending transcription', color: 'text-gray-500' };
      case 'processing':
        return { status: 'processing', message: 'Transcribing...', color: 'text-blue-500' };
      case 'completed':
        return { status: 'completed', message: 'Transcribed', color: 'text-green-500' };
      case 'failed':
        return { 
          status: 'failed', 
          message: `Failed: ${note.transcriptionError || 'Unknown error'}`, 
          color: 'text-red-500' 
        };
      case 'skipped_too_short':
        return { status: 'skipped', message: 'Skipped: Too short', color: 'text-yellow-500' };
      case 'skipped_too_quiet':
        return { status: 'skipped', message: 'Skipped: Too quiet', color: 'text-yellow-500' };
      case 'skipped_no_speech':
        return { status: 'skipped', message: 'Skipped: No speech', color: 'text-yellow-500' };
      case 'skipped_too_long':
        return { status: 'skipped', message: 'Skipped: Too long', color: 'text-yellow-500' };
      case 'validation_failed':
        return { status: 'skipped', message: 'Skipped: Validation failed', color: 'text-yellow-500' };
      default:
        return { status: 'unknown', message: 'Unknown status', color: 'text-gray-500' };
    }
  }, []);

  return {
    transcribeNote,
    retryTranscription,
    needsTranscription,
    getTranscriptionStatus,
    isTranscribing,
    isConfigured: isTranscriptionConfigured()
  };
}