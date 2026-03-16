import { useState } from 'react';

/**
 * Custom hook for managing selection mode state and operations
 * @returns {Object} Selection mode state and handlers
 */
export function useSelectionMode() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());

  const handleEnterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedNoteIds(new Set());
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
  };

  const handleSelectionChange = (noteId) => {
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const toggleSelection = (noteId) => {
    handleSelectionChange(noteId);
  };

  const clearSelection = () => {
    setSelectedNoteIds(new Set());
  };

  const selectAll = (noteIds) => {
    setSelectedNoteIds(new Set(noteIds));
  };

  return {
    // State
    selectionMode,
    selectedNoteIds,
    
    // Handlers
    handleEnterSelectionMode,
    handleExitSelectionMode,
    handleSelectionChange,
    
    // Additional utilities
    toggleSelection,
    clearSelection,
    selectAll,
    
    // Computed values
    hasSelection: selectedNoteIds.size > 0,
    selectionCount: selectedNoteIds.size,
  };
}