import { logger } from "@/utils/logger";
/**
 * Utility functions for date and timestamp handling
 */

/**
 * Normalizes various timestamp formats to a JavaScript Date object
 * Handles Firebase timestamps, Date objects, and timestamp strings
 * @param {*} timestamp - The timestamp to normalize
 * @returns {Date} - Normalized Date object
 */
export function normalizeTimestamp(timestamp) {
  if (!timestamp) return new Date(0);
  
  // Handle Firebase timestamp format
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Handle regular Date objects and strings
  try {
    return new Date(timestamp);
  } catch {
    return new Date(0);
  }
}

/**
 * Creates a default date range for the last 7 days
 * @returns {Array} Array with single date range object
 */
export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return [{ startDate: start, endDate: end, key: "selection" }];
}

/**
 * Retrieves saved date range from sessionStorage with fallback to default
 * @returns {Array} Array with single date range object
 */
export function getSavedDateRange() {
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
 * Saves date range to sessionStorage
 * @param {Object} dateRange - Date range object with startDate and endDate
 */
export function saveDateRange(dateRange) {
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    sessionStorage.setItem(
      "dashboardDateRange",
      JSON.stringify({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
    );
  }
}