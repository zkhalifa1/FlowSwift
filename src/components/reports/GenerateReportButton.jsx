import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * Button for generating report
 * @param {Function} onClick - Handler for button click
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} isGenerating - Whether report is currently being generated
 */
export function GenerateReportButton({ onClick, disabled, isGenerating }) {
  return (
    <div className="flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 text-lg rounded-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 font-medium"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            Generating Report...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Generate Report
          </>
        )}
      </button>
    </div>
  );
}
