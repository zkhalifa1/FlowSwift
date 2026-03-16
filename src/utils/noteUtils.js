import { normalizeTimestamp } from './dateUtils';

/**
 * Utility functions for voice note filtering and processing
 * Works with Note class instances
 */

/**
 * Sorts notes by timestamp in ascending order (oldest first)
 * @param {Array} notes - Array of Note instances
 * @returns {Array} - Sorted array of notes
 */
export function sortNotesByTimestamp(notes) {
  return notes.slice().sort((a, b) => a.compareByTimestamp(b));
}

/**
 * Filters notes by date range
 * @param {Array} notes - Array of Note instances
 * @param {Object} dateRange - Object with startDate and endDate properties
 * @returns {Array} - Filtered array of notes
 */
export function filterNotesByDateRange(notes, dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return notes;
  }

  const filterEndDate = new Date(dateRange.endDate);
  filterEndDate.setHours(23, 59, 59, 999);

  return notes.filter((note) => {
    const noteTime = note.getNormalizedTimestamp();
    return noteTime >= dateRange.startDate && noteTime <= filterEndDate;
  });
}

/**
 * Gets notes that are selected based on provided IDs
 * @param {Array} notes - Array of Note instances
 * @param {Set} selectedIds - Set of selected note IDs
 * @returns {Array} - Array of selected notes
 */
export function getSelectedNotes(notes, selectedIds) {
  return notes.filter((note) => selectedIds.has(note.id));
}

/**
 * Processes voice notes for report generation
 * Combines sorting, filtering, and selection
 * @param {Array} voiceNotes - Array of Note instances
 * @param {Object} dateRange - Date range object
 * @param {Set} selectedNoteIds - Set of selected note IDs
 * @returns {Array} - Processed array of selected notes
 */
export function processNotesForReport(voiceNotes, dateRange, selectedNoteIds) {
  // Sort notes by timestamp
  let processedNotes = sortNotesByTimestamp(voiceNotes);
  
  // Apply date range filter
  processedNotes = filterNotesByDateRange(processedNotes, dateRange);
  
  // Get only selected notes
  return getSelectedNotes(processedNotes, selectedNoteIds);
}