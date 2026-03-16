import { estimateTokens } from '../openai/chat';

/**
 * Build context from voice note transcriptions
 * @param {Array} voiceNotes - Array of voice note objects
 * @param {number} maxTokens - Maximum tokens to include in context (default: 2000)
 * @returns {Object} - Context object with summary and metadata
 */
export function buildVoiceNoteContext(voiceNotes, maxTokens = 2000) {
  // Filter notes that have transcriptions
  const transcribedNotes = voiceNotes.filter(note => 
    note.transcription && 
    note.transcriptionStatus === 'completed'
  );

  if (transcribedNotes.length === 0) {
    return {
      context: '',
      noteCount: 0,
      transcriptionCount: 0,
      dateRange: null,
      tokenEstimate: 0
    };
  }

  // Sort by timestamp (newest first for context relevance)
  const sortedNotes = transcribedNotes.sort((a, b) => {
    const timeA = normalizeTimestamp(a.timestamp);
    const timeB = normalizeTimestamp(b.timestamp);
    return timeB - timeA; // Newest first
  });

  // Build context string within token limit
  let contextParts = [];
  let totalTokens = 0;
  let includedNotes = 0;

  for (const note of sortedNotes) {
    const noteTime = normalizeTimestamp(note.timestamp);
    const timeStr = noteTime.toLocaleDateString();
    const noteContext = `[${timeStr}] ${note.transcription}`;
    const noteTokens = estimateTokens(noteContext);

    if (totalTokens + noteTokens > maxTokens && contextParts.length > 0) {
      // Stop if we would exceed token limit and we already have some context
      break;
    }

    contextParts.push(noteContext);
    totalTokens += noteTokens;
    includedNotes++;
  }

  // Get date range
  const dates = sortedNotes.map(note => normalizeTimestamp(note.timestamp));
  const dateRange = dates.length > 0 ? {
    earliest: new Date(Math.min(...dates)),
    latest: new Date(Math.max(...dates))
  } : null;

  return {
    context: contextParts.join('\n\n'),
    noteCount: voiceNotes.length,
    transcriptionCount: transcribedNotes.length,
    includedInContext: includedNotes,
    dateRange,
    tokenEstimate: totalTokens
  };
}

/**
 * Build context for a specific date range
 * @param {Array} voiceNotes - Array of voice note objects
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @param {number} maxTokens - Maximum tokens to include in context
 * @returns {Object} - Context object with summary and metadata
 */
export function buildDateRangeContext(voiceNotes, startDate, endDate, maxTokens = 2000) {
  // Filter notes by date range
  const filteredNotes = voiceNotes.filter(note => {
    const noteTime = normalizeTimestamp(note.timestamp);
    const filterEndDate = new Date(endDate);
    filterEndDate.setHours(23, 59, 59, 999); // Include full end day
    
    return noteTime >= startDate && noteTime <= filterEndDate;
  });

  return buildVoiceNoteContext(filteredNotes, maxTokens);
}

/**
 * Generate a summary of voice notes for context
 * @param {Array} voiceNotes - Array of voice note objects
 * @returns {string} - Summary text
 */
export function generateVoiceNoteSummary(voiceNotes) {
  const contextInfo = buildVoiceNoteContext(voiceNotes);
  
  if (contextInfo.transcriptionCount === 0) {
    return 'No transcribed voice notes available.';
  }

  const { noteCount, transcriptionCount, includedInContext, dateRange } = contextInfo;
  
  let summary = `Voice Notes Summary:\n`;
  summary += `- Total notes: ${noteCount}\n`;
  summary += `- Transcribed notes: ${transcriptionCount}\n`;
  summary += `- Included in context: ${includedInContext}\n`;
  
  if (dateRange) {
    const formatDate = (date) => date.toLocaleDateString();
    if (dateRange.earliest.getTime() === dateRange.latest.getTime()) {
      summary += `- Date: ${formatDate(dateRange.earliest)}\n`;
    } else {
      summary += `- Date range: ${formatDate(dateRange.earliest)} to ${formatDate(dateRange.latest)}\n`;
    }
  }

  return summary;
}

/**
 * Check if voice notes need transcription
 * @param {Array} voiceNotes - Array of voice note objects
 * @returns {Object} - Analysis of transcription status
 */
export function analyzeTranscriptionStatus(voiceNotes) {
  const analysis = {
    total: voiceNotes.length,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    noTranscription: 0
  };

  voiceNotes.forEach(note => {
    switch (note.transcriptionStatus) {
      case 'pending':
        analysis.pending++;
        break;
      case 'processing':
        analysis.processing++;
        break;
      case 'completed':
        analysis.completed++;
        break;
      case 'failed':
        analysis.failed++;
        break;
      default:
        analysis.noTranscription++;
    }
  });

  return analysis;
}

/**
 * Utility function to normalize timestamps
 * @param {any} timestamp - Timestamp in various formats
 * @returns {Date} - Normalized Date object
 */
function normalizeTimestamp(timestamp) {
  if (!timestamp) return new Date(0);
  // Firestore Timestamp has seconds property
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  // Handle Date objects or timestamp strings
  return new Date(timestamp);
}