import React from "react";

/**
 * Progress bar component
 * @param {number} step - Current step
 * @param {number} totalSteps - Total number of steps
 */
export function ProgressBar({ step, totalSteps }) {
  const percentage = (step / totalSteps) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
