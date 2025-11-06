const { validationResult } = require("express-validator");
const User = require("./User");
const JWTService = require("./jwt");

class AuthController {
  async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, email, password, role } = req.body;

      // Create user
      const user = await User.createUser({
        username,
        email,
        password,
        role: role || "user", // Default to 'user' role
      });

      // Generate tokens
      const tokens = JWTService.generateTokenPair(user);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user,
          ...tokens,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Find user
      const user = User.findByUsername(username) || User.findByEmail(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if account is locked due to too many failed attempts
      if (user.loginAttempts >= 5) {
        return res.status(423).json({
          success: false,
          message:
            "Account temporarily locked due to too many failed login attempts",
        });
      }

      // Validate password
      const isValidPassword = await User.validatePassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        User.incrementLoginAttempts(user.id);
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Reset login attempts on successful login
      User.resetLoginAttempts(user.id);

      // Generate tokens
      const tokens = JWTService.generateTokenPair(user);
      const sanitizedUser = User.sanitizeUser(user);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: sanitizedUser,
          ...tokens,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      // Verify refresh token
      const decoded = JWTService.verifyToken(refreshToken);
      const user = User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Generate new token pair
      const tokens = JWTService.generateTokenPair(user);

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: User.sanitizeUser(user),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const userId = req.user.userId;

      // Check if email is already taken by another user
      const existingUser = User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      const updatedUser = User.updateUser(userId, { email });
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async logout(req, res) {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
}

module.exports = new AuthController();
