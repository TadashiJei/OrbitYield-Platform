const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isRead, type, limit = 20, page = 1 } = req.query;
    
    // Build query
    const queryObj = { userId };
    
    if (isRead !== undefined) {
      queryObj.isRead = isRead === 'true';
    }
    
    if (type) {
      queryObj.type = type;
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await Notification.countDocuments(queryObj);

    // Execute query
    const notifications = await Notification.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit));

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    // Pagination result
    const pagination = {};

    if (startIndex + parseInt(limit) < total) {
      pagination.next = {
        page: parseInt(page) + 1,
        limit: parseInt(limit)
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: parseInt(page) - 1,
        limit: parseInt(limit)
      };
    }

    res.status(200).json({
      status: 'success',
      count: notifications.length,
      unreadCount,
      pagination,
      total,
      data: {
        notifications
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to access this notification'
      });
    }

    // Mark as read
    await notification.markAsRead();

    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        markedCount: result.nModified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to access this notification'
      });
    }

    // Delete notification
    await notification.remove();

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user
    const user = await User.findById(userId);

    // Get notification preferences
    const preferences = user.preferences?.notifications || {
      email: true,
      push: true,
      transaction: true,
      strategy: true,
      security: true,
      system: true
    };

    res.status(200).json({
      status: 'success',
      data: {
        preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    // Get user
    const user = await User.findById(userId);

    // Update notification preferences
    user.preferences = user.preferences || {};
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...preferences
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        preferences: user.preferences.notifications
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create notification (admin only)
 * @route   POST /api/notifications
 * @access  Admin
 */
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, data } = req.body;
    
    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide userId, title, and message'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Create notification
    const notification = await Notification.createNotification({
      userId,
      title,
      message,
      type: type || 'info',
      data
    });

    res.status(201).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create notification for multiple users (admin only)
 * @route   POST /api/notifications/broadcast
 * @access  Admin
 */
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { userIds, title, message, type, data } = req.body;
    
    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide userIds array, title, and message'
      });
    }

    // Create notification for each user
    const notifications = await Notification.createMultipleNotifications(
      userIds,
      {
        title,
        message,
        type: type || 'info',
        data
      }
    );

    res.status(201).json({
      status: 'success',
      count: notifications.length,
      data: {
        notifications
      }
    });
  } catch (err) {
    next(err);
  }
};
