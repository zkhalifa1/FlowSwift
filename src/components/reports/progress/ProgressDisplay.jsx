import React from "react";
import { ProgressBar } from "./ProgressBar";
import { ProgressMessageIcon } from "./ProgressMessageIcon";
import { ActiveMessageIndicator } from "./ActiveMessageIndicator";
import { PreviewBox } from "./PreviewBox";

/**
 * Progress display combining all progress elements
 * @param {Object} progressData - Progress data object
 * @param {Array} messageHistory - Array of progress messages
 */
export function ProgressDisplay({ progressData, messageHistory }) {
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <ProgressBar
        step={progressData.step}
        totalSteps={progressData.totalSteps}
      />

      {/* Message History */}
      <div className="space-y-3">
        {messageHistory.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            <ProgressMessageIcon type={msg.type} />
            <div className="text-gray-600 leading-relaxed">{msg.message}</div>
          </div>
        ))}

        {/* Current Active Message */}
        <ActiveMessageIndicator
          type={progressData.type}
          message={progressData.message}
        />
      </div>

      {/* AI Response Preview */}
      <PreviewBox preview={progressData.details?.preview} />

      {/* Step Progress Indicator */}
      {progressData.details?.currentPrompt &&
        progressData.details?.totalPrompts && (
          <div className="mt-3 text-sm text-gray-600">
            Processing section {progressData.details.currentPrompt} of{" "}
            {progressData.details.totalPrompts}
          </div>
        )}
    </div>
  );
}
