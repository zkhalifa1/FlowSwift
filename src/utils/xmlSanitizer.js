/**
 * XML Sanitization Utility
 * Prevents XML injection and ensures valid XML output
 */

/**
 * Escapes special XML characters to prevent injection
 * @param {string} unsafe - Text to escape
 * @returns {string} - Escaped text safe for XML
 */
export function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }

  return unsafe
    .replace(/&/g, '&amp;')   // Must be first!
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unescapes XML entities back to normal characters
 * (for display purposes only, not for XML insertion)
 * @param {string} safe - Escaped XML text
 * @returns {string} - Unescaped text
 */
export function unescapeXml(safe) {
  if (typeof safe !== 'string') {
    return '';
  }

  return safe
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');  // Must be last!
}

/**
 * Sanitizes text for insertion into Word document XML
 * Preserves line breaks and basic formatting
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeForWordXml(text) {
  if (typeof text !== 'string') {
    return '';
  }

  // 1. Escape XML special characters
  let sanitized = escapeXml(text);

  // 2. Preserve line breaks (convert to Word XML format)
  // Note: Actual implementation should use <w:br/> tags
  sanitized = sanitized.replace(/\n/g, '</w:t><w:br/><w:t>');

  // 3. Handle tabs
  sanitized = sanitized.replace(/\t/g, '</w:t><w:tab/><w:t>');

  return sanitized;
}

/**
 * Validates that text is safe for XML insertion
 * @param {string} text - Text to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateXmlSafe(text) {
  const errors = [];

  if (typeof text !== 'string') {
    errors.push('Input must be a string');
    return { isValid: false, errors };
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    { pattern: /<script/i, message: 'Script tags not allowed' },
    { pattern: /<!ENTITY/i, message: 'XML entities not allowed' },
    { pattern: /<!DOCTYPE/i, message: 'DOCTYPE declarations not allowed' },
    { pattern: /<\?xml/i, message: 'XML declarations not allowed' },
    { pattern: /javascript:/i, message: 'JavaScript URLs not allowed' },
    { pattern: /on\w+\s*=/i, message: 'Event handlers not allowed' },
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(text)) {
      errors.push(message);
    }
  }

  // Check for unbalanced XML-like tags
  const openTags = (text.match(/</g) || []).length;
  const closeTags = (text.match(/>/g) || []).length;
  if (openTags !== closeTags) {
    errors.push('Unbalanced XML-like brackets detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Strips all XML/HTML tags from text
 * Use for displaying user input safely
 * @param {string} text - Text with potential tags
 * @returns {string} - Text without tags
 */
export function stripXmlTags(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize object for logging/display
 * Removes potentially dangerous content
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return typeof obj === 'string' ? stripXmlTags(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}
