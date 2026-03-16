import { useState } from "react";

/**
 * Custom hook for managing report generation progress tracking
 * @returns {Object} Progress state and handlers
 */
export function useProgressTracking() {
  const [progressData, setProgressData] = useState({
    isActive: false,
    message: "",
    step: 0,
    totalSteps: 5,
    type: "",
    details: {},
  });

  const [messageHistory, setMessageHistory] = useState([]);

  const handleProgressUpdate = (progress) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      message: progress.message,
      type: progress.type,
      timestamp: new Date(),
      details: {
        promptCount: progress.promptCount,
        currentPrompt: progress.currentPrompt,
        totalPrompts: progress.totalPrompts,
        preview: progress.preview,
        promptText: progress.promptText,
        error: progress.error,
      },
    };

    // Add to message history (except for current thinking/processing states)
    if (!["ai_thinking", "processing_prompt"].includes(progress.type)) {
      setMessageHistory((prev) => [...prev, newMessage]);
    }

    setProgressData({
      isActive: true,
      message: progress.message,
      step: progress.step || 0,
      totalSteps: progress.totalSteps || 5,
      type: progress.type,
      details: {
        promptCount: progress.promptCount,
        currentPrompt: progress.currentPrompt,
        totalPrompts: progress.totalPrompts,
        preview: progress.preview,
        promptText: progress.promptText,
        error: progress.error,
      },
    });
  };

  const resetProgress = () => {
    setProgressData({
      isActive: false,
      message: "",
      step: 0,
      totalSteps: 5,
      type: "",
      details: {},
    });
    setMessageHistory([]);
  };

  return {
    progressData,
    messageHistory,
    handleProgressUpdate,
    resetProgress,
    setProgressData,
    setMessageHistory,
  };
}
