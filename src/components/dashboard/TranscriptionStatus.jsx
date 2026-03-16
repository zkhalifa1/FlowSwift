import React from "react";
import { FileText } from "lucide-react";

/**
 * Displays transcription status, metrics, and content
 * @param {Object} note - The note object
 * @param {Object} statusInfo - Transcription status info {status, message, color}
 * @param {boolean} selectionMode - Whether in selection mode
 * @param {boolean} isFocused - Whether the note is focused (expanded)
 */
export function TranscriptionStatus({ note, statusInfo, selectionMode, isFocused = false }) {
  return (
    <>
      {/* Note name and date */}
      <div
        className={`flex items-center justify-between mt-2 ${selectionMode ? "ml-7" : "ml-1"}`}
      >
        <div className="text-sm font-medium text-slate-700">
          {note.aiGeneratedName || "Untitled Note"}
        </div>
        <div className="text-sm text-slate-500">
          {note.getFormattedTimestamp()}
        </div>
      </div>

      {/* Transcription content - only show when focused */}
      {isFocused && note.hasTranscription() && (
        <div
          className={`mt-2 p-3 rounded-2xl text-sm leading-relaxed transition-all duration-500 ease-in-out ${selectionMode ? "ml-7" : ""}`}
          style={{
            backgroundColor: '#3E2723',
            color: '#FFFFFF',
            borderLeft: '4px solid #D84315',
            animation: 'slideDown 0.5s ease-out',
            transformOrigin: 'top'
          }}
        >
          {note.transcription}
        </div>
      )}
    </>
  );
}
