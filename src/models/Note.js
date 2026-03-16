import { normalizeTimestamp } from '../utils/dateUtils';

/**
 * Voice Note model class
 * Represents a voice note with transcription and metadata
 */
export class Note {
  constructor(data = {}) {
    // Validate required fields
    if (!data.id) {
      throw new Error('Note ID is required');
    }

    // Core properties
    this.id = data.id;
    this.timestamp = data.timestamp || new Date();
    this.transcription = data.transcription || '';
    this.audioUrl = data.audioUrl || data.downloadURL || '';
    this.downloadURL = data.downloadURL || data.audioUrl || ''; // Backward compatibility
    this.duration = data.duration || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    // AI-generated name
    this.aiGeneratedName = data.aiGeneratedName || null;

    // Preserve original Firestore fields for compatibility
    this.transcriptionStatus = data.transcriptionStatus;
    this.audioMetrics = data.audioMetrics;
    
    // Status flags
    this.isTranscribed = Boolean(this.transcription && this.transcription.trim());
    this.hasAudio = Boolean(this.audioUrl);
    
    // Additional metadata
    this.metadata = data.metadata || {};
  }

  /**
   * Factory method to create Note from Firestore document
   * @param {Object} doc - Firestore document
   * @returns {Note} - New Note instance
   */
  static fromFirestore(doc) {
    return new Note({
      id: doc.id,
      ...doc.data()
    });
  }

  /**
   * Factory method to create Note from API response
   * @param {Object} data - API response data
   * @returns {Note} - New Note instance
   */
  static fromAPI(data) {
    return new Note(data);
  }

  /**
   * Factory method to create new Note for creation
   * @param {Object} userInput - User input data
   * @returns {Note} - New Note instance
   */
  static create(userInput = {}) {
    const now = new Date();
    return new Note({
      id: userInput.id || `note_${now.getTime()}`, // Temporary ID
      timestamp: userInput.timestamp || now,
      transcription: userInput.transcription || '',
      audioUrl: userInput.audioUrl || '',
      duration: userInput.duration || 0,
      createdAt: now,
      updatedAt: now,
      metadata: userInput.metadata || {}
    });
  }

  /**
   * Get formatted timestamp string
   * @param {string} locale - Locale for formatting (default: browser locale)
   * @returns {string} - Formatted timestamp
   */
  getFormattedTimestamp(locale = undefined) {
    const normalizedTimestamp = normalizeTimestamp(this.timestamp);
    return normalizedTimestamp.toLocaleString(locale);
  }

  /**
   * Get formatted date only
   * @param {string} locale - Locale for formatting
   * @returns {string} - Formatted date
   */
  getFormattedDate(locale = undefined) {
    const normalizedTimestamp = normalizeTimestamp(this.timestamp);
    return normalizedTimestamp.toLocaleDateString(locale);
  }

  /**
   * Get formatted time only
   * @param {string} locale - Locale for formatting
   * @returns {string} - Formatted time
   */
  getFormattedTime(locale = undefined) {
    const normalizedTimestamp = normalizeTimestamp(this.timestamp);
    return normalizedTimestamp.toLocaleTimeString(locale);
  }

  /**
   * Get formatted duration string
   * @returns {string} - Duration in MM:SS format
   */
  getFormattedDuration() {
    if (!this.duration) return '0:00';
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get normalized timestamp as Date object
   * @returns {Date} - Normalized timestamp
   */
  getNormalizedTimestamp() {
    return normalizeTimestamp(this.timestamp);
  }

  /**
   * Check if note has transcription content
   * @returns {boolean} - True if transcription exists and is not empty
   */
  hasTranscription() {
    return this.isTranscribed;
  }

  /**
   * Check if note has audio content
   * @returns {boolean} - True if audio URL exists
   */
  hasAudioContent() {
    return this.hasAudio;
  }

  /**
   * Get transcription word count
   * @returns {number} - Number of words in transcription
   */
  getWordCount() {
    if (!this.transcription) return 0;
    return this.transcription.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get transcription character count
   * @returns {number} - Number of characters in transcription
   */
  getCharacterCount() {
    return this.transcription.length;
  }

  /**
   * Get short preview of transcription
   * @param {number} maxLength - Maximum length of preview (default: 100)
   * @returns {string} - Truncated transcription with ellipsis if needed
   */
  getTranscriptionPreview(maxLength = 100) {
    if (!this.transcription) return '';
    if (this.transcription.length <= maxLength) return this.transcription;
    return this.transcription.substring(0, maxLength).trim() + '...';
  }

  /**
   * Check if note is recent (within specified hours)
   * @param {number} hours - Number of hours to consider recent (default: 24)
   * @returns {boolean} - True if note is recent
   */
  isRecent(hours = 24) {
    const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.getNormalizedTimestamp() > hoursAgo;
  }

  /**
   * Update transcription
   * @param {string} newTranscription - New transcription text
   */
  updateTranscription(newTranscription) {
    this.transcription = newTranscription || '';
    this.isTranscribed = Boolean(this.transcription && this.transcription.trim());
    this.updatedAt = new Date();
  }

  /**
   * Update metadata
   * @param {Object} newMetadata - New metadata to merge
   */
  updateMetadata(newMetadata) {
    this.metadata = { ...this.metadata, ...newMetadata };
    this.updatedAt = new Date();
  }

  /**
   * Convert to plain object for API calls or storage
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      transcription: this.transcription,
      audioUrl: this.audioUrl,
      downloadURL: this.downloadURL, // For backward compatibility
      duration: this.duration,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      transcriptionStatus: this.transcriptionStatus,
      audioMetrics: this.audioMetrics,
      metadata: this.metadata
    };
  }

  /**
   * Convert to JSON string
   * @returns {string} - JSON representation
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Clone the note
   * @returns {Note} - New Note instance with same data
   */
  clone() {
    return new Note(this.toObject());
  }

  /**
   * Compare with another note by timestamp
   * @param {Note} other - Another Note instance
   * @returns {number} - -1, 0, or 1 for sorting
   */
  compareByTimestamp(other) {
    const thisTime = this.getNormalizedTimestamp().getTime();
    const otherTime = other.getNormalizedTimestamp().getTime();
    return thisTime - otherTime;
  }

  /**
   * Check if note equals another note
   * @param {Note} other - Another Note instance
   * @returns {boolean} - True if notes are equal
   */
  equals(other) {
    return other instanceof Note && this.id === other.id;
  }

  /**
   * String representation of the note
   * @returns {string} - String representation
   */
  toString() {
    return `Note(${this.id}): "${this.getTranscriptionPreview(50)}"`;
  }
}