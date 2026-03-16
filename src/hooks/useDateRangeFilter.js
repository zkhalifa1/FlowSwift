import { useState, useEffect } from "react";

/**
 * Get default date range (past 7 days including today)
 */
function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return [{ startDate: start, endDate: end, key: "selection" }];
}

/**
 * Format date range as string
 */
export function formatRange(startDate, endDate) {
  if (!startDate || !endDate) return "No range selected";
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}

/**
 * Parse date string in YYYY-MM-DD format to local Date object
 */
function parseLocalDate(str) {
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Custom hook for managing date range filter state and logic
 * @param {Object} externalDateRange - External date range object
 * @param {Function} setExternalDateRange - Function to update external date range
 * @returns {Object} Date range state and handlers
 */
export function useDateRangeFilter(externalDateRange, setExternalDateRange) {
  // Always use internal state for the date picker, sync with external when needed
  const [dateRange, setDateRange] = useState(() =>
    externalDateRange && externalDateRange.startDate && externalDateRange.endDate
      ? [externalDateRange]
      : getDefaultDateRange(),
  );

  const [manualInput, setManualInput] = useState(() => {
    let range;
    if (
      externalDateRange &&
      externalDateRange.startDate &&
      externalDateRange.endDate
    ) {
      range = externalDateRange;
    } else {
      range = getDefaultDateRange()[0];
    }
    const { startDate, endDate } = range;
    return `${startDate.toISOString().slice(0, 10)} ${endDate.toISOString().slice(0, 10)}`;
  });

  const [inputError, setInputError] = useState("");

  // Sync external date range changes to internal state
  useEffect(() => {
    if (
      externalDateRange &&
      externalDateRange.startDate &&
      externalDateRange.endDate
    ) {
      setDateRange([externalDateRange]);
      setManualInput(
        `${externalDateRange.startDate.toISOString().slice(0, 10)} ${externalDateRange.endDate.toISOString().slice(0, 10)}`,
      );
    }
  }, [externalDateRange]);

  // Update manual input when date range changes
  const { startDate, endDate } = dateRange[0];
  useEffect(() => {
    if (startDate && endDate) {
      setManualInput(
        `${startDate.toISOString().slice(0, 10)} ${endDate.toISOString().slice(0, 10)}`,
      );
    }
  }, [startDate, endDate]);

  /**
   * Handle manual date input
   */
  const handleManualInputApply = () => {
    const parts = manualInput.trim().split(/\s+/);
    if (parts.length !== 2) {
      setInputError("Please enter two dates in YYYY-MM-DD format");
      return;
    }
    const [startStr, endStr] = parts;
    const start = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);
    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      startStr.length !== 10 ||
      endStr.length !== 10
    ) {
      setInputError("Invalid date format. Use YYYY-MM-DD YYYY-MM-DD");
      return;
    }
    if (start > end) {
      setInputError("Start date must be before end date");
      return;
    }
    const newRange = [{ startDate: start, endDate: end, key: "selection" }];
    setDateRange(newRange);
    // Sync with external state if provided
    if (setExternalDateRange) {
      setExternalDateRange(newRange[0]);
    }
    setInputError("");
  };

  /**
   * Handle date range change from picker
   */
  const handleDateRangeChange = (item) => {
    if (item && item.selection) {
      setDateRange([item.selection]);
      const { startDate, endDate } = item.selection;
      if (startDate && endDate) {
        setManualInput(
          `${startDate.toISOString().slice(0, 10)} ${endDate.toISOString().slice(0, 10)}`,
        );
        // Sync with external state if provided
        if (setExternalDateRange) {
          setExternalDateRange(item.selection);
        }
      }
    }
  };

  return {
    dateRange,
    startDate,
    endDate,
    manualInput,
    setManualInput,
    inputError,
    handleManualInputApply,
    handleDateRangeChange,
  };
}
