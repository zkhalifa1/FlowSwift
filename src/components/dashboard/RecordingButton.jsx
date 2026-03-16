import { Mic, X, Check } from "lucide-react";
import React, { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/apis/firebase/config";
import { useAuth } from "../../contexts/authContext";
import { useTranscription } from "@/hooks/useTranscription";
import { logger } from "@/utils/logger";
import { colors } from "@/styles/colors";
import fixWebmDuration from "webm-duration-fix";

export default function RecordingButton({ forceRefresh }) {
  const { currentUser } = useAuth();
  const { transcribeNote, isConfigured: isTranscriptionConfigured } =
    useTranscription();
  const [isRecording, setIsRecording] = useState(false);
  const [isReadyToUpload, setIsReadyToUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordedMimeType, setRecordedMimeType] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      // Request audio with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Debug: Log audio track info
      const audioTrack = stream.getAudioTracks()[0];
      logger.info('Audio track label:', audioTrack.label);
      logger.info('Audio track enabled:', audioTrack.enabled);
      logger.info('Audio track muted:', audioTrack.muted);
      logger.info('Audio track settings:', JSON.stringify(audioTrack.getSettings()));

      streamRef.current = stream;

      // Determine best supported mimeType
      // Try mp4 first for better compatibility
      let mimeType = '';
      const types = [
        'audio/mp4',
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      logger.info('Using mimeType:', mimeType || 'browser default');

      // Create MediaRecorder with mimeType
      const options = mimeType ? { mimeType } : {};
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          logger.info('Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const actualMimeType = mediaRecorderRef.current.mimeType || mimeType || 'audio/webm';
        let audioBlob = new Blob(audioChunksRef.current, {
          type: actualMimeType,
        });
        logger.info('Recording stopped. Total size:', audioBlob.size, 'bytes');
        logger.info('MimeType used:', actualMimeType);

        // Fix WebM duration metadata if it's a webm file
        if (actualMimeType.includes('webm')) {
          try {
            logger.info('Fixing WebM duration metadata...');
            audioBlob = await fixWebmDuration(audioBlob);
            logger.info('WebM duration fixed. New size:', audioBlob.size, 'bytes');
          } catch (err) {
            logger.warn('Could not fix WebM duration:', err);
            // Continue with unfixed blob
          }
        }

        setAudioBlob(audioBlob);
        setRecordedMimeType(actualMimeType);
        setIsReadyToUpload(true);

        // Stop all tracks to release microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      audioChunksRef.current = [];

      // Request data frequently for better reliability
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      logger.info('Recording started');
    } catch (error) {
      logger.error('Error starting recording:', error);
      alert('Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsReadyToUpload(false);
    setAudioBlob(null);
    setRecordedMimeType(null);
    audioChunksRef.current = [];
  };

  const uploadRecording = async () => {
    logger.info('uploadRecording called. audioBlob:', audioBlob);
    logger.info('audioBlob size:', audioBlob?.size, 'type:', audioBlob?.type);

    if (!audioBlob) {
      logger.error('No audioBlob available!');
      return;
    }
    if (!currentUser) return;
    if (isUploading) return;

    setIsUploading(true);

    try {
      // Determine file extension from mimeType
      let extension = 'webm'; // default
      if (recordedMimeType) {
        if (recordedMimeType.includes('mp4')) {
          extension = 'mp4';
        } else if (recordedMimeType.includes('ogg')) {
          extension = 'ogg';
        } else if (recordedMimeType.includes('wav')) {
          extension = 'wav';
        }
      }
      logger.info('Using file extension:', extension);

      // Generate a unique ID for the file (we'll use this as the doc ID too)
      const noteId = crypto.randomUUID();
      const timestamp = new Date();

      // STEP 1: Upload audio to Storage FIRST (before creating Firestore doc)
      // This prevents the race condition where onSnapshot fires before audio is ready
      const storagePath = `voice_notes/${currentUser.uid}/${noteId}.${extension}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, audioBlob);
      const downloadURL = await getDownloadURL(fileRef);
      logger.info('Audio uploaded successfully:', downloadURL);

      // STEP 2: Create Firestore doc with ALL data at once (including downloadURL)
      // This ensures onSnapshot never sees a doc without a downloadURL
      const voiceNotesRef = collection(
        db,
        "users",
        currentUser.uid,
        "voiceNotes",
      );
      const docRef = await addDoc(voiceNotesRef, {
        timestamp,
        downloadURL,
        storagePath,
        transcription: null,
        transcriptionStatus: null,
        transcriptionError: null,
        lastTranscriptionAttempt: null,
        validationStatus: null,
        validationReason: null,
        audioMetrics: null,
      });

      logger.info('Firestore doc created with downloadURL:', docRef.id);

      cancelRecording();
      setIsUploading(false);

      if (isTranscriptionConfigured) {
        transcribeNote(docRef.id, storagePath, `${docRef.id}.${extension}`)
          .then(() => {
            logger.info("Transcription completed successfully");
          })
          .catch((transcriptionError) => {
            logger.error(
              "Transcription failed, but upload succeeded:",
              transcriptionError,
            );
          });
      } else {
        logger.info(
          "Transcription not configured - add VITE_OPENAI_API_KEY to enable automatic transcription",
        );
      }

      if (forceRefresh) {
        forceRefresh();
      }
    } catch (error) {
      logger.error("Error uploading voice note:", error);
      cancelRecording();
      setIsUploading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {/* Idle state – small circular mic button */}
      {!isRecording && !isReadyToUpload && (
        <button
          onClick={startRecording}
          className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.primary.main,
          }}
          title="Start recording"
        >
          <Mic className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Recording state – same size, square stop icon */}
      {isRecording && (
        <button
          onClick={stopRecording}
          className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.primary.main,
          }}
          title="Stop recording"
        >
          <div className="w-4 h-4 rounded-sm bg-white" />
        </button>
      )}

      {/* Ready-to-upload state – small cancel + confirm buttons */}
      {isReadyToUpload && (
        <>
          <button
            onClick={cancelRecording}
            disabled={isUploading}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.text.tertiary,
            }}
            title="Discard recording"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={uploadRecording}
            disabled={isUploading}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.primary.main,
            }}
            title="Save recording"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
