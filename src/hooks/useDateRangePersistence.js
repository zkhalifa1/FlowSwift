import { useState, useEffect } from "react";
import { logger } from "@/utils/logger";


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
 * Get saved date range from sessionStorage
 */
function getSavedDateRange() {
  try {
    const saved = sessionStorage.getItem("dashboardDateRange");
    if (saved) {
      const parsed = JSON.parse(saved);
      return [
        {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          key: "selection",
        },
      ];
    }
  } catch (error) {
    logger.error("Error loading saved date range:", error);
  }
  return getDefaultDateRange();
}

/**
 * Custom hook for managing date range with sessionStorage persistence
 * @param {Object} initialDateRange - Optional initial date range
 * @returns {Object} Date range state and setter
 */
export function useDateRangePersistence(initialDateRange) {
  const [dateRange, setDateRange] = useState(() =>
    initialDateRange ? [initialDateRange] : getSavedDateRange(),
  );

  // Save date range to sessionStorage whenever it changes
  useEffect(() => {
    if (dateRange && dateRange[0]) {
      sessionStorage.setItem(
        "dashboardDateRange",
        JSON.stringify({
          startDate: dateRange[0].startDate,
          endDate: dateRange[0].endDate,
        }),
      );
    }
  }, [dateRange]);

  return { dateRange, setDateRange };
}
