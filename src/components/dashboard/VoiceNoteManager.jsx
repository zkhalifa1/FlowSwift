import React, { useState, useRef } from "react";
import VoiceNote from "./VoiceNote";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useFilteredNotes } from "@/hooks/useFilteredNotes";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useClickOutside } from "@/hooks/useClickOutside";
import { SelectionModeHeader } from "./SelectionModeHeader";
import { DateRangePicker } from "./DateRangePicker";
import UsageMeter from "./UsageMeter";
import { Info, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { colors } from "@/styles/colors";
import RecordingButton from "./RecordingButton";

export default function VoiceNoteManager({
  voiceNotes,
  deleteVoiceNote,
  currentlyPlayingId,
  setCurrentlyPlayingId,
  noteBg = "bg-white",
  dateRange: externalDateRange,
  setDateRange: setExternalDateRange,
  selectionMode = false,
  selectedNoteIds = new Set(),
  onSelectionChange,
  onExitSelection,
  onContinueToReport,
  forceRefresh,
}) {
  const {
    dateRange,
    startDate,
    endDate,
    manualInput,
    setManualInput,
    inputError,
    handleManualInputApply,
    handleDateRangeChange,
  } = useDateRangeFilter(externalDateRange, setExternalDateRange);

  const filteredNotes = useFilteredNotes(voiceNotes, startDate, endDate);
  const scrollRef = useAutoScroll(voiceNotes);

  // Usage meter state
  const [showUsageMeter, setShowUsageMeter] = useState(false);
  const usageMeterRef = useRef(null);

  // Focused notes state - supports multiple expanded notes
  const [focusedNoteIds, setFocusedNoteIds] = useState(new Set());

  // Close usage meter when clicking outside
  useClickOutside(usageMeterRef, () => {
    if (showUsageMeter) {
      setShowUsageMeter(false);
    }
  });

  // Check if all notes are expanded
  const allExpanded = filteredNotes.length > 0 && focusedNoteIds.size === filteredNotes.length;

  // Handler to toggle expand/collapse all notes
  const handleToggleExpandAll = () => {
    if (focusedNoteIds.size > 0) {
      // Collapse all
      setFocusedNoteIds(new Set());
    } else {
      // Expand all
      setFocusedNoteIds(new Set(filteredNotes.map(note => note.id)));
    }
  };

  // Handler to toggle note focus (add/remove from set)
  const handleToggleNoteFocus = (noteId) => {
    setFocusedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-h-[calc(100vh-120px)] flex flex-col relative">
      {/* Header with title and icon group */}
      <div className="pt-4 pb-3 px-2 flex justify-between items-center">
        <h2
          className="text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          Voice Notes
        </h2>

        {/* Icon Group - aligned with header */}
        <div className="flex items-center gap-2">
          {/* Date Range Picker Icon - Hide in selection mode */}
          {!selectionMode && (
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              dateRange={dateRange}
              manualInput={manualInput}
              setManualInput={setManualInput}
              inputError={inputError}
              onManualInputApply={handleManualInputApply}
              onDateRangeChange={handleDateRangeChange}
            />
          )}

          {/* Info Icon Button */}
          <button
            onClick={() => setShowUsageMeter(!showUsageMeter)}
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
            title="Usage Overview"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Expand/Collapse All Button */}
          <button
            onClick={handleToggleExpandAll}
            disabled={filteredNotes.length === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
            style={{
              backgroundColor: colors.background.hover,
              color: colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              if (filteredNotes.length > 0) {
                e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.hover;
            }}
            title={focusedNoteIds.size > 0 ? "Collapse All" : "Expand All"}
          >
            {focusedNoteIds.size > 0 ? (
              <ChevronsDownUp className="w-5 h-5" />
            ) : (
              <ChevronsUpDown className="w-5 h-5" />
            )}
          </button>

          {/* Recording Button */}
          <RecordingButton forceRefresh={forceRefresh} />
        </div>
      </div>

      {/* Floating Usage Meter */}
      {showUsageMeter && (
        <div
          ref={usageMeterRef}
          className="absolute top-16 right-2 z-50 w-80 max-h-[500px] overflow-auto rounded-lg"
          style={{
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.ui.borderLight}`,
            boxShadow: "0 8px 24px rgba(62, 39, 35, 0.12)",
          }}
        >
          <UsageMeter />
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Selection Mode Header */}
        {selectionMode && (
          <SelectionModeHeader
            selectedNoteIds={selectedNoteIds}
            totalNotes={filteredNotes.length}
            onExitSelection={onExitSelection}
            onContinueToReport={onContinueToReport}
          />
        )}

        {/* Scrollable Notes List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto w-full pr-3">
          {filteredNotes.length === 0 ? (
            <p className="text-center" style={{ color: colors.text.tertiary }}>
              No voice notes found.
            </p>
          ) : (
            filteredNotes.map((note) => (
              <VoiceNote
                key={note.id}
                note={note}
                onDelete={deleteVoiceNote}
                currentlyPlayingId={currentlyPlayingId}
                setCurrentlyPlayingId={setCurrentlyPlayingId}
                bgClass={noteBg}
                selectionMode={selectionMode}
                isSelected={selectedNoteIds.has(note.id)}
                onSelectionChange={onSelectionChange}
                isFocused={focusedNoteIds.has(note.id)}
                onFocus={handleToggleNoteFocus}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
