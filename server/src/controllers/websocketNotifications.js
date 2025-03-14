const websocketService = require('../utils/websocketService');
const logger = require('../config/logger');
const Notification = require('../models/Notification');

/**
 * WebSocket Notification Controller
 * Handles sending real-time notifications via WebSockets
 */
class WebSocketNotificationController {
  /**
   * Send a notification to a user via WebSocket
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   * @returns {boolean} - Whether notification was sent
   */
  static sendNotification(userId, notification) {
    try {
      const count = websocketService.sendNotification(userId, notification);
      
      if (count > 0) {
        logger.debug(`Sent WebSocket notification to user ${userId}`);
        return true;
      }
      
      logger.debug(`User ${userId} not connected to WebSocket, notification not sent`);
      return false;
    } catch (error) {
      logger.error(`Error sending WebSocket notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send notifications to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification object
   * @returns {number} - Number of users notification was sent to
   */
  static sendNotificationToUsers(userIds, notification) {
    let count = 0;
    
    userIds.forEach((userId) => {
      if (this.sendNotification(userId, notification)) {
        count++;
      }
    });
    
    return count;
  }

  /**
   * Send notification to a user about a new database notification
   * @param {Object} dbNotification - Database notification object
   * @returns {boolean} - Whether notification was sent
   */
  static async sendDatabaseNotification(dbNotification) {
    try {
      // Make sure notification is populated
      const notification = dbNotification._id 
        ? dbNotification 
        : await Notification.findById(dbNotification).exec();
        
      if (!notification) {
        logger.warn(`Cannot send WebSocket notification: Notification not found`);
        return false;
      }
      
      return this.sendNotification(notification.userId.toString(), {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        relatedTo: notification.relatedTo,
        data: notification.data
      });
    } catch (error) {
      logger.error(`Error sending database notification via WebSocket: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a MetaMask connection status update
   * @param {Object} connection - MetaMask connection object
   * @returns {boolean} - Whether notification was sent
   */
  static sendMetaMaskConnectionUpdate(connection) {
    try {
      const count = websocketService.sendToUser(connection.userId.toString(), {
        type: 'metamask_connection_update',
        data: {
          connectionId: connection._id,
          walletAddress: connection.walletAddress,
          status: connection.status,
          removalRequestStatus: connection.removalRequest?.status,
          updatedAt: connection.updatedAt,
          timestamp: new Date().toISOString()
        }
      });
      
      return count > 0;
    } catch (error) {
      logger.error(`Error sending MetaMask connection update: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a strategy update to all subscribers
   * @param {Object} strategy - Strategy object
   * @returns {number} - Number of clients notification was sent to
   */
  static sendStrategyUpdate(strategy) {
    try {
      return websocketService.sendStrategyUpdate(strategy);
    } catch (error) {
      logger.error(`Error sending strategy update via WebSocket: ${error.message}`);
      return 0;
    }
  }

  /**
   * Send a transaction status update
   * @param {Object} transaction - Transaction object
   * @returns {boolean} - Whether notification was sent
   */
  static sendTransactionUpdate(transaction) {
    try {
      return websocketService.sendTransactionUpdate(transaction) > 0;
    } catch (error) {
      logger.error(`Error sending transaction update via WebSocket: ${error.message}`);
      return false;
    }
  }

  /**
   * Send an admin alert to all admin users
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {Object} data - Additional data
   * @returns {number} - Number of admins alerted
   */
  static async sendAdminAlert(title, message, data = {}) {
    try {
      // Get admin user IDs
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('_id');
      const adminIds = admins.map(admin => admin._id.toString());
      
      if (adminIds.length === 0) {
        logger.warn('No admin users found to send alert to');
        return 0;
      }
      
      let count = 0;
      adminIds.forEach((adminId) => {
        const sent = websocketService.sendToUser(adminId, {
          type: 'admin_alert',
          data: {
            title,
            message,
            timestamp: new Date().toISOString(),
            ...data
          }
        });
        
        if (sent > 0) {
          count++;
        }
      });
      
      return count;
    } catch (error) {
      logger.error(`Error sending admin alert via WebSocket: ${error.message}`);
      return 0;
    }
  }

  /**
   * Send removal request alert to admins
   * @param {Object} connection - MetaMask connection with removal request
   * @returns {number} - Number of admins alerted
   */
  static async sendRemovalRequestAlert(connection) {
    return this.sendAdminAlert(
      'New MetaMask Removal Request',
      `User has requested to remove MetaMask connection for wallet ${connection.walletAddress.substr(0, 8)}...${connection.walletAddress.substr(-6)}`,
      {
        connectionId: connection._id,
        walletAddress: connection.walletAddress,
        userId: connection.userId,
        reason: connection.removalRequest?.reason,
        email: connection.removalRequest?.email
      }
    );
  }

  /**
   * Send system announcement to all connected users
   * @param {string} title - Announcement title
   * @param {string} message - Announcement message
   * @param {Object} data - Additional data
   * @returns {number} - Number of clients message was sent to
   */
  static sendSystemAnnouncement(title, message, data = {}) {
    try {
      return websocketService.broadcast({
        type: 'system_announcement',
        data: {
          title,
          message,
          timestamp: new Date().toISOString(),
          ...data
        }
      });
    } catch (error) {
      logger.error(`Error sending system announcement: ${error.message}`);
      return 0;
    }
  }
}

module.exports = WebSocketNotificationController;
