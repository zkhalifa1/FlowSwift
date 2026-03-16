import React from "react";

/**
 * Preview box showing AI response preview
 * @param {string} preview - Preview text to display
 */
export function PreviewBox({ preview }) {
  if (!preview) return null;

  return (
    <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded animate-fadeIn">
      <div className="text-sm text-green-600 font-medium mb-2 flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Preview:
      </div>
      <div className="text-sm text-gray-700 italic">"{preview}"</div>

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
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
