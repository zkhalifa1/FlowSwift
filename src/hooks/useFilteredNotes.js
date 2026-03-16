/**
 * Custom hook for filtering and sorting voice notes
 * @param {Array} voiceNotes - Array of voice note objects
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {Array} Filtered and sorted notes
 */
export function useFilteredNotes(voiceNotes, startDate, endDate) {
  // Sort and filter notes by date range using Note class methods
  let filteredNotes = voiceNotes.slice();

  // Sort by timestamp (newest first, oldest last)
  filteredNotes.sort((a, b) => b.compareByTimestamp(a));

  // Apply date range filter after sorting
  if (startDate && endDate) {
    // Ensure end date includes the full day (23:59:59)
    const filterEndDate = new Date(endDate);
    filterEndDate.setHours(23, 59, 59, 999);

    filteredNotes = filteredNotes.filter((note) => {
      const noteTime = note.getNormalizedTimestamp();
      return noteTime >= startDate && noteTime <= filterEndDate;
    });
  }

  return filteredNotes;
}
