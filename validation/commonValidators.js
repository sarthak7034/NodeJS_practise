// Common validation functions
const commonValidators = {
  // String validators
  isEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),

  isURL: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  isAlpha: (value) => /^[a-zA-Z]+$/.test(value),

  isAlphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),

  isNumeric: (value) => /^[0-9]+$/.test(value),

  isUUID: (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    ),

  isHexColor: (value) => /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value),

  isIPv4: (value) =>
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      value
    ),

  isPort: (value) => {
    const port = parseInt(value);
    return !isNaN(port) && port >= 0 && port <= 65535;
  },

  isStrongPassword: (value) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      value
    );
  },

  isPhoneNumber: (value) =>
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(
      value
    ),

  isCreditCard: (value) => {
    // Luhn algorithm
    const sanitized = value.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  // Number validators
  isPositive: (value) => typeof value === "number" && value > 0,

  isNegative: (value) => typeof value === "number" && value < 0,

  isInteger: (value) => Number.isInteger(value),

  isFloat: (value) => typeof value === "number" && !Number.isInteger(value),

  isBetween: (min, max) => (value) => value >= min && value <= max,

  // Array validators
  isArray: (value) => Array.isArray(value),

  isNonEmptyArray: (value) => Array.isArray(value) && value.length > 0,

  arrayOf: (validator) => (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(validator);
  },

  // Object validators
  isObject: (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value),

  hasKeys: (keys) => (value) => {
    if (typeof value !== "object" || value === null) return false;
    return keys.every((key) => key in value);
  },

  // Date validators
  isDate: (value) => value instanceof Date && !isNaN(value),

  isDateString: (value) => !isNaN(Date.parse(value)),

  isFutureDate: (value) => {
    const date = new Date(value);
    return date > new Date();
  },

  isPastDate: (value) => {
    const date = new Date(value);
    return date < new Date();
  },

  // Boolean validators
  isBoolean: (value) => typeof value === "boolean",

  isTruthy: (value) => !!value,

  isFalsy: (value) => !value,
};

module.exports = commonValidators;
