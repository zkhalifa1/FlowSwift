import { useRef, useEffect, useState, useCallback } from "react";
import { logger } from "@/utils/logger";


/**
 * Custom hook for managing audio playback state and controls
 * @param {string} noteId - Unique identifier for the note
 * @param {string} audioUrl - URL of the audio file
 * @param {string} currentlyPlayingId - ID of the currently playing audio
 * @param {Function} setCurrentlyPlayingId - Function to set the currently playing audio ID
 * @returns {Object} Audio player state and controls
 */
export function useAudioPlayer(
  noteId,
  audioUrl,
  currentlyPlayingId,
  setCurrentlyPlayingId,
) {
  const audioRef = useRef(null);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(!!audioUrl);
  const [hasError, setHasError] = useState(!audioUrl);

  // Stop audio when another audio starts playing
  useEffect(() => {
    if (currentlyPlayingId !== noteId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentlyPlayingId, noteId]);

  // Fallback effect to check duration after component mounts
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src && duration === 0) {
      // Try to get duration immediately if already loaded
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else {
        // Set up listener for when duration becomes available
        const handleDurationChange = () => {
          if (!isNaN(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
        };
        audio.addEventListener("durationchange", handleDurationChange);
        audio.addEventListener("loadedmetadata", handleDurationChange);

        return () => {
          audio.removeEventListener("durationchange", handleDurationChange);
          audio.removeEventListener("loadedmetadata", handleDurationChange);
        };
      }
    }
  }, [audioUrl, duration]);

  const handlePlay = useCallback(() => {
    setCurrentlyPlayingId(noteId);
  }, [noteId, setCurrentlyPlayingId]);

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          logger.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e) => {
      if (audioRef.current && duration > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        const newTime = percent * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration],
  );

  const formatTime = useCallback((time) => {
    if (isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Audio event handlers
  const audioEventHandlers = {
    onLoadedMetadata: () => {
      if (audioRef.current && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
        setIsLoading(false);
        setHasError(false);
      }
    },
    onTimeUpdate: () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    },
    onPlay: () => {
      setIsPlaying(true);
      handlePlay();
    },
    onPause: () => {
      setIsPlaying(false);
    },
    onEnded: () => {
      setIsPlaying(false);
      setCurrentTime(0);
    },
    onCanPlayThrough: () => {
      // Backup duration detection
      if (
        audioRef.current &&
        duration === 0 &&
        !isNaN(audioRef.current.duration)
      ) {
        setDuration(audioRef.current.duration);
        setIsLoading(false);
        setHasError(false);
      }
    },
    onError: (e) => {
      logger.error("Audio loading error:", e);
      setHasError(true);
      setIsLoading(false);
    },
    onLoadStart: () => {
      setIsLoading(true);
      setHasError(false);
    },
  };

  return {
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
  };
}
