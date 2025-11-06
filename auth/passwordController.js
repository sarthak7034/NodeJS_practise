const { validationResult } = require("express-validator");
const User = require("./User");
const bcrypt = require("bcryptjs");

class PasswordController {
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Get user
      const user = User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isValidPassword = await User.validatePassword(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      User.updateUser(userId, { password: hashedNewPassword });

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async resetLoginAttempts(req, res) {
    try {
      const { userId } = req.params;

      // Only admin can reset login attempts for other users
      if (req.user.role !== "admin" && req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      const user = User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      User.resetLoginAttempts(userId);

      res.json({
        success: true,
        message: "Login attempts reset successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new PasswordController();
