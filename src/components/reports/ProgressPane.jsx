import React from "react";
import { ProgressDisplay } from "./progress/ProgressDisplay";
import { AIPreview } from "./progress/AIPreview";

/**
 * Pane displaying report generation progress or AI preview
 * @param {Object} progressData - Progress data object
 * @param {Array} messageHistory - Array of progress messages
 * @param {boolean} isLoadingSummary - Whether AI summary is loading
 * @param {string} aiSummary - AI generated summary text
 */
export function ProgressPane({
  progressData,
  messageHistory,
  isLoadingSummary,
  aiSummary,
}) {
  return (
    <div className="h-full bg-zinc-800/50 backdrop-blur-sm rounded-xl flex flex-col shadow-lg border border-zinc-700/50">
      <div className="p-6 pb-0">
        <h2 className="text-lg font-semibold mb-4 text-white">
          {progressData.isActive ? "Report Generation" : "AI Preview"}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 pr-8">
        {progressData.isActive ? (
          <ProgressDisplay
            progressData={progressData}
            messageHistory={messageHistory}
          />
        ) : (
          <AIPreview
            isLoadingSummary={isLoadingSummary}
            aiSummary={aiSummary}
          />
        )}
      </div>
    </div>
  );
}
