import React, { useState } from "react";
import { DateRange } from "react-date-range";
import { formatRange } from "@/hooks/useDateRangeFilter";
import { Calendar } from "lucide-react";
import { colors } from "@/styles/colors";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

/**
 * Date range picker component with manual input
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} dateRange - Date range array for DateRange component
 * @param {string} manualInput - Manual input value
 * @param {Function} setManualInput - Function to update manual input
 * @param {string} inputError - Input validation error message
 * @param {Function} onManualInputApply - Handler for applying manual input
 * @param {Function} onDateRangeChange - Handler for date range change
 */
export function DateRangePicker({
  startDate,
  endDate,
  dateRange,
  manualInput,
  setManualInput,
  inputError,
  onManualInputApply,
  onDateRangeChange,
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: colors.background.hover,
          color: colors.text.secondary,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.background.hover;
        }}
        onClick={() => setShowPicker((val) => !val)}
        title={formatRange(startDate, endDate)}
      >
        <Calendar className="w-5 h-5" />
      </button>
      {showPicker && (
        <div className="absolute top-12 left-0 z-[100] flex flex-col items-start">
          <div className="flex flex-col items-center w-full max-w-xs mb-3">
            <input
              type="text"
              className="border border-slate-300 rounded-lg px-3 py-2 w-full text-center mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="YYYY-MM-DD YYYY-MM-DD"
              onKeyDown={(e) => {
                if (e.key === "Enter") onManualInputApply();
              }}
            />
            {inputError && (
              <div className="text-xs text-red-600 mt-1 font-medium">{inputError}</div>
            )}
          </div>
          <div className="bg-white shadow-xl rounded-lg p-3 border border-slate-200">
            <DateRange
              editableDateInputs={true}
              onChange={onDateRangeChange}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              maxDate={new Date()}
              showDateDisplay={false}
            />
            <div className="flex justify-end mt-3 gap-2">
              <button
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-all"
                onClick={() => setShowPicker(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
