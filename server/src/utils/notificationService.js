const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../config/logger');
const emailService = require('./email');
const WebSocketNotificationController = require('../controllers/websocketNotifications');

/**
 * Notification service for creating and managing notifications
 */
class NotificationService {
  /**
   * Create a transaction notification
   * @param {Object} options - Options for the notification
   * @returns {Promise<Notification>}
   */
  static async createTransactionNotification({ 
    userId, 
    transaction, 
    title, 
    message,
    sendEmail = true,
    emailTemplate = null
  }) {
    try {
      // Create notification
      const notification = await Notification.createTransactionNotification({
        userId,
        transaction,
        title,
        message
      });
      
      // Send real-time notification via WebSocket
      WebSocketNotificationController.sendDatabaseNotification(notification);
      
      // Also send specific transaction update via WebSocket
      WebSocketNotificationController.sendTransactionUpdate(transaction);

      // Send email if required
      if (sendEmail) {
        const user = await User.findById(userId);
        
        if (user && user.preferences?.notifications?.email !== false) {
          await this.sendNotificationEmail({
            user,
            title,
            message,
            transaction,
            template: emailTemplate || 'transaction-notification'
          });
        }
      }

      return notification;
    } catch (error) {
      logger.error(`Error creating transaction notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a strategy notification
   * @param {Object} options - Options for the notification
   * @returns {Promise<Notification>}
   */
  static async createStrategyNotification({ 
    userId, 
    strategy, 
    title, 
    message,
    sendEmail = true,
    emailTemplate = null
  }) {
    try {
      // Create notification
      const notification = await Notification.createStrategyNotification({
        userId,
        strategy,
        title,
        message
      });
      
      // Send real-time notification via WebSocket
      WebSocketNotificationController.sendDatabaseNotification(notification);
      
      // Also send strategy update via WebSocket
      WebSocketNotificationController.sendStrategyUpdate(strategy);

      // Send email if required
      if (sendEmail) {
        const user = await User.findById(userId);
        
        if (user && user.preferences?.notifications?.email !== false && 
            user.preferences?.notifications?.strategy !== false) {
          await this.sendNotificationEmail({
            user,
            title,
            message,
            strategy,
            template: emailTemplate || 'strategy-notification'
          });
        }
      }

      return notification;
    } catch (error) {
      logger.error(`Error creating strategy notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a MetaMask connection notification
   * @param {Object} options - Options for the notification
   * @returns {Promise<Notification>}
   */
  static async createMetaMaskNotification({ 
    userId, 
    connection, 
    title, 
    message,
    sendEmail = true,
    emailTemplate = null
  }) {
    try {
      // Create notification
      const notification = await Notification.createMetaMaskNotification({
        userId,
        connection,
        title,
        message
      });
      
      // Send real-time notification via WebSocket
      WebSocketNotificationController.sendDatabaseNotification(notification);
      
      // Also send MetaMask connection update via WebSocket
      WebSocketNotificationController.sendMetaMaskConnectionUpdate(connection);

      // Send email if required
      if (sendEmail) {
        const user = await User.findById(userId);
        
        if (user && user.preferences?.notifications?.email !== false && 
            user.preferences?.notifications?.security !== false) {
          await this.sendNotificationEmail({
            user,
            title,
            message,
            connection,
            template: emailTemplate || 'metamask-notification'
          });
        }
      }

      return notification;
    } catch (error) {
      logger.error(`Error creating MetaMask notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a system notification
   * @param {Object} options - Options for the notification
   * @returns {Promise<Notification>}
   */
  static async createSystemNotification({ 
    userId, 
    title, 
    message,
    data = {},
    sendEmail = true,
    emailTemplate = null
  }) {
    try {
      // Create notification
      const notification = await Notification.create({
        userId,
        title,
        message,
        type: 'system',
        data
      });
      
      // Send real-time notification via WebSocket
      WebSocketNotificationController.sendDatabaseNotification(notification);

      // Send email if required
      if (sendEmail) {
        const user = await User.findById(userId);
        
        if (user && user.preferences?.notifications?.email !== false && 
            user.preferences?.notifications?.system !== false) {
          await this.sendNotificationEmail({
            user,
            title,
            message,
            data,
            template: emailTemplate || 'system-notification'
          });
        }
      }

      return notification;
    } catch (error) {
      logger.error(`Error creating system notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification email
   * @param {Object} options - Email options
   * @returns {Promise<void>}
   */
  static async sendNotificationEmail({ 
    user, 
    title, 
    message, 
    template = 'general-notification',
    ...data
  }) {
    try {
      if (!user.email) {
        logger.warn(`Cannot send notification email: No email for user ${user._id}`);
        return;
      }

      await emailService.sendEmail({
        to: user.email,
        subject: title,
        template,
        data: {
          username: user.username || user.firstName || 'User',
          title,
          message,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          ...data
        }
      });
    } catch (error) {
      logger.error(`Error sending notification email: ${error.message}`);
      // Don't throw to prevent notification creation failure
    }
  }

  /**
   * Create a notification for multiple users
   * @param {Object} options - Options for the notification
   * @returns {Promise<Array<Notification>>}
   */
  static async createBroadcastNotification({ 
    userIds, 
    title, 
    message,
    type = 'info',
    data = {},
    sendEmail = true,
    emailTemplate = null
  }) {
    try {
      // Create notifications
      const notifications = await Notification.createMultipleNotifications(
        userIds,
        {
          title,
          message,
          type,
          data
        }
      );
      
      // Send real-time notifications via WebSocket
      notifications.forEach(notification => {
        WebSocketNotificationController.sendDatabaseNotification(notification);
      });

      // Send emails if required
      if (sendEmail) {
        const users = await User.find({ _id: { $in: userIds } });
        
        for (const user of users) {
          if (user.preferences?.notifications?.email !== false) {
            await this.sendNotificationEmail({
              user,
              title,
              message,
              data,
              template: emailTemplate || 'general-notification'
            });
          }
        }
      }

      return notifications;
    } catch (error) {
      logger.error(`Error creating broadcast notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notify users about strategy changes
   * @param {Object} strategy - Updated strategy
   * @returns {Promise<void>}
   */
  static async notifyStrategyChange(strategy) {
    try {
      // Find users who have invested in this strategy
      const Transaction = require('../models/Transaction');
      const userIds = await Transaction.distinct('userId', { 
        strategyId: strategy._id, 
        status: 'completed' 
      });

      if (userIds.length === 0) {
        logger.info(`No users to notify about strategy change: ${strategy._id}`);
        return;
      }

      // Determine notification type
      let title = `Strategy Update: ${strategy.name}`;
      let message = `The ${strategy.name} strategy has been updated.`;
      
      if (strategy.isPaused) {
        title = `Strategy Paused: ${strategy.name}`;
        message = `The ${strategy.name} strategy has been temporarily paused. Your investments are safe, but new investments are currently not accepted.`;
      } else if (!strategy.isActive) {
        title = `Strategy Deactivated: ${strategy.name}`;
        message = `The ${strategy.name} strategy is no longer active. Please consider withdrawing your funds if you have any investments in this strategy.`;
      } else if (strategy.apy && strategy.apy.previous && strategy.apy.current > strategy.apy.previous) {
        title = `APY Increase: ${strategy.name}`;
        message = `Good news! The APY for ${strategy.name} has increased from ${strategy.apy.previous}% to ${strategy.apy.current}%.`;
      } else if (strategy.apy && strategy.apy.previous && strategy.apy.current < strategy.apy.previous) {
        title = `APY Update: ${strategy.name}`;
        message = `The APY for ${strategy.name} has changed from ${strategy.apy.previous}% to ${strategy.apy.current}%.`;
      }

      // Create notification for all affected users
      await this.createBroadcastNotification({
        userIds,
        title,
        message,
        type: 'strategy',
        data: {
          strategyId: strategy._id,
          strategyName: strategy.name,
          protocol: strategy.protocol,
          asset: strategy.asset,
          apy: strategy.apy?.current,
          isPaused: strategy.isPaused,
          isActive: strategy.isActive
        },
        emailTemplate: 'strategy-update'
      });
      
      // Send strategy update via WebSocket to all subscribers
      WebSocketNotificationController.sendStrategyUpdate(strategy);
    } catch (error) {
      logger.error(`Error notifying users about strategy change: ${error.message}`);
    }
  }

  /**
   * Notify users about transaction status changes
   * @param {Object} transaction - Updated transaction
   * @returns {Promise<void>}
   */
  static async notifyTransactionStatusChange(transaction) {
    try {
      let title, message;
      
      switch (transaction.status) {
        case 'completed':
          title = transaction.type === 'deposit' 
            ? 'Investment Completed' 
            : 'Withdrawal Completed';
          message = transaction.type === 'deposit' 
            ? `Your investment of ${transaction.amount} ${transaction.asset} has been successfully processed.` 
            : `Your withdrawal of ${transaction.amount} ${transaction.asset} has been successfully processed.`;
          break;
        
        case 'failed':
          title = transaction.type === 'deposit' 
            ? 'Investment Failed' 
            : 'Withdrawal Failed';
          message = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has failed. Please check the details or contact support.`;
          break;
        
        case 'pending':
          title = transaction.type === 'deposit' 
            ? 'Investment Pending' 
            : 'Withdrawal Pending';
          message = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} is being processed.`;
          break;
        
        default:
          title = `Transaction ${transaction.status}`;
          message = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} status is now ${transaction.status}.`;
      }

      await this.createTransactionNotification({
        userId: transaction.userId,
        transaction,
        title,
        message,
        emailTemplate: `transaction-${transaction.status}`
      });
    } catch (error) {
      logger.error(`Error notifying user about transaction status change: ${error.message}`);
    }
  }

  /**
   * Notify admin about MetaMask removal request
   * @param {Object} connection - MetaMask connection with removal request
   * @returns {Promise<void>}
   */
  static async notifyAdminAboutRemovalRequest(connection) {
    try {
      // Get admin users
      const admins = await User.find({ role: 'admin' });
      
      if (admins.length === 0) {
        logger.warn('No admin users found to notify about MetaMask removal request');
        return;
      }

      const adminIds = admins.map(admin => admin._id);
      const title = 'New MetaMask Removal Request';
      const message = `User has requested to remove MetaMask connection for wallet ${connection.walletAddress.substr(0, 8)}...${connection.walletAddress.substr(-6)}. Reason: ${connection.removalRequest.reason}`;

      await this.createBroadcastNotification({
        userIds: adminIds,
        title,
        message,
        type: 'security',
        data: {
          connectionId: connection._id,
          walletAddress: connection.walletAddress,
          userId: connection.userId,
          reason: connection.removalRequest.reason,
          email: connection.removalRequest.email
        },
        emailTemplate: 'metamask-removal-request'
      });
      
      // Send real-time alert to admin users via WebSocket
      WebSocketNotificationController.sendRemovalRequestAlert(connection);
    } catch (error) {
      logger.error(`Error notifying admins about MetaMask removal request: ${error.message}`);
    }
  }

  /**
   * Notify user about MetaMask removal request status change
   * @param {Object} connection - MetaMask connection with updated removal request
   * @returns {Promise<void>}
   */
  static async notifyUserAboutRemovalRequestStatus(connection) {
    try {
      let title, message;
      
      switch (connection.removalRequest.status) {
        case 'approved':
          title = 'MetaMask Disconnection Approved';
          message = `Your request to disconnect MetaMask wallet ${connection.walletAddress.substr(0, 8)}...${connection.walletAddress.substr(-6)} has been approved.`;
          break;
        
        case 'rejected':
          title = 'MetaMask Disconnection Rejected';
          message = `Your request to disconnect MetaMask wallet ${connection.walletAddress.substr(0, 8)}...${connection.walletAddress.substr(-6)} has been rejected. Reason: ${connection.removalRequest.adminComment || 'No reason provided'}`;
          break;
        
        default:
          return; // Don't notify for other statuses
      }

      await this.createMetaMaskNotification({
        userId: connection.userId,
        connection,
        title,
        message,
        emailTemplate: 'metamask-removal-' + connection.removalRequest.status
      });
    } catch (error) {
      logger.error(`Error notifying user about MetaMask removal request status: ${error.message}`);
    }
  }
}

module.exports = NotificationService;
