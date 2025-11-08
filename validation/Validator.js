class ValidationError extends Error {
  constructor(errors) {
    super("Validation failed");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

class Validator {
  constructor() {
    this.rules = {};
    this.customValidators = {};
  }

  // Define validation rules for fields
  field(fieldName) {
    this.rules[fieldName] = this.rules[fieldName] || [];
    return {
      required: (message = `${fieldName} is required`) => {
        this.rules[fieldName].push({
          validator: (value) =>
            value !== undefined && value !== null && value !== "",
          message,
        });
        return this.field(fieldName);
      },

      string: (message = `${fieldName} must be a string`) => {
        this.rules[fieldName].push({
          validator: (value) => typeof value === "string",
          message,
        });
        return this.field(fieldName);
      },

      number: (message = `${fieldName} must be a number`) => {
        this.rules[fieldName].push({
          validator: (value) => typeof value === "number" && !isNaN(value),
          message,
        });
        return this.field(fieldName);
      },

      email: (message = `${fieldName} must be a valid email`) => {
        this.rules[fieldName].push({
          validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message,
        });
        return this.field(fieldName);
      },

      min: (
        minValue,
        message = `${fieldName} must be at least ${minValue}`
      ) => {
        this.rules[fieldName].push({
          validator: (value) => {
            if (typeof value === "number") return value >= minValue;
            if (typeof value === "string") return value.length >= minValue;
            if (Array.isArray(value)) return value.length >= minValue;
            return false;
          },
          message,
        });
        return this.field(fieldName);
      },

      max: (maxValue, message = `${fieldName} must be at most ${maxValue}`) => {
        this.rules[fieldName].push({
          validator: (value) => {
            if (typeof value === "number") return value <= maxValue;
            if (typeof value === "string") return value.length <= maxValue;
            if (Array.isArray(value)) return value.length <= maxValue;
            return false;
          },
          message,
        });
        return this.field(fieldName);
      },

      pattern: (regex, message = `${fieldName} format is invalid`) => {
        this.rules[fieldName].push({
          validator: (value) => regex.test(value),
          message,
        });
        return this.field(fieldName);
      },

      in: (
        allowedValues,
        message = `${fieldName} must be one of: ${allowedValues.join(", ")}`
      ) => {
        this.rules[fieldName].push({
          validator: (value) => allowedValues.includes(value),
          message,
        });
        return this.field(fieldName);
      },

      custom: (validatorFn, message = `${fieldName} is invalid`) => {
        this.rules[fieldName].push({
          validator: validatorFn,
          message,
        });
        return this.field(fieldName);
      },
    };
  }

  // Register custom validator
  registerValidator(name, validatorFn) {
    this.customValidators[name] = validatorFn;
  }

  // Validate data against rules
  validate(data) {
    const errors = {};

    for (const [fieldName, rules] of Object.entries(this.rules)) {
      const value = data[fieldName];

      for (const rule of rules) {
        if (!rule.validator(value)) {
          errors[fieldName] = errors[fieldName] || [];
          errors[fieldName].push(rule.message);
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    return true;
  }

  // Async validation
  async validateAsync(data) {
    return this.validate(data);
  }

  // Reset rules
  reset() {
    this.rules = {};
    return this;
  }
}

module.exports = { Validator, ValidationError };
