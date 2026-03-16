import React from "react";

/**
 * Pane displaying voice notes transcriptions
 * @param {Array} selectedNotes - Array of selected voice notes
 */
export function VoiceNotesPane({ selectedNotes }) {
  const notesWithTranscription = selectedNotes.filter((note) => {
    return typeof note.hasTranscription === "function"
      ? note.hasTranscription()
      : note.transcription && note.transcription.trim();
  });

  // Helper to normalize Firestore timestamps
  const formatTimestamp = (note) => {
    if (typeof note.getFormattedTimestamp === "function") {
      return note.getFormattedTimestamp();
    }

    // Handle Firestore Timestamp objects
    if (note.timestamp?.seconds) {
      return new Date(note.timestamp.seconds * 1000).toLocaleString();
    }

    // Handle regular dates
    return new Date(note.timestamp).toLocaleString();
  };

  return (
    <div className="flex-1 bg-white rounded-lg flex flex-col min-h-0">
      <div className="p-6 pb-0">
        <h2 className="text-lg font-semibold mb-4">Voice Notes Log</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {selectedNotes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No voice notes selected for this report.</p>
          </div>
        ) : notesWithTranscription.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No transcriptions available for the selected voice notes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notesWithTranscription.map((note) => (
              <div
                key={note.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-medium text-gray-500">
                    {formatTimestamp(note)}
                  </div>
                </div>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {note.transcription}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
