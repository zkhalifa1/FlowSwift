import mammoth from 'mammoth';
import { logger } from '@/utils/logger';

/**
 * Convert .docx file to HTML
 * @param {File|Blob} docxFile - .docx file or blob
 * @returns {Promise<{html: string, warnings: Array}>} - HTML content and conversion warnings
 */
export async function docxToHtml(docxFile) {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await docxFile.arrayBuffer();

    // Use mammoth to convert .docx to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });

    // Log warnings if any
    if (result.messages.length > 0) {
      logger.warn('Conversion warnings:', result.messages);
    }

    return {
      html: result.value,
      warnings: result.messages,
    };
  } catch (error) {
    logger.error('Error converting .docx to HTML:', error);
    throw new Error('Failed to convert document. File may be corrupted or use unsupported features.');
  }
}

/**
 * Convert .docx file to HTML with error handling
 * @param {File|Blob} docxFile - .docx file or blob
 * @returns {Promise<string>} - HTML content
 */
export async function convertDocxToHtml(docxFile) {
  const { html } = await docxToHtml(docxFile);
  return html;
}
