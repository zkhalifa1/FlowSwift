/**
 * File Validation Utility
 * Validates file uploads using magic bytes and content inspection
 * Prevents malicious file uploads
 */

import { logger } from './logger';

/**
 * Magic bytes for common file types
 */
const MAGIC_BYTES = {
  docx: {
    signature: [0x50, 0x4b, 0x03, 0x04], // ZIP signature (DOCX is a ZIP)
    offset: 0,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  pdf: {
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
    mimeType: 'application/pdf',
  },
  png: {
    signature: [0x89, 0x50, 0x4e, 0x47], // PNG signature
    offset: 0,
    mimeType: 'image/png',
  },
  jpg: {
    signature: [0xff, 0xd8, 0xff], // JPEG signature
    offset: 0,
    mimeType: 'image/jpeg',
  },
  mp3: {
    signature: [0x49, 0x44, 0x33], // ID3 tag
    offset: 0,
    mimeType: 'audio/mpeg',
  },
  wav: {
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF
    offset: 0,
    mimeType: 'audio/wav',
  },
  webm: {
    signature: [0x1a, 0x45, 0xdf, 0xa3], // EBML header
    offset: 0,
    mimeType: 'audio/webm',
  },
};

/**
 * Maximum file sizes (in bytes)
 */
const MAX_FILE_SIZES = {
  audio: 25 * 1024 * 1024, // 25 MB for audio files (Whisper limit)
  document: 10 * 1024 * 1024, // 10 MB for documents
  image: 5 * 1024 * 1024, // 5 MB for images
};

/**
 * Validate file using magic bytes
 * @param {File} file - File object to validate
 * @param {string[]} allowedTypes - Array of allowed file types (e.g., ['docx', 'pdf'])
 * @returns {Promise<Object>} - { isValid: boolean, errors: string[], detectedType?: string }
 */
export async function validateFileType(file, allowedTypes = []) {
  const errors = [];

  if (!file || !(file instanceof File)) {
    errors.push('Invalid file object');
    return { isValid: false, errors };
  }

  try {
    // Read first 8 bytes for magic byte checking
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let detectedType = null;

    // Check magic bytes for each allowed type
    for (const type of allowedTypes) {
      const magicInfo = MAGIC_BYTES[type];
      if (!magicInfo) {
        continue;
      }

      const matches = magicInfo.signature.every(
        (byte, index) => bytes[magicInfo.offset + index] === byte
      );

      if (matches) {
        detectedType = type;
        break;
      }
    }

    if (!detectedType) {
      errors.push(
        `File type not allowed. Expected: ${allowedTypes.join(', ')}. ` +
        `Please upload a valid file.`
      );
      return { isValid: false, errors };
    }

    // For DOCX files, perform additional ZIP validation
    if (detectedType === 'docx') {
      const isValidDocx = await validateDocxStructure(file);
      if (!isValidDocx) {
        errors.push('Invalid DOCX file structure');
        return { isValid: false, errors, detectedType };
      }
    }

    return { isValid: true, errors: [], detectedType };
  } catch (error) {
    errors.push(`File validation error: ${error.message}`);
    return { isValid: false, errors };
  }
}

/**
 * Validate DOCX file structure
 * Ensures file is a valid ZIP with required DOCX components
 * @param {File} file - DOCX file to validate
 * @returns {Promise<boolean>}
 */
async function validateDocxStructure(file) {
  try {
    // Read more bytes to check ZIP structure
    const arrayBuffer = await file.slice(0, 512).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check for ZIP local file header signature
    const hasZipSignature =
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      (bytes[2] === 0x03 || bytes[2] === 0x05) &&
      (bytes[3] === 0x04 || bytes[3] === 0x06);

    if (!hasZipSignature) {
      return false;
    }

    // Additional check: Look for common DOCX internal files
    // Note: Full validation would require unzipping, but this is a reasonable heuristic
    const fileString = new TextDecoder().decode(bytes);
    const hasWordContent =
      fileString.includes('word/') ||
      fileString.includes('[Content_Types].xml');

    return hasWordContent;
  } catch (error) {
    logger.error('DOCX validation failed:', error);
    return false;
  }
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {string} category - File category ('audio', 'document', 'image')
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateFileSize(file, category = 'document') {
  const errors = [];

  if (!file || !(file instanceof File)) {
    errors.push('Invalid file object');
    return { isValid: false, errors };
  }

  const maxSize = MAX_FILE_SIZES[category];
  if (!maxSize) {
    errors.push(`Unknown file category: ${category}`);
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(
      `File too large: ${actualSizeMB}MB. Maximum allowed: ${maxSizeMB}MB`
    );
    return { isValid: false, errors };
  }

  if (file.size === 0) {
    errors.push('File is empty');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validate filename for security issues
 * @param {string} filename - Filename to validate
 * @returns {Object} - { isValid: boolean, errors: string[], sanitized: string }
 */
export function validateFilename(filename) {
  const errors = [];

  if (!filename || typeof filename !== 'string') {
    errors.push('Invalid filename');
    return { isValid: false, errors, sanitized: '' };
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Filename contains invalid characters (path traversal detected)');
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    errors.push('Filename contains null bytes');
  }

  // Check for excessive length
  if (filename.length > 255) {
    errors.push('Filename too long (max 255 characters)');
  }

  // Sanitize filename
  let sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.{2,}/g, '.') // Remove consecutive dots
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255); // Enforce max length

  // Ensure file has an extension
  if (!sanitized.includes('.')) {
    errors.push('Filename must have an extension');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Complete file validation (type, size, filename)
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedTypes - Allowed file types
 * @param {string} options.category - File category for size validation
 * @returns {Promise<Object>} - { isValid: boolean, errors: string[], detectedType?: string, sanitizedName?: string }
 */
export async function validateFile(file, options = {}) {
  const { allowedTypes = ['docx'], category = 'document' } = options;
  const allErrors = [];

  // Validate filename
  const filenameValidation = validateFilename(file.name);
  if (!filenameValidation.isValid) {
    allErrors.push(...filenameValidation.errors);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, category);
  if (!sizeValidation.isValid) {
    allErrors.push(...sizeValidation.errors);
  }

  // Validate file type (magic bytes)
  const typeValidation = await validateFileType(file, allowedTypes);
  if (!typeValidation.isValid) {
    allErrors.push(...typeValidation.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    detectedType: typeValidation.detectedType,
    sanitizedName: filenameValidation.sanitized,
  };
}

/**
 * Validate audio file for transcription
 * @param {File} file - Audio file to validate
 * @returns {Promise<Object>} - Validation result
 */
export async function validateAudioFile(file) {
  return validateFile(file, {
    allowedTypes: ['mp3', 'wav', 'webm'],
    category: 'audio',
  });
}

/**
 * Validate document template file
 * @param {File} file - Document file to validate
 * @returns {Promise<Object>} - Validation result
 */
export async function validateTemplateFile(file) {
  return validateFile(file, {
    allowedTypes: ['docx'],
    category: 'document',
  });
}
