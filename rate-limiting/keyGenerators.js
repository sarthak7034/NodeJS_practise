// Different strategies for generating rate limit keys

const keyGenerators = {
  // By IP address (default)
  byIP: (req) => {
    return (
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.connection.remoteAddress ||
      "unknown"
    );
  },

  // By user ID (requires authentication)
  byUserID: (req) => {
    return req.user?.id || req.userId || "anonymous";
  },

  // By API key
  byAPIKey: (req) => {
    return req.headers["x-api-key"] || req.query.apiKey || "no-key";
  },

  // By session ID
  bySession: (req) => {
    return req.sessionID || req.session?.id || "no-session";
  },

  // By username
  byUsername: (req) => {
    return req.body?.username || req.user?.username || req.ip || "anonymous";
  },

  // By email
  byEmail: (req) => {
    return req.body?.email || req.user?.email || req.ip || "anonymous";
  },

  // By route + IP (different limits per endpoint)
  byRouteAndIP: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const route = req.route?.path || req.path;
    return `${route}:${ip}`;
  },

  // By route + user
  byRouteAndUser: (req) => {
    const userId = req.user?.id || "anonymous";
    const route = req.route?.path || req.path;
    return `${route}:${userId}`;
  },

  // By custom header
  byHeader: (headerName) => (req) => {
    return req.headers[headerName.toLowerCase()] || "no-header";
  },

  // Composite key (IP + User)
  composite: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || "anonymous";
    return `${ip}:${userId}`;
  },

  // By tenant/organization (for multi-tenant apps)
  byTenant: (req) => {
    return (
      req.tenant?.id || req.headers["x-tenant-id"] || req.subdomain || "default"
    );
  },

  // Global (same limit for everyone)
  global: () => "global",

  // Custom function wrapper
  custom: (fn) => fn,
};

module.exports = keyGenerators;
