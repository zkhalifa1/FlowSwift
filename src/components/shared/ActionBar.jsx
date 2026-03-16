import React, { useState, useEffect } from "react";
import { FileText, Mic, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { colors, shadows } from "@/styles/colors";

/**
 * ActionBar component - Top-right actions inspired by Heidi
 * Contains Create Report, Resume Recording, Timer, and Microphone status
 */
export default function ActionBar({
  onCreateReport,
  onResumeRecording,
  isRecording = false,
  recordingTime = 0,
}) {
  const navigate = useNavigate();
  const [displayTime, setDisplayTime] = useState("00:00");

  // Format time in MM:SS format
  useEffect(() => {
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    setDisplayTime(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    );
  }, [recordingTime]);

  return (
    <div className="flex items-center gap-3">
      {/* Create Report Button */}
      <button
        onClick={onCreateReport}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: colors.sidebar.dark,
          boxShadow: shadows.button,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.sidebar.hover;
          e.currentTarget.style.boxShadow = shadows.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.sidebar.dark;
          e.currentTarget.style.boxShadow = shadows.button;
        }}
      >
        <FileText className="w-4 h-4" />
        Create
      </button>

      {/* Resume Recording Button */}
      <button
        onClick={onResumeRecording}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: colors.background.white,
          color: colors.text.primary,
          border: `1px solid ${colors.ui.borderLight}`,
          boxShadow: shadows.button,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.background.hover;
          e.currentTarget.style.boxShadow = shadows.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.background.white;
          e.currentTarget.style.boxShadow = shadows.button;
        }}
      >
        <Mic className="w-4 h-4" />
        Resume
      </button>

      {/* Timer Display */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm"
        style={{
          backgroundColor: colors.background.white,
          color: colors.text.secondary,
          border: `1px solid ${colors.ui.borderLight}`,
        }}
      >
        <Clock className="w-4 h-4" />
        {displayTime}
      </div>

      {/* Microphone Status Indicator */}
      {isRecording && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
          style={{
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.ui.borderLight}`,
          }}
        >
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-3 rounded-full animate-pulse"
                style={{
                  backgroundColor: colors.status.recording,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
