import { useState, useEffect } from 'react';
import { getSavedDateRange, saveDateRange } from '../utils/dateUtils';

/**
 * Custom hook for managing date range state with sessionStorage persistence
 * @returns {Object} Date range state and setter
 */
export function useDateRange() {
  const [dateRange, setDateRange] = useState(getSavedDateRange);

  // Save date range to sessionStorage whenever it changes
  useEffect(() => {
    if (dateRange && dateRange[0]) {
      saveDateRange(dateRange[0]);
    }
  }, [dateRange]);

  const updateDateRange = (newRange) => {
    setDateRange([newRange]);
  };

  const resetDateRange = () => {
    setDateRange(getSavedDateRange());
  };

  return {
    dateRange,
    setDateRange,
    updateDateRange,
    resetDateRange,
    currentRange: dateRange[0],
  };
}