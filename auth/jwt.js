const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

class JWTService {
  generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "nodejs-interview-prep",
      audience: "api-users",
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: "nodejs-interview-prep",
      audience: "api-users",
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: "nodejs-interview-prep",
        audience: "api-users",
      });
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }

  generateTokenPair(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken({ userId: user.id }),
      expiresIn: JWT_EXPIRES_IN,
    };
  }
}

module.exports = new JWTService();
