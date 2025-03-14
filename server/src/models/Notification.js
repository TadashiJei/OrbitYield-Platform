const mongoose = require('mongoose');

/**
 * Notification schema
 * Used to store user notifications for the application
 */
const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'transaction', 'strategy', 'security', 'system'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    // Optional reference to related entities
    model: {
      type: String,
      enum: ['Transaction', 'Strategy', 'MetaMaskConnection', 'User'],
      required: false
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // By default, notifications expire in 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  data: {
    // Additional data specific to the notification type
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
});

/**
 * Create notification for a user
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Notification>} - Created notification
 */
NotificationSchema.statics.createNotification = async function(notificationData) {
  return this.create(notificationData);
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data without userId
 * @returns {Promise<Array>} - Array of created notifications
 */
NotificationSchema.statics.createMultipleNotifications = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    ...notificationData,
    userId
  }));
  
  return this.insertMany(notifications);
};

/**
 * Mark notification as read
 */
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  await this.save();
  return this;
};

/**
 * Create transaction-related notification
 * @param {Object} options - Notification options
 * @returns {Promise<Notification>} - Created notification
 */
NotificationSchema.statics.createTransactionNotification = async function({
  userId,
  transaction,
  title,
  message,
  type = 'transaction'
}) {
  return this.create({
    userId,
    title,
    message,
    type,
    relatedTo: {
      model: 'Transaction',
      id: transaction._id
    },
    data: {
      transactionType: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      asset: transaction.asset
    }
  });
};

/**
 * Create strategy-related notification
 * @param {Object} options - Notification options
 * @returns {Promise<Notification>} - Created notification
 */
NotificationSchema.statics.createStrategyNotification = async function({
  userId,
  strategy,
  title,
  message,
  type = 'strategy'
}) {
  return this.create({
    userId,
    title,
    message,
    type,
    relatedTo: {
      model: 'Strategy',
      id: strategy._id
    },
    data: {
      strategyName: strategy.name,
      protocol: strategy.protocol,
      asset: strategy.asset,
      apy: strategy.apy.current
    }
  });
};

/**
 * Create MetaMask-related notification
 * @param {Object} options - Notification options
 * @returns {Promise<Notification>} - Created notification
 */
NotificationSchema.statics.createMetaMaskNotification = async function({
  userId,
  connection,
  title,
  message,
  type = 'security'
}) {
  return this.create({
    userId,
    title,
    message,
    type,
    relatedTo: {
      model: 'MetaMaskConnection',
      id: connection._id
    },
    data: {
      walletAddress: connection.walletAddress,
      requestStatus: connection.removalRequest?.status
    }
  });
};

// Add indexes for better query performance
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Notification', NotificationSchema);
