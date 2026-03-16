import React from "react";
import { X, Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colors } from "@/styles/colors";

/**
 * Unified controls component for VoiceNote - handles both audio playback and note actions
 * @param {boolean} isPlaying - Whether audio is currently playing
 * @param {boolean} isLoading - Whether audio is loading
 * @param {boolean} hasError - Whether there's an error loading audio
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} duration - Total duration in seconds
 * @param {Function} onPlayPause - Handler for play/pause button
 * @param {Function} onSeek - Handler for seeking in the progress bar
 * @param {Function} formatTime - Function to format time (seconds) as string
 * @param {Object} statusInfo - Transcription status info
 * @param {boolean} isTranscribing - Whether currently transcribing
 * @param {Function} onRetryTranscription - Handler for retry button
 * @param {Function} onDelete - Handler for delete button
 * @param {boolean} selectionMode - Whether in selection mode
 * @param {boolean} isSelected - Whether note is selected
 * @param {Function} onSelectionChange - Handler for selection change
 */
export function VoiceNoteControls({
  // Audio control props
  isPlaying,
  isLoading,
  hasError,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  formatTime,
  // Action props
  statusInfo,
  isTranscribing,
  onRetryTranscription,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onSelectionChange,
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      {/* Audio Controls Section */}
      <div className="flex items-center gap-3 flex-1">
        {/* Play/Pause Button */}
        <Button
          onClick={onPlayPause}
          disabled={isLoading || hasError}
          className="flex-shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: colors.primary.main,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = colors.primary.hover;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.main;
          }}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : hasError ? (
            <X className="w-5 h-5" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-mono min-w-[35px]" style={{ color: colors.text.tertiary }}>
            {hasError ? "--:--" : formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-2 rounded-full"
            style={{
              backgroundColor: '#9CA3AF',
              cursor: !hasError && duration > 0 ? "pointer" : "not-allowed",
            }}
            onClick={!hasError && duration > 0 ? onSeek : undefined}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                backgroundColor: colors.primary.main,
                width:
                  duration > 0
                    ? `${Math.min((currentTime / duration) * 100, 100)}%`
                    : "0%",
              }}
            />
          </div>
          <span className="text-xs font-mono min-w-[35px]" style={{ color: colors.text.tertiary }}>
            {hasError ? "--:--" : isLoading ? "..." : formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center">
        {selectionMode ? (
          // Selection mode: show checkbox
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelectionChange}
            className="ml-2 w-5 h-5 rounded cursor-pointer"
            style={{
              accentColor: colors.primary.main,
            }}
            title="Select note"
          />
        ) : (
          // Normal mode: show action buttons
          <>
            {/* Retry transcription button for failed transcriptions */}
            {statusInfo.status === "failed" && (
              <button
                onClick={onRetryTranscription}
                disabled={isTranscribing}
                className="transition-colors ml-2 disabled:opacity-50"
                style={{
                  color: colors.primary.main,
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.color = colors.primary.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.primary.main;
                }}
                title="Retry transcription"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isTranscribing ? "animate-spin" : ""}`}
                />
              </button>
            )}

            <button
              onClick={onDelete}
              className="transition-colors ml-2"
              style={{
                color: colors.text.tertiary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.status.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.tertiary;
              }}
              title="Delete"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
