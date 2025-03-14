const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');

/**
 * WebSocket Service for managing real-time connections and communication
 */
class WebSocketService {
  constructor(server) {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> Set of websocket connections
    this.anonymousClients = new Set(); // Set of anonymous connections
    
    if (server) {
      this.init(server);
    }
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  init(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    // Set up event handlers
    this.setupConnectionHandlers();

    logger.info('WebSocket server initialized');
    return this;
  }

  /**
   * Set up WebSocket connection handlers
   */
  setupConnectionHandlers() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from query string
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const sessionId = url.searchParams.get('sessionId');
        
        // Try to authenticate user
        let userId = null;
        let user = null;

        if (token) {
          try {
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
            
            // Get user info
            user = await User.findById(userId);
            if (!user) {
              userId = null;
            }
          } catch (error) {
            logger.warn(`Invalid WebSocket auth token: ${error.message}`);
          }
        }

        // Store connection info
        ws.isAlive = true;
        ws.userId = userId;
        ws.sessionId = sessionId;

        // Add client to appropriate collection
        if (userId) {
          if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
          }
          this.clients.get(userId).add(ws);
          logger.debug(`User ${userId} connected to WebSocket`);
        } else {
          this.anonymousClients.add(ws);
          logger.debug(`Anonymous client connected to WebSocket (sessionId: ${sessionId || 'none'})`);
        }

        // Set up connection handlers
        this.setupClientHandlers(ws);

        // Send welcome message
        this.sendToClient(ws, {
          type: 'connection_established',
          data: {
            authenticated: Boolean(userId),
            userId: userId,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        logger.error(`Error handling WebSocket connection: ${error.message}`);
      }
    });

    // Set up heartbeat interval to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.debug(`Terminating inactive WebSocket connection`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    // Clean up on server close
    this.wss.on('close', () => {
      clearInterval(this.heartbeatInterval);
    });
  }

  /**
   * Set up handlers for a specific client
   * @param {Object} ws - WebSocket connection
   */
  setupClientHandlers(ws) {
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.debug(`WebSocket message received: ${data.type}`);
        
        // Handle message types
        switch (data.type) {
          case 'ping':
            this.sendToClient(ws, { type: 'pong', data: { timestamp: new Date().toISOString() } });
            break;
            
          case 'subscribe':
            // Handle subscription to topics
            if (data.topic) {
              ws.subscribedTopics = ws.subscribedTopics || new Set();
              ws.subscribedTopics.add(data.topic);
              this.sendToClient(ws, { 
                type: 'subscribed', 
                topic: data.topic,
                data: { timestamp: new Date().toISOString() } 
              });
            }
            break;
            
          case 'unsubscribe':
            // Handle unsubscription from topics
            if (data.topic && ws.subscribedTopics) {
              ws.subscribedTopics.delete(data.topic);
              this.sendToClient(ws, { 
                type: 'unsubscribed', 
                topic: data.topic,
                data: { timestamp: new Date().toISOString() } 
              });
            }
            break;
            
          default:
            // Unknown message type
            logger.warn(`Unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        logger.error(`Error handling WebSocket message: ${error.message}`);
      }
    });

    // Handle pong responses (heartbeat)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle connection close
    ws.on('close', () => {
      // Remove client from collections
      if (ws.userId && this.clients.has(ws.userId)) {
        this.clients.get(ws.userId).delete(ws);
        
        // Clean up empty sets
        if (this.clients.get(ws.userId).size === 0) {
          this.clients.delete(ws.userId);
        }
        
        logger.debug(`User ${ws.userId} disconnected from WebSocket`);
      } else {
        this.anonymousClients.delete(ws);
        logger.debug(`Anonymous client disconnected from WebSocket`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error: ${error.message}`);
    });
  }

  /**
   * Send message to a specific client
   * @param {Object} ws - WebSocket connection
   * @param {Object} data - Message data
   */
  sendToClient(ws, data) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error sending WebSocket message: ${error.message}`);
      return false;
    }
  }

  /**
   * Send message to a specific user (all connections)
   * @param {string} userId - User ID
   * @param {Object} data - Message data
   * @returns {number} - Number of clients message was sent to
   */
  sendToUser(userId, data) {
    let count = 0;
    
    if (this.clients.has(userId)) {
      this.clients.get(userId).forEach((ws) => {
        if (this.sendToClient(ws, data)) {
          count++;
        }
      });
    }
    
    return count;
  }

  /**
   * Send message to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} data - Message data
   * @returns {number} - Number of clients message was sent to
   */
  sendToUsers(userIds, data) {
    let count = 0;
    
    userIds.forEach((userId) => {
      count += this.sendToUser(userId, data);
    });
    
    return count;
  }

  /**
   * Send message to all authenticated users
   * @param {Object} data - Message data
   * @returns {number} - Number of clients message was sent to
   */
  sendToAllUsers(data) {
    let count = 0;
    
    this.clients.forEach((clients) => {
      clients.forEach((ws) => {
        if (this.sendToClient(ws, data)) {
          count++;
        }
      });
    });
    
    return count;
  }

  /**
   * Send message to all clients (authenticated and anonymous)
   * @param {Object} data - Message data
   * @returns {number} - Number of clients message was sent to
   */
  broadcast(data) {
    let count = 0;
    
    // Send to authenticated users
    count += this.sendToAllUsers(data);
    
    // Send to anonymous clients
    this.anonymousClients.forEach((ws) => {
      if (this.sendToClient(ws, data)) {
        count++;
      }
    });
    
    return count;
  }

  /**
   * Send message to clients subscribed to a topic
   * @param {string} topic - Topic name
   * @param {Object} data - Message data
   * @returns {number} - Number of clients message was sent to
   */
  sendToTopic(topic, data) {
    let count = 0;
    
    // Include topic in message
    const message = {
      ...data,
      topic
    };
    
    // Send to authenticated users subscribed to topic
    this.clients.forEach((clients) => {
      clients.forEach((ws) => {
        if (ws.subscribedTopics && ws.subscribedTopics.has(topic)) {
          if (this.sendToClient(ws, message)) {
            count++;
          }
        }
      });
    });
    
    // Send to anonymous clients subscribed to topic
    this.anonymousClients.forEach((ws) => {
      if (ws.subscribedTopics && ws.subscribedTopics.has(topic)) {
        if (this.sendToClient(ws, message)) {
          count++;
        }
      }
    });
    
    return count;
  }

  /**
   * Send notification to a user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   * @returns {number} - Number of clients notification was sent to
   */
  sendNotification(userId, notification) {
    return this.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }

  /**
   * Send strategy update to subscribers
   * @param {Object} strategy - Strategy object
   * @returns {number} - Number of clients notification was sent to
   */
  sendStrategyUpdate(strategy) {
    return this.sendToTopic(`strategy-${strategy._id}`, {
      type: 'strategy_update',
      data: {
        strategyId: strategy._id,
        name: strategy.name,
        apy: strategy.apy,
        isActive: strategy.isActive,
        isPaused: strategy.isPaused,
        updatedAt: strategy.updatedAt,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send transaction status update to user
   * @param {Object} transaction - Transaction object
   * @returns {number} - Number of clients notification was sent to
   */
  sendTransactionUpdate(transaction) {
    return this.sendToUser(transaction.userId.toString(), {
      type: 'transaction_update',
      data: {
        transactionId: transaction._id,
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        asset: transaction.asset,
        updatedAt: transaction.updatedAt,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get active connection count
   * @returns {Object} - Connection counts
   */
  getConnectionStats() {
    let authenticatedCount = 0;
    
    this.clients.forEach((clients) => {
      authenticatedCount += clients.size;
    });
    
    return {
      authenticated: authenticatedCount,
      anonymous: this.anonymousClients.size,
      total: authenticatedCount + this.anonymousClients.size,
      uniqueUsers: this.clients.size
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService;
