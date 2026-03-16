import { useRef, useEffect, useMemo } from "react";

/**
 * Custom hook for scroll container reference (no auto-scroll)
 * @param {Array} voiceNotes - Array of voice note objects
 * @returns {Object} Scroll ref to attach to scrollable container
 */
export function useAutoScroll(voiceNotes) {
  const scrollRef = useRef(null);

  // No auto-scroll - scroll stays at top by default
  // This hook now just provides a ref for the scrollable container

  return scrollRef;
}
