import React from "react";

/**
 * AI preview component showing AI summary or loading state
 * @param {boolean} isLoadingSummary - Whether AI summary is loading
 * @param {string} aiSummary - AI generated summary text
 */
export function AIPreview({ isLoadingSummary, aiSummary }) {
  if (isLoadingSummary) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-zinc-300">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin"></div>
          Generating AI summary...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-white leading-relaxed whitespace-pre-wrap">
        {aiSummary ||
          'Upload a template and click "Generate Report" to see live progress here!'}
      </div>
      {!aiSummary && (
        <div className="text-center py-8 text-zinc-400">
          <div className="text-4xl mb-2">🤖</div>
          <div className="text-sm">Ready to generate your report!</div>
        </div>
      )}
    </div>
  );
}
