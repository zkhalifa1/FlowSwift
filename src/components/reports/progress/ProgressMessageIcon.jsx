import React from "react";

/**
 * Icon component for progress messages based on type
 * @param {string} type - Message type (ai_complete, start, analyzing, complete, error, etc.)
 */
export function ProgressMessageIcon({ type }) {
  // Green dot for AI complete
  if (type === "ai_complete") {
    return (
      <div className="flex-shrink-0 mt-1">
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    );
  }

  // Blue dot for processing states
  if (["start", "analyzing", "prompts_found", "assembling"].includes(type)) {
    return (
      <div className="flex-shrink-0 mt-1">
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    );
  }

  // Green checkmark for complete
  if (type === "complete") {
    return (
      <div className="flex-shrink-0 mt-1">
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-2 h-2 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Red error icon
  if (["error", "ai_error"].includes(type)) {
    return (
      <div className="flex-shrink-0 mt-1">
        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg
            className="w-2 h-2 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  }

  return null;
}
