const bcrypt = require("bcryptjs");

/**
 * Simple in-memory user store for demonstration
 * In production, this would be replaced with a database
 */
class User {
  constructor() {
    this.users = new Map();
    this.initializeDefaultUsers();
  }

  async initializeDefaultUsers() {
    // Create default admin user
    await this.createUser({
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    });

    // Create default regular user
    await this.createUser({
      username: "user",
      email: "user@example.com",
      password: "user123",
      role: "user",
    });
  }

  async createUser(userData) {
    const { username, email, password, role = "user" } = userData;

    // Check if user already exists
    if (this.findByUsername(username) || this.findByEmail(email)) {
      throw new Error("User already exists");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: this.generateId(),
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      isActive: true,
      loginAttempts: 0,
      lastLogin: null,
    };

    this.users.set(user.id, user);
    return this.sanitizeUser(user);
  }

  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  findById(id) {
    return this.users.get(id);
  }

  findByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  findByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return this.sanitizeUser(updatedUser);
  }

  incrementLoginAttempts(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      this.users.set(userId, user);
    }
  }

  resetLoginAttempts(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.loginAttempts = 0;
      user.lastLogin = new Date();
      this.users.set(userId, user);
    }
  }

  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  getAllUsers() {
    return Array.from(this.users.values()).map((user) =>
      this.sanitizeUser(user)
    );
  }
}

module.exports = new User();
