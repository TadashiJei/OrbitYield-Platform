/**
 * WebSocket Client for OrbitYield
 * Manages WebSocket connections and provides an event-based API
 */

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Starting delay in ms
    this.reconnectTimeoutId = null;
    this.eventListeners = new Map();
    this.subscribedTopics = new Set();
    this.serverUrl = null;
    this.token = null;
    this.sessionId = null;
  }

  /**
   * Initialize WebSocket connection
   * @param {Object} options - Connection options
   * @param {string} options.serverUrl - WebSocket server URL (without /ws)
   * @param {string} options.token - JWT token for authentication (optional)
   * @param {string} options.sessionId - Session ID for tracking (optional)
   * @returns {Promise} - Resolves when connection is established
   */
  connect(options = {}) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        return resolve();
      }

      if (this.isConnecting) {
        this.once('connected', () => resolve());
        this.once('error', (error) => reject(error));
        return;
      }

      this.isConnecting = true;
      this.serverUrl = options.serverUrl || process.env.REACT_APP_API_URL || 'http://localhost:5000';
      this.token = options.token || localStorage.getItem('token');
      this.sessionId = options.sessionId || this._getOrCreateSessionId();

      // Build WebSocket URL with query parameters
      let wsUrl = this.serverUrl.replace(/^http/, 'ws') + '/ws';
      const params = new URLSearchParams();
      
      if (this.token) {
        params.append('token', this.token);
      }
      
      if (this.sessionId) {
        params.append('sessionId', this.sessionId);
      }
      
      const queryString = params.toString();
      if (queryString) {
        wsUrl += '?' + queryString;
      }

      try {
        this.socket = new WebSocket(wsUrl);
        this._setupSocketHandlers(resolve, reject);
      } catch (error) {
        this.isConnecting = false;
        this._emitEvent('error', error);
        reject(error);
      }
    });
  }

  /**
   * Set up WebSocket event handlers
   * @private
   */
  _setupSocketHandlers(resolve, reject) {
    // Connection opened
    this.socket.onopen = () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 2000;
      
      console.log('WebSocket connection established');
      this._emitEvent('connected');
      
      // Resubscribe to topics
      this.subscribedTopics.forEach(topic => {
        this._resubscribe(topic);
      });
      
      resolve();
    };

    // Listen for messages
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.debug('WebSocket message received:', data.type);
        
        // Emit event for the specific message type
        this._emitEvent(data.type, data.data);
        
        // Also emit for specific topics if applicable
        if (data.topic) {
          this._emitEvent(`topic:${data.topic}`, data.data);
        }
        
        // Emit generic message event
        this._emitEvent('message', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Connection closed
    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.isConnecting = false;
      
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this._emitEvent('disconnected', { code: event.code, reason: event.reason });
      
      // Attempt to reconnect if not closed intentionally
      if (event.code !== 1000 && event.code !== 1001) {
        this._scheduleReconnect();
      }
    };

    // Connection error
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this._emitEvent('error', error);
      
      if (!this.isConnected) {
        this.isConnecting = false;
        reject(error);
      }
    };
  }

  /**
   * Schedule a reconnection attempt
   * @private
   */
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
      this._emitEvent('reconnect_failed');
      return;
    }

    clearTimeout(this.reconnectTimeoutId);
    
    // Exponential backoff
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
    this._emitEvent('reconnecting', { attempt: this.reconnectAttempts, delay });
    
    this.reconnectTimeoutId = setTimeout(() => {
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      this.connect({
        serverUrl: this.serverUrl,
        token: this.token,
        sessionId: this.sessionId
      }).catch(() => {
        // Error will be emitted via event
      });
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    clearTimeout(this.reconnectTimeoutId);
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.subscribedTopics.clear();
  }

  /**
   * Get or create session ID for anonymous tracking
   * @private
   * @returns {string} - Session ID
   */
  _getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('wsSessionId');
    
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('wsSessionId', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Send data to the WebSocket server
   * @param {Object} data - Data to send
   * @returns {boolean} - Whether send was successful
   */
  send(data) {
    if (!this.isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Send a ping message to keep the connection alive
   * @returns {boolean} - Whether ping was sent successfully
   */
  ping() {
    return this.send({
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - Topic to subscribe to
   * @returns {boolean} - Whether subscribe request was sent
   */
  subscribe(topic) {
    if (!topic) {
      console.warn('Cannot subscribe: No topic specified');
      return false;
    }

    this.subscribedTopics.add(topic);
    
    if (!this.isConnected) {
      // Will subscribe when connected
      return true;
    }

    return this._resubscribe(topic);
  }

  /**
   * Resubscribe to a topic (used after reconnection)
   * @private
   * @param {string} topic - Topic to resubscribe to
   * @returns {boolean} - Whether subscribe request was sent
   */
  _resubscribe(topic) {
    return this.send({
      type: 'subscribe',
      topic
    });
  }

  /**
   * Unsubscribe from a topic
   * @param {string} topic - Topic to unsubscribe from
   * @returns {boolean} - Whether unsubscribe request was sent
   */
  unsubscribe(topic) {
    if (!topic) {
      console.warn('Cannot unsubscribe: No topic specified');
      return false;
    }

    this.subscribedTopics.delete(topic);
    
    if (!this.isConnected) {
      return true;
    }

    return this.send({
      type: 'unsubscribe',
      topic
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Add one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    
    this.on(event, onceCallback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Emit event to listeners
   * @private
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  _emitEvent(event, ...args) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Subscribe to strategy updates
   * @param {string} strategyId - Strategy ID
   */
  subscribeToStrategy(strategyId) {
    return this.subscribe(`strategy-${strategyId}`);
  }

  /**
   * Unsubscribe from strategy updates
   * @param {string} strategyId - Strategy ID
   */
  unsubscribeFromStrategy(strategyId) {
    return this.unsubscribe(`strategy-${strategyId}`);
  }

  /**
   * Helper function to handle notifications
   * @param {Function} callback - Function to call with each notification
   * @returns {Function} - Unsubscribe function
   */
  onNotification(callback) {
    this.on('notification', callback);
    return () => this.off('notification', callback);
  }

  /**
   * Helper function to handle transaction updates
   * @param {Function} callback - Function to call with each transaction update
   * @returns {Function} - Unsubscribe function
   */
  onTransactionUpdate(callback) {
    this.on('transaction_update', callback);
    return () => this.off('transaction_update', callback);
  }

  /**
   * Helper function to handle system announcements
   * @param {Function} callback - Function to call with each announcement
   * @returns {Function} - Unsubscribe function
   */
  onSystemAnnouncement(callback) {
    this.on('system_announcement', callback);
    return () => this.off('system_announcement', callback);
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient;
