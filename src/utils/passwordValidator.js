/**
 * Password Validation Utility
 * Enforces strong password requirements
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Common weak passwords to reject
 */
const COMMON_PASSWORDS = [
  'password123',
  'password1234',
  'admin123456',
  'welcome123',
  'letmein123',
  'qwerty123456',
  '123456789012',
  'password12345',
  'abc123456789',
  '111111111111',
  '000000000000',
];

/**
 * Validate password against requirements
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[], strength: number }
 */
export function validatePassword(password) {
  const errors = [];
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } =
    PASSWORD_REQUIREMENTS;

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 0,
    };
  }

  // Length check
  if (password.length < minLength) {
    errors.push(`Must be at least ${minLength} characters long`);
  }

  // Uppercase check
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter (A-Z)');
  }

  // Lowercase check
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter (a-z)');
  }

  // Number check
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Must contain at least one number (0-9)');
  }

  // Special character check
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Must contain at least one special character (!@#$%^&* etc.)');
  }

  // Check for common weak passwords
  const lowerPassword = password.toLowerCase();
  const isCommonPassword = COMMON_PASSWORDS.some(common =>
    lowerPassword.includes(common.toLowerCase())
  );

  if (isCommonPassword) {
    errors.push('Password is too common. Please choose a more unique password.');
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Avoid sequential characters (e.g., abc, 123)');
  }

  // Check for repeated characters
  if (hasRepeatedChars(password)) {
    errors.push('Avoid repeated characters (e.g., aaa, 111)');
  }

  const strength = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculate password strength (0-100)
 * @param {string} password
 * @returns {number} - Strength score 0-100
 */
function calculatePasswordStrength(password) {
  let strength = 0;

  // Length contribution (up to 30 points)
  if (password.length >= 8) strength += 10;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  // Character variety (up to 50 points)
  if (/[a-z]/.test(password)) strength += 10; // Lowercase
  if (/[A-Z]/.test(password)) strength += 10; // Uppercase
  if (/\d/.test(password)) strength += 10; // Numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15; // Special chars
  if (/[^\w\s]/.test(password)) strength += 5; // Extra special chars

  // Entropy bonus (up to 20 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars > 8) strength += 5;
  if (uniqueChars > 12) strength += 5;
  if (uniqueChars > 16) strength += 10;

  // Deductions
  if (hasSequentialChars(password)) strength -= 10;
  if (hasRepeatedChars(password)) strength -= 10;
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))) strength -= 20;

  return Math.max(0, Math.min(100, strength));
}

/**
 * Check for sequential characters (abc, 123, etc.)
 */
function hasSequentialChars(password) {
  const sequences = ['abc', '123', 'xyz', '789', 'qwerty', 'asdfgh', 'zxcvbn'];
  const lowerPassword = password.toLowerCase();

  return sequences.some(seq => {
    // Check forward and backward sequences
    return lowerPassword.includes(seq) || lowerPassword.includes(seq.split('').reverse().join(''));
  });
}

/**
 * Check for repeated characters (aaa, 111, etc.)
 */
function hasRepeatedChars(password) {
  return /(.)\1{2,}/.test(password); // 3 or more same characters in a row
}

/**
 * Get password strength label and color
 * @param {number} strength - Strength score 0-100
 * @returns {Object} - { label: string, color: string, class: string }
 */
export function getPasswordStrengthLabel(strength) {
  if (strength < 30) {
    return {
      label: 'Very Weak',
      color: '#ef4444', // red-500
      class: 'text-red-500',
      bgClass: 'bg-red-500',
    };
  }
  if (strength < 50) {
    return {
      label: 'Weak',
      color: '#f97316', // orange-500
      class: 'text-orange-500',
      bgClass: 'bg-orange-500',
    };
  }
  if (strength < 70) {
    return {
      label: 'Fair',
      color: '#eab308', // yellow-500
      class: 'text-yellow-500',
      bgClass: 'bg-yellow-500',
    };
  }
  if (strength < 90) {
    return {
      label: 'Good',
      color: '#3b82f6', // blue-500
      class: 'text-blue-500',
      bgClass: 'bg-blue-500',
    };
  }
  return {
    label: 'Strong',
    color: '#22c55e', // green-500
    class: 'text-green-500',
    bgClass: 'bg-green-500',
  };
}

/**
 * Get requirements status for UI display
 * @param {string} password
 * @returns {Array} - Array of requirement objects with met status
 */
export function getRequirementsStatus(password) {
  return [
    {
      text: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      met: password.length >= PASSWORD_REQUIREMENTS.minLength,
    },
    {
      text: 'One uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      text: 'One lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      text: 'One number (0-9)',
      met: /\d/.test(password),
    },
    {
      text: 'One special character (!@#$%^&* etc.)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
    {
      text: 'Not a common password',
      met: !COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common.toLowerCase())),
    },
  ];
}
