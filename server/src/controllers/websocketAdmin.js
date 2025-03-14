const websocketService = require('../utils/websocketService');
const WebSocketNotificationController = require('./websocketNotifications');
const logger = require('../config/logger');

/**
 * @desc    Get WebSocket connection stats
 * @route   GET /api/admin/websocket/stats
 * @access  Admin
 */
exports.getConnectionStats = async (req, res, next) => {
  try {
    const stats = websocketService.getConnectionStats();
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Send system announcement to all connected users
 * @route   POST /api/admin/websocket/announcement
 * @access  Admin
 */
exports.sendSystemAnnouncement = async (req, res, next) => {
  try {
    const { title, message, importance = 'normal', permanent = false } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title and message are required'
      });
    }

    // Send announcement via WebSocket
    const count = WebSocketNotificationController.sendSystemAnnouncement(title, message, {
      importance,
      permanent,
      sentBy: req.user.id
    });

    // Log announcement
    logger.info(`System announcement sent by ${req.user.id}: ${title}`);

    // Create notification records for all users if it's an important or permanent announcement
    if (importance === 'high' || importance === 'critical' || permanent) {
      const User = require('../models/User');
      const users = await User.find().select('_id');
      const userIds = users.map(user => user._id);
      
      const NotificationService = require('../utils/notificationService');
      await NotificationService.createBroadcastNotification({
        userIds,
        title,
        message,
        type: 'system',
        data: {
          importance,
          permanent,
          sentBy: req.user.id,
          sentAt: new Date()
        },
        sendEmail: importance === 'critical' // Only send email for critical announcements
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        deliveredTo: count,
        title,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Send direct message to a specific user
 * @route   POST /api/admin/websocket/message/:userId
 * @access  Admin
 */
exports.sendDirectMessage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { title, message, type = 'info' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title and message are required'
      });
    }

    // Verify user exists
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Create notification in database
    const NotificationService = require('../utils/notificationService');
    const notification = await NotificationService.createSystemNotification({
      userId,
      title,
      message,
      data: {
        type,
        sentBy: req.user.id,
        sentAt: new Date()
      },
      sendEmail: type === 'important' || type === 'critical'
    });

    // Check if notification was sent via WebSocket
    const delivered = WebSocketNotificationController.sendDatabaseNotification(notification);

    res.status(200).json({
      status: 'success',
      data: {
        notificationId: notification._id,
        delivered,
        title,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Disconnect a user from WebSocket
 * @route   DELETE /api/admin/websocket/connections/:userId
 * @access  Admin
 */
exports.disconnectUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // This is not yet implemented in the WebSocket service
    // Would require adding a method to forcibly close connections
    
    res.status(501).json({
      status: 'fail',
      message: 'This feature is not yet implemented'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Send MetaMask removal request notification to admins
 * @route   POST /api/admin/websocket/metamask-alert
 * @access  Admin
 */
exports.sendMetaMaskRemovalAlert = async (req, res, next) => {
  try {
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Connection ID is required'
      });
    }

    // Find connection
    const MetaMaskConnection = require('../models/MetaMaskConnection');
    const connection = await MetaMaskConnection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'MetaMask connection not found'
      });
    }

    // Send alert to all admins
    const count = await WebSocketNotificationController.sendRemovalRequestAlert(connection);

    res.status(200).json({
      status: 'success',
      data: {
        deliveredTo: count,
        connectionId: connection._id,
        walletAddress: connection.walletAddress,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};
