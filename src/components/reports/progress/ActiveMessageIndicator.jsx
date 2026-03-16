import React from "react";

/**
 * Active message indicator with animations
 * @param {string} type - Progress type (ai_thinking, processing_prompt)
 * @param {string} message - Message text to display
 */
export function ActiveMessageIndicator({ type, message }) {
  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      {/* Animated thinking indicator */}
      {type === "ai_thinking" && (
        <div className="flex-shrink-0 mt-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      )}

      {/* Animated spinner */}
      {type === "processing_prompt" && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="text-gray-800 text-lg leading-relaxed animate-slideIn">
        {message}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
