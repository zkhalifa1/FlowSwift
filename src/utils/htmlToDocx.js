import HTMLtoDOCX from 'html-to-docx';
import { logger } from '@/utils/logger';

/**
 * Convert HTML to .docx blob
 * @param {string} htmlContent - HTML content from editor
 * @param {string} filename - Filename for the document (optional)
 * @returns {Promise<Blob>} - .docx file as blob
 */
export async function htmlToDocx(htmlContent, filename = 'template.docx') {
  try {
    // html-to-docx requires a full HTML document structure
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;

    // Convert HTML to .docx blob
    const docxBlob = await HTMLtoDOCX(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    return docxBlob;
  } catch (error) {
    logger.error('Error converting HTML to .docx:', error);
    throw new Error('Failed to convert document. Please check your content and try again.');
  }
}

/**
 * Convert HTML to .docx File object
 * @param {string} htmlContent - HTML content from editor
 * @param {string} filename - Filename for the document
 * @returns {Promise<File>} - .docx file
 */
export async function htmlToDocxFile(htmlContent, filename = 'template.docx') {
  const blob = await htmlToDocx(htmlContent, filename);

  // Ensure filename ends with .docx
  const finalFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;

  return new File([blob], finalFilename, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
