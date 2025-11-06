# Authentication & Authorization Guide

This guide covers the complete authentication and authorization system implemented in this Node.js application.

## Overview

The authentication system provides:

- **JWT-based authentication** with access and refresh tokens
- **Role-based authorization** (user, admin, moderator)
- **Password hashing** with bcrypt
- **Rate limiting** to prevent brute force attacks
- **Account lockout** after failed login attempts
- **Security middleware** with Helmet
- **Input validation** with express-validator

## Quick Start

### Default Users

The system comes with two default users:

```javascript
// Admin user
{
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin'
}

// Regular user
{
  username: 'user',
  email: 'user@example.com',
  password: 'user123',
  role: 'user'
}
```

### Authentication Flow

1. **Register** a new user or **login** with existing credentials
2. Receive **access token** (24h) and **refresh token** (7d)
3. Include access token in `Authorization: Bearer <token>` header
4. Use refresh token to get new access token when expired

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "user"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <access-token>
```

#### Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

### Admin Routes (`/api/admin`)

#### Get All Users (Admin Only)

```http
GET /api/admin/users
Authorization: Bearer <admin-access-token>
```

#### Update User Status (Admin Only)

```http
PATCH /api/admin/users/{userId}/status
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Get System Stats (Admin Only)

```http
GET /api/admin/stats
Authorization: Bearer <admin-access-token>
```

## Authorization Levels

### Public Routes

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

### Authenticated Routes

- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout

### Admin Only Routes

- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/stats` - System statistics
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Optional Authentication

- `GET /api/users` - List users (shows different data based on auth status)

## Security Features

### Password Security

- **Bcrypt hashing** with 12 salt rounds
- **Password requirements**: minimum 6 characters, must contain uppercase, lowercase, and number
- **No plain text storage**

### JWT Security

- **Short-lived access tokens** (24 hours)
- **Longer refresh tokens** (7 days)
- **Signed with secret key**
- **Includes issuer and audience claims**

### Rate Limiting

- **Global rate limit**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Account lockout**: 5 failed login attempts

### Security Headers

- **Helmet middleware** sets security headers
- **CORS configuration** for cross-origin requests
- **Input validation** on all endpoints

## Middleware Usage

### Authentication Middleware

```javascript
const { authenticate } = require("./auth/authMiddleware");

// Require valid JWT token
router.get("/protected", authenticate, (req, res) => {
  // req.user contains decoded token data
  res.json({ user: req.user });
});
```

### Authorization Middleware

```javascript
const { authenticate, authorize } = require("./auth/authMiddleware");

// Require admin role
router.get("/admin-only", authenticate, authorize("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// Multiple roles allowed
router.get(
  "/staff-only",
  authenticate,
  authorize("admin", "moderator"),
  (req, res) => {
    res.json({ message: "Staff access granted" });
  }
);
```

### Optional Authentication

```javascript
const { optionalAuth } = require("./auth/authMiddleware");

// Works with or without token
router.get("/public", optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: "Authenticated user", user: req.user });
  } else {
    res.json({ message: "Anonymous user" });
  }
});
```

### Owner or Admin Access

```javascript
const { authenticate, ownerOrAdmin } = require("./auth/authMiddleware");

// User can only access their own resources, or admin can access any
router.get(
  "/users/:userId/profile",
  authenticate,
  ownerOrAdmin("userId"),
  (req, res) => {
    res.json({ message: "Access granted" });
  }
);
```

## Error Handling

### Common Error Responses

```javascript
// 401 Unauthorized
{
  "success": false,
  "message": "Access token is required"
}

// 403 Forbidden
{
  "success": false,
  "message": "Insufficient permissions"
}

// 423 Locked (too many failed attempts)
{
  "success": false,
  "message": "Account temporarily locked due to too many failed login attempts"
}

// 429 Too Many Requests
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
```

## Testing with cURL

### Register and Login

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123"}'
```

### Use Access Token

```bash
# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Access admin endpoint (requires admin token)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Production Considerations

1. **Change JWT_SECRET** to a strong, random value
2. **Use HTTPS** in production
3. **Implement token blacklisting** for logout
4. **Add database persistence** instead of in-memory storage
5. **Implement email verification** for registration
6. **Add password reset functionality**
7. **Consider OAuth integration** for social login
8. **Implement audit logging** for security events
9. **Add CSRF protection** for web applications
10. **Use environment-specific configurations**

## Architecture

```
auth/
├── User.js              # User model and data operations
├── jwt.js               # JWT token generation and verification
├── authController.js    # Authentication route handlers
├── authMiddleware.js    # Authentication and authorization middleware
├── validators.js        # Input validation rules
└── authRoutes.js        # Authentication route definitions
```

This authentication system provides a solid foundation for securing your Node.js application with industry-standard practices and can be easily extended for additional features.
