import { useState } from "react";

/**
 * Hook to manage template selection mode
 * Mirrors the voice note selection functionality
 */
export function useTemplateSelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null); // Single selection

  const handleEnterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedTemplateId(null);
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedTemplateId(null);
  };

  const handleSelectionChange = (templateId) => {
    // Toggle selection - only one template can be selected
    setSelectedTemplateId(prev => prev === templateId ? null : templateId);
  };

  const clearSelection = () => {
    setSelectedTemplateId(null);
  };

  return {
    selectionMode,
    selectedTemplateId,
    handleEnterSelectionMode,
    handleExitSelectionMode,
    handleSelectionChange,
    clearSelection,
    hasSelection: selectedTemplateId !== null,
  };
}
