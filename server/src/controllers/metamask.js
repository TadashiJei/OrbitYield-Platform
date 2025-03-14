const MetaMaskConnection = require('../models/MetaMaskConnection');
const User = require('../models/User');
const logger = require('../config/logger');
const { sendEmail } = require('../utils/email'); // We'll implement this later

/**
 * @desc    Save a new MetaMask connection
 * @route   POST /api/metamask
 * @access  Private
 */
exports.saveConnection = async (req, res, next) => {
  try {
    const { walletAddress, chainId, label } = req.body;
    const userId = req.user.id;

    // Check if connection already exists
    const existingConnection = await MetaMaskConnection.findOne({
      walletAddress,
      isActive: true
    });

    if (existingConnection) {
      // If connection exists for same user, just update it
      if (existingConnection.userId.toString() === userId) {
        existingConnection.lastUsed = Date.now();
        existingConnection.chainId = chainId || existingConnection.chainId;
        existingConnection.label = label || existingConnection.label;
        
        await existingConnection.save();

        return res.status(200).json({
          status: 'success',
          data: {
            connection: existingConnection
          }
        });
      }

      // If connection exists for different user, return error
      return res.status(400).json({
        status: 'fail',
        message: 'This wallet address is already connected to another account'
      });
    }

    // Create new connection
    const connection = await MetaMaskConnection.create({
      walletAddress,
      userId,
      chainId: chainId || '1',
      label: label || 'My Wallet'
    });

    res.status(201).json({
      status: 'success',
      data: {
        connection
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all connections for a user
 * @route   GET /api/metamask
 * @access  Private
 */
exports.getConnections = async (req, res, next) => {
  try {
    const connections = await MetaMaskConnection.find({
      userId: req.user.id,
      isActive: true
    });

    res.status(200).json({
      status: 'success',
      count: connections.length,
      data: {
        connections
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a MetaMask connection
 * @route   PUT /api/metamask/:id
 * @access  Private
 */
exports.updateConnection = async (req, res, next) => {
  try {
    const { label } = req.body;
    
    let connection = await MetaMaskConnection.findById(req.params.id);

    // Check if connection exists
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found'
      });
    }

    // Check if connection belongs to user
    if (connection.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to update this connection'
      });
    }

    // Update connection
    connection.label = label || connection.label;
    connection.lastUsed = Date.now();
    await connection.save();

    res.status(200).json({
      status: 'success',
      data: {
        connection
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Request removal of a MetaMask connection
 * @route   POST /api/metamask/removal-request
 * @access  Private
 */
exports.requestRemoval = async (req, res, next) => {
  try {
    const { walletAddress, reason, email } = req.body;
    
    // Validate required fields
    if (!walletAddress || !email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Wallet address and email are required'
      });
    }

    // Find the connection
    const connection = await MetaMaskConnection.findOne({
      walletAddress,
      isActive: true
    });

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Active connection not found for this wallet address'
      });
    }

    // Check if there's already a pending removal request
    if (connection.removalRequest.status === 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'A removal request is already pending for this wallet'
      });
    }

    // Create removal request
    await connection.requestRemoval(reason, email);

    // Notify admin via email
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New MetaMask Disconnection Request',
        template: 'metamask-removal-admin',
        data: {
          walletAddress,
          email,
          reason,
          date: new Date().toISOString(),
          adminUrl: `${process.env.FRONTEND_URL}/admin/metamask`
        }
      });
    } catch (emailErr) {
      logger.error(`Failed to send admin notification email: ${emailErr.message}`);
    }

    // Notify user via email
    try {
      await sendEmail({
        to: email,
        subject: 'MetaMask Disconnection Request Received',
        template: 'metamask-removal-user',
        data: {
          walletAddress,
          date: new Date().toISOString()
        }
      });
    } catch (emailErr) {
      logger.error(`Failed to send user notification email: ${emailErr.message}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Removal request submitted successfully',
      data: {
        connection
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get status of a removal request
 * @route   GET /api/metamask/removal-request/:walletAddress
 * @access  Public
 */
exports.getRemovalStatus = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    
    // Find the connection
    const connection = await MetaMaskConnection.findOne({
      walletAddress
    });

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'No connection found for this wallet address'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        walletAddress,
        removalStatus: connection.removalRequest.status,
        isActive: connection.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};
