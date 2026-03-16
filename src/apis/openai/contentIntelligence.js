import { httpsCallable } from 'firebase/functions';
import { cloudFunctions } from '../firebase/config';
import { logger } from "@/utils/logger";


// Initialize Cloud Function callable
const generateReportFunction = httpsCallable(cloudFunctions, 'generateReport');

export class ContentIntelligenceService {
  constructor() {
    this.processedCache = new Map(); // Cache processed content
  }

  /**
   * Analyze and categorize voice note transcriptions
   * @param {Array} selectedNotes - Array of voice note objects with transcriptions
   * @param {Object} dateRange - Date range for the report
   * @param {string} projectName - Name of the project
   * @returns {Promise<Object>} Categorized and processed content
   */
  async processVoiceNotes(selectedNotes, dateRange, projectName) {
    try {
      logger.info('Starting voice note content analysis...');
      
      // Filter notes with transcriptions
      const notesWithTranscriptions = selectedNotes.filter(note => note.transcription && note.transcription.trim());
      
      if (notesWithTranscriptions.length === 0) {
        return this.createEmptyAnalysis(selectedNotes, dateRange, projectName);
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(notesWithTranscriptions, dateRange, projectName);
      if (this.processedCache.has(cacheKey)) {
        logger.info('Using cached content analysis');
        return this.processedCache.get(cacheKey);
      }

      // Prepare content for analysis
      const contentForAnalysis = this.prepareContentForAnalysis(notesWithTranscriptions);
      
      // Perform AI analysis
      const analysis = await this.performContentAnalysis(contentForAnalysis, dateRange, projectName);
      
      // Cache the result
      this.processedCache.set(cacheKey, analysis);
      
      logger.info('Voice note content analysis completed');
      return analysis;
      
    } catch (error) {
      logger.error('Content intelligence analysis failed:', error);
      throw new Error(`Failed to analyze voice note content: ${error.message}`);
    }
  }

  /**
   * Prepare voice note content for AI analysis
   */
  prepareContentForAnalysis(notes) {
    return notes.map((note, index) => {
      const timestamp = this.formatTimestamp(note.timestamp);
      return {
        id: note.id,
        index: index + 1,
        timestamp,
        transcription: note.transcription,
        duration: note.audioMetrics?.duration || 0
      };
    });
  }

  /**
   * Format timestamp for analysis
   */
  formatTimestamp(ts) {
    if (!ts) return "Unknown time";
    if (typeof ts === 'object' && ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "Unknown time";
    }
  }

  /**
   * Perform AI analysis of voice note content (via secure Cloud Function)
   */
  async performContentAnalysis(contentData, dateRange, projectName) {
    try {
      // Call secure Cloud Function instead of OpenAI directly
      const result = await generateReportFunction({
        selectedNotes: contentData.map(note => ({
          id: note.id,
          transcription: note.transcription,
          timestamp: note.timestamp
        })),
        dateRange: {
          start: dateRange.startDate?.toLocaleDateString(),
          end: dateRange.endDate?.toLocaleDateString()
        },
        projectName
      });

      if (!result.data.success) {
        throw new Error('Report generation failed');
      }

      const aiSummary = result.data.aiSummary;

      try {
        const analysis = JSON.parse(aiSummary);
        // Add metadata
        analysis.metadata = {
          totalNotes: contentData.length,
          dateRange: {
            start: dateRange.startDate?.toLocaleDateString(),
            end: dateRange.endDate?.toLocaleDateString()
          },
          projectName,
          processedAt: new Date().toISOString()
        };
        return analysis;
      } catch (parseError) {
        logger.error('Failed to parse AI content analysis:', aiSummary);
        return this.createFallbackAnalysis(contentData, dateRange, projectName);
      }

    } catch (error) {
      logger.error('AI content analysis failed:', error);

      // Handle specific error types
      if (error.code === 'resource-exhausted') {
        throw new Error('Monthly report limit reached. Please upgrade your plan.');
      }

      return this.createFallbackAnalysis(contentData, dateRange, projectName);
    }
  }

  /**
   * Create fallback analysis when AI fails
   */
  createFallbackAnalysis(contentData, dateRange, projectName) {
    const allTranscriptions = contentData.map(note => note.transcription).join(' ');
    
    return {
      summary: `Daily report for ${projectName} covering ${contentData.length} voice notes from ${dateRange.startDate?.toLocaleDateString()} to ${dateRange.endDate?.toLocaleDateString()}.`,
      categories: {
        workPerformed: {
          content: allTranscriptions,
          details: contentData.map(note => `${note.timestamp}: ${note.transcription.substring(0, 100)}...`)
        }
      },
      keyEvents: [`${contentData.length} voice notes recorded`],
      timeline: contentData.map(note => ({
        time: note.timestamp,
        activity: note.transcription.substring(0, 50) + '...',
        note: `Voice Note ${note.index}`
      })),
      recommendations: ['Review voice notes for detailed information'],
      metadata: {
        totalNotes: contentData.length,
        dateRange: {
          start: dateRange.startDate?.toLocaleDateString(),
          end: dateRange.endDate?.toLocaleDateString()
        },
        projectName,
        processedAt: new Date().toISOString(),
        fallback: true
      }
    };
  }

  /**
   * Create empty analysis for notes without transcriptions
   */
  createEmptyAnalysis(selectedNotes, dateRange, projectName) {
    return {
      summary: `No transcribed voice notes available for ${projectName} in the selected date range.`,
      categories: {},
      keyEvents: [`${selectedNotes.length} voice notes selected but no transcriptions available`],
      timeline: [],
      recommendations: ['Ensure voice notes are transcribed before generating reports'],
      metadata: {
        totalNotes: selectedNotes.length,
        transcribedNotes: 0,
        dateRange: {
          start: dateRange.startDate?.toLocaleDateString(),
          end: dateRange.endDate?.toLocaleDateString()
        },
        projectName,
        processedAt: new Date().toISOString(),
        empty: true
      }
    };
  }

  /**
   * Generate cache key for content analysis
   */
  generateCacheKey(notes, dateRange, projectName) {
    const contentHash = notes.map(note => note.id + note.transcription.substring(0, 50)).join('');
    const rangeHash = `${dateRange.startDate?.getTime()}-${dateRange.endDate?.getTime()}`;
    return `${projectName}-${rangeHash}-${contentHash}`.replace(/[^a-zA-Z0-9-]/g, '');
  }

  /**
   * Extract specific content category
   */
  extractCategory(analysis, categoryName) {
    return analysis.categories[categoryName] || { content: '', details: [] };
  }

  /**
   * Get formatted summary for specific use cases
   */
  getFormattedSummary(analysis, format = 'detailed') {
    switch (format) {
      case 'brief':
        return analysis.summary;
      case 'detailed':
        return this.createDetailedSummary(analysis);
      case 'bullets':
        return this.createBulletSummary(analysis);
      default:
        return analysis.summary;
    }
  }

  createDetailedSummary(analysis) {
    let summary = analysis.summary + '\n\n';
    
    Object.entries(analysis.categories).forEach(([category, data]) => {
      const categoryTitle = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      summary += `${categoryTitle}:\n${data.content}\n\n`;
    });
    
    return summary.trim();
  }

  createBulletSummary(analysis) {
    let summary = `• ${analysis.summary}\n`;
    
    analysis.keyEvents.forEach(event => {
      summary += `• ${event}\n`;
    });
    
    return summary;
  }

  /**
   * Clear content cache
   */
  clearCache() {
    this.processedCache.clear();
  }
}

export const contentIntelligenceService = new ContentIntelligenceService();