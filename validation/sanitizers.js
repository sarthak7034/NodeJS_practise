// Data sanitization functions
const sanitizers = {
  // String sanitizers
  trim: (value) => (typeof value === "string" ? value.trim() : value),

  toLowerCase: (value) =>
    typeof value === "string" ? value.toLowerCase() : value,

  toUpperCase: (value) =>
    typeof value === "string" ? value.toUpperCase() : value,

  escape: (value) => {
    if (typeof value !== "string") return value;
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  stripTags: (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/<[^>]*>/g, "");
  },

  normalizeEmail: (value) => {
    if (typeof value !== "string") return value;
    return value.toLowerCase().trim();
  },

  removeWhitespace: (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/\s+/g, "");
  },

  normalizeWhitespace: (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/\s+/g, " ").trim();
  },

  // Number sanitizers
  toNumber: (value) => {
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  toInteger: (value) => {
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  },

  toFloat: (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  },

  clamp: (min, max) => (value) => {
    if (typeof value !== "number") return value;
    return Math.min(Math.max(value, min), max);
  },

  // Boolean sanitizers
  toBoolean: (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "1" || lower === "yes") return true;
      if (lower === "false" || lower === "0" || lower === "no") return false;
    }
    return !!value;
  },

  // Array sanitizers
  unique: (value) => {
    if (!Array.isArray(value)) return value;
    return [...new Set(value)];
  },

  compact: (value) => {
    if (!Array.isArray(value)) return value;
    return value.filter(
      (item) => item !== null && item !== undefined && item !== ""
    );
  },

  // Object sanitizers
  removeNullValues: (value) => {
    if (typeof value !== "object" || value === null) return value;
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== null && val !== undefined) {
        result[key] = val;
      }
    }
    return result;
  },

  pickKeys: (keys) => (value) => {
    if (typeof value !== "object" || value === null) return value;
    const result = {};
    keys.forEach((key) => {
      if (key in value) {
        result[key] = value[key];
      }
    });
    return result;
  },

  omitKeys: (keys) => (value) => {
    if (typeof value !== "object" || value === null) return value;
    const result = { ...value };
    keys.forEach((key) => delete result[key]);
    return result;
  },
};

module.exports = sanitizers;
