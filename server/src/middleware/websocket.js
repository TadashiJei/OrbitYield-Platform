const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware for WebSocket authentication
 * Verifies JWT token from the WebSocket connection query string
 * @param {Object} req - Request object
 * @param {Object} socket - WebSocket socket
 * @param {Function} next - Next function
 */
exports.authenticateWebSocket = (req, socket, next) => {
  try {
    // Extract token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      // Allow connection without authentication (as anonymous)
      req.user = null;
      return next();
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn(`Invalid WebSocket auth token: ${err.message}`);
        req.user = null;
      } else {
        // Set user info on request
        req.user = decoded;
        logger.debug(`WebSocket authenticated for user ${decoded.id}`);
      }
      
      next();
    });
  } catch (error) {
    logger.error(`WebSocket authentication error: ${error.message}`);
    req.user = null;
    next();
  }
};

/**
 * Middleware to extract session identifier
 * @param {Object} req - Request object
 * @param {Object} socket - WebSocket socket
 * @param {Function} next - Next function
 */
exports.extractSessionId = (req, socket, next) => {
  try {
    // Extract session ID from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    req.sessionId = sessionId || null;
    next();
  } catch (error) {
    logger.error(`WebSocket session extraction error: ${error.message}`);
    req.sessionId = null;
    next();
  }
};

/**
 * Middleware to handle CORS for WebSocket
 * @param {Object} req - Request object
 * @param {Object} socket - WebSocket socket
 * @param {Function} next - Next function
 */
exports.handleWebSocketCORS = (req, socket, next) => {
  try {
    // Check origin
    const origin = req.headers.origin;
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      // Add other allowed origins here
    ];
    
    if (origin && !allowedOrigins.includes(origin)) {
      logger.warn(`WebSocket connection rejected: Origin ${origin} not allowed`);
      socket.destroy();
      return;
    }
    
    next();
  } catch (error) {
    logger.error(`WebSocket CORS error: ${error.message}`);
    next();
  }
};

/**
 * Apply all WebSocket middleware
 * @param {Object} req - Request object
 * @param {Object} socket - WebSocket socket
 * @param {Function} next - Next function
 */
exports.applyWebSocketMiddleware = (req, socket, next) => {
  // Chain middleware
  this.handleWebSocketCORS(req, socket, () => {
    this.extractSessionId(req, socket, () => {
      this.authenticateWebSocket(req, socket, next);
    });
  });
};
