const { Validator, commonValidators, sanitizers } = require("./index");

// Example 1: Basic user registration validation
function createUserValidator() {
  const validator = new Validator();

  validator
    .field("username")
    .required()
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .pattern(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    );

  validator.field("email").required().string().email();

  validator
    .field("password")
    .required()
    .string()
    .min(8, "Password must be at least 8 characters")
    .custom(
      commonValidators.isStrongPassword,
      "Password must contain uppercase, lowercase, number, and special character"
    );

  validator
    .field("age")
    .number()
    .min(18, "Must be at least 18 years old")
    .max(120, "Invalid age");

  return validator;
}

// Example 2: Product validation
function createProductValidator() {
  const validator = new Validator();

  validator.field("name").required().string().min(1).max(100);

  validator
    .field("price")
    .required()
    .number()
    .custom(commonValidators.isPositive, "Price must be positive");

  validator
    .field("category")
    .required()
    .string()
    .in(["electronics", "clothing", "food", "books"], "Invalid category");

  validator
    .field("sku")
    .required()
    .string()
    .pattern(/^[A-Z]{3}-\d{6}$/, "SKU must be in format XXX-123456");

  return validator;
}

// Example 3: Using with sanitizers
function sanitizeAndValidateUser(data) {
  // First sanitize
  const sanitized = {
    username: sanitizers.trim(data.username),
    email: sanitizers.normalizeEmail(data.email),
    password: data.password,
    age: sanitizers.toInteger(data.age),
  };

  // Then validate
  const validator = createUserValidator();
  validator.validate(sanitized);

  return sanitized;
}

// Example 4: Custom validator
function createOrderValidator() {
  const validator = new Validator();

  validator
    .field("items")
    .required()
    .custom(
      commonValidators.isNonEmptyArray,
      "Order must contain at least one item"
    )
    .custom(
      commonValidators.arrayOf(
        (item) =>
          typeof item === "object" && "productId" in item && "quantity" in item
      ),
      "Each item must have productId and quantity"
    );

  validator
    .field("shippingAddress")
    .required()
    .custom(
      commonValidators.hasKeys(["street", "city", "zipCode"]),
      "Shipping address must include street, city, and zipCode"
    );

  return validator;
}

// Example usage
if (require.main === module) {
  try {
    // Test user validation
    const userValidator = createUserValidator();
    userValidator.validate({
      username: "john_doe",
      email: "john@example.com",
      password: "SecurePass123!",
      age: 25,
    });
    console.log("✓ User validation passed");

    // Test product validation
    const productValidator = createProductValidator();
    productValidator.validate({
      name: "Laptop",
      price: 999.99,
      category: "electronics",
      sku: "ELC-123456",
    });
    console.log("✓ Product validation passed");

    // Test with invalid data
    try {
      userValidator.validate({
        username: "ab",
        email: "invalid-email",
        password: "weak",
      });
    } catch (error) {
      console.log("✓ Validation correctly caught errors:", error.errors);
    }
  } catch (error) {
    console.error("Validation error:", error.errors);
  }
}

module.exports = {
  createUserValidator,
  createProductValidator,
  createOrderValidator,
  sanitizeAndValidateUser,
};
