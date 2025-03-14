const User = require('../models/User');
const MetaMaskConnection = require('../models/MetaMaskConnection');
const logger = require('../config/logger');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Add pagination and filtering if needed
    const users = await User.find().select('-password');

    res.status(200).json({
      status: 'success',
      count: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Admin
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Get user's MetaMask connections
    const connections = await MetaMaskConnection.find({
      userId: user._id,
      isActive: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
        connections
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Admin
 */
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          ...user.toObject(),
          password: undefined
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Remove password from update
    if (req.body.password) {
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Find all user's MetaMask connections
    const connections = await MetaMaskConnection.find({ userId: user._id });

    // If user has active connections, don't allow deletion
    const activeConnections = connections.filter(conn => conn.isActive && conn.removalRequest.status !== 'approved');
    
    if (activeConnections.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'User has active MetaMask connections. Please disconnect them first.',
        data: {
          activeConnections
        }
      });
    }

    // Soft delete the user
    user.isActive = false;
    user.deactivatedAt = Date.now();
    await user.save();

    // Alternatively, use real deletion if needed
    // await user.remove();

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    // Get user from auth middleware
    const user = await User.findById(req.user.id).select('-password');

    // Get user's active MetaMask connections
    const connections = await MetaMaskConnection.find({
      userId: user._id,
      isActive: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
        connections
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    // Fields allowed to update
    const allowedUpdates = ['username', 'email', 'firstName', 'lastName', 'avatar'];
    
    // Create a new object with only allowed fields
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update user
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
exports.updateUserPreferences = async (req, res, next) => {
  try {
    const { riskLevel, notificationPreferences, displayPreferences } = req.body;

    // Get current user
    const user = await User.findById(req.user.id);

    // Update preferences
    if (riskLevel) {
      user.preferences = user.preferences || {};
      user.preferences.riskLevel = riskLevel;
    }

    if (notificationPreferences) {
      user.preferences = user.preferences || {};
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notificationPreferences
      };
    }

    if (displayPreferences) {
      user.preferences = user.preferences || {};
      user.preferences.display = {
        ...user.preferences.display,
        ...displayPreferences
      };
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};
