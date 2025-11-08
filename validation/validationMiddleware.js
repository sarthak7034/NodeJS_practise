const { ValidationError } = require("./Validator");

// Express middleware for validation
const validate = (validator) => {
  return (req, res, next) => {
    try {
      validator.validate(req.body);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// Validate query parameters
const validateQuery = (validator) => {
  return (req, res, next) => {
    try {
      validator.validate(req.query);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Query validation failed",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// Validate route parameters
const validateParams = (validator) => {
  return (req, res, next) => {
    try {
      validator.validate(req.params);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Parameter validation failed",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// Sanitize request data
const sanitize = (sanitizers) => {
  return (req, res, next) => {
    if (req.body) {
      for (const [field, sanitizerFn] of Object.entries(sanitizers)) {
        if (field in req.body) {
          req.body[field] = sanitizerFn(req.body[field]);
        }
      }
    }
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  sanitize,
};
