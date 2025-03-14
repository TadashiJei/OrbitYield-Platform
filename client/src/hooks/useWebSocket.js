import { useState, useEffect, useCallback, useRef } from 'react';
import websocketClient from '../utils/websocketClient';

/**
 * Hook for using WebSocket connections in React components
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Whether to connect automatically
 * @param {string} options.serverUrl - WebSocket server URL
 * @param {boolean} options.reconnectOnAuth - Whether to reconnect when auth changes
 * @returns {Object} - WebSocket state and methods
 */
const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    serverUrl,
    reconnectOnAuth = true,
  } = options;

  const [isConnected, setIsConnected] = useState(websocketClient.isConnected);
  const [isConnecting, setIsConnecting] = useState(websocketClient.isConnecting);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Keep track of our subscriptions for cleanup
  const subscriptions = useRef(new Map());
  
  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      // Get fresh token in case it changed
      const token = localStorage.getItem('token');
      
      await websocketClient.connect({
        serverUrl,
        token
      });
      
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionError(error);
      return false;
    } finally {
      setIsConnecting(websocketClient.isConnecting);
    }
  }, [serverUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketClient.disconnect();
  }, []);

  // Send a message to the WebSocket server
  const send = useCallback((data) => {
    return websocketClient.send(data);
  }, []);

  // Subscribe to a WebSocket event
  const on = useCallback((event, callback) => {
    // Store the subscription for cleanup
    if (!subscriptions.current.has(event)) {
      subscriptions.current.set(event, new Set());
    }
    
    subscriptions.current.get(event).add(callback);
    websocketClient.on(event, callback);
    
    // Return an unsubscribe function
    return () => {
      websocketClient.off(event, callback);
      if (subscriptions.current.has(event)) {
        subscriptions.current.get(event).delete(callback);
        if (subscriptions.current.get(event).size === 0) {
          subscriptions.current.delete(event);
        }
      }
    };
  }, []);

  // Subscribe to a topic
  const subscribe = useCallback((topic) => {
    return websocketClient.subscribe(topic);
  }, []);

  // Unsubscribe from a topic
  const unsubscribe = useCallback((topic) => {
    return websocketClient.unsubscribe(topic);
  }, []);

  // Handle connection status changes
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    };
    
    const handleDisconnected = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      // Don't set error for normal disconnections
      if (event.code !== 1000 && event.code !== 1001) {
        setConnectionError(new Error(`Connection closed: ${event.code} ${event.reason}`));
      }
    };
    
    const handleError = (error) => {
      setConnectionError(error);
    };
    
    const handleReconnecting = (data) => {
      setIsConnecting(true);
      setReconnectAttempt(data.attempt);
    };
    
    const handleMessage = (data) => {
      setLastMessage(data);
    };
    
    const handleNotification = (data) => {
      setNotifications(prev => [data, ...prev].slice(0, 50)); // Keep most recent 50
    };

    websocketClient.on('connected', handleConnected);
    websocketClient.on('disconnected', handleDisconnected);
    websocketClient.on('error', handleError);
    websocketClient.on('reconnecting', handleReconnecting);
    websocketClient.on('message', handleMessage);
    websocketClient.on('notification', handleNotification);

    return () => {
      websocketClient.off('connected', handleConnected);
      websocketClient.off('disconnected', handleDisconnected);
      websocketClient.off('error', handleError);
      websocketClient.off('reconnecting', handleReconnecting);
      websocketClient.off('message', handleMessage);
      websocketClient.off('notification', handleNotification);
    };
  }, []);

  // Connect automatically if enabled
  useEffect(() => {
    if (autoConnect && !websocketClient.isConnected && !websocketClient.isConnecting) {
      connect();
    }
    
    return () => {
      // Cleanup all subscriptions on unmount
      subscriptions.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          websocketClient.off(event, callback);
        });
      });
      
      // Don't disconnect on unmount, as other components might be using the connection
      // Only disconnect explicitly when needed
    };
  }, [autoConnect, connect]);

  // Reconnect when authentication changes
  useEffect(() => {
    if (!reconnectOnAuth) return;
    
    const handleStorageChange = (e) => {
      if (e.key === 'token' && websocketClient.isConnected) {
        // Reconnect with the new token
        disconnect();
        connect();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reconnectOnAuth, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    connectionError,
    notifications,
    reconnectAttempt,
    connect,
    disconnect,
    send,
    on,
    subscribe,
    unsubscribe,
    
    // Helper for subscribing to strategies
    subscribeToStrategy: useCallback((strategyId) => {
      return websocketClient.subscribeToStrategy(strategyId);
    }, []),
    
    // Helper for unsubscribing from strategies
    unsubscribeFromStrategy: useCallback((strategyId) => {
      return websocketClient.unsubscribeFromStrategy(strategyId);
    }, []),
    
    // Helper for subscribing to transactions
    onTransactionUpdate: useCallback((callback) => {
      return on('transaction_update', callback);
    }, [on]),
    
    // Helper for subscribing to system announcements
    onSystemAnnouncement: useCallback((callback) => {
      return on('system_announcement', callback);
    }, [on]),
    
    // Helper for subscribing to MetaMask connection updates
    onMetaMaskUpdate: useCallback((callback) => {
      return on('metamask_connection_update', callback);
    }, [on]),
    
    // The raw WebSocket client instance (advanced usage)
    client: websocketClient
  };
};

export default useWebSocket;
