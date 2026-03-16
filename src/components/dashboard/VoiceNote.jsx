import { useTranscription } from "@/hooks/useTranscription";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { VoiceNoteControls } from "./VoiceNoteControls";
import { TranscriptionStatus } from "./TranscriptionStatus";
import { logger } from "@/utils/logger";
import { colors } from "@/styles/colors";

export default function VoiceNote({
  note,
  onDelete,
  currentlyPlayingId,
  setCurrentlyPlayingId,
  selectionMode = false,
  isSelected = false,
  onSelectionChange,
  isFocused = false,
  onFocus,
}) {
  const { retryTranscription, getTranscriptionStatus, isTranscribing } =
    useTranscription();

  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    hasError,
    handlePlayPause,
    handleSeek,
    formatTime,
    audioEventHandlers,
  } = useAudioPlayer(
    note.id,
    note.downloadURL,
    currentlyPlayingId,
    setCurrentlyPlayingId,
  );

  const handleDelete = () => {
    if (confirm("Delete this voice note?")) {
      onDelete(note.id);
    }
  };

  const handleRetryTranscription = async () => {
    try {
      await retryTranscription(note);
    } catch (error) {
      logger.error("Retry transcription failed:", error);
    }
  };

  const transcriptionStatusInfo = getTranscriptionStatus(note);

  const handleCardClick = (e) => {
    // In selection mode, don't handle click
    if (selectionMode) return;

    // Don't toggle if clicking on buttons or interactive elements
    if (e.target.closest("button") || e.target.closest("input")) {
      return;
    }

    // Toggle transcription (onFocus now handles add/remove from set)
    if (onFocus) {
      onFocus(note.id);
    }
  };

  // Force show transcription in selection mode
  const shouldShowTranscription = selectionMode || isFocused;

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col pl-0 pr-3 py-2 w-full rounded-r-lg transition-all duration-200 relative cursor-pointer"
      style={{
        backgroundColor:
          selectionMode && isSelected
            ? `${colors.primary.main}20`
            : colors.background.cream,
        border:
          selectionMode && isSelected
            ? `1px solid ${colors.primary.main}`
            : "none",
        borderBottom:
          selectionMode && isSelected
            ? `1px solid ${colors.primary.main}`
            : "1px solid #9CA3AF",
        boxShadow:
          selectionMode && isSelected
            ? `0 4px 12px ${colors.primary.main}30`
            : "none",
      }}
    >
      {/* Hidden audio element - no controls */}
      {note.downloadURL && (
        <audio
          ref={audioRef}
          src={note.downloadURL}
          preload="auto"
          crossOrigin="anonymous"
          muted={false}
          {...audioEventHandlers}
        />
      )}

      {/* Unified Controls - audio playback and note actions */}
      <VoiceNoteControls
        isPlaying={isPlaying}
        isLoading={isLoading}
        hasError={hasError}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        formatTime={formatTime}
        statusInfo={transcriptionStatusInfo}
        isTranscribing={isTranscribing}
        onRetryTranscription={handleRetryTranscription}
        onDelete={handleDelete}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onSelectionChange={() => onSelectionChange?.(note.id)}
      />

      {/* Timestamp and transcription status */}
      <TranscriptionStatus
        note={note}
        statusInfo={transcriptionStatusInfo}
        selectionMode={selectionMode}
        isFocused={shouldShowTranscription}
      />
    </div>
  );
}
