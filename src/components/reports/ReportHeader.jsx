import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Header for report generation page
 * @param {Function} onBackToDashboard - Handler for back to dashboard button
 */
export function ReportHeader({ onBackToDashboard }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">FS</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Generate Report</h1>
      </div>

      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all shadow-lg font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </button>
    </div>
  );
}
