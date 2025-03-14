const MetaMaskConnection = require('../models/MetaMaskConnection');
const User = require('../models/User');
const logger = require('../config/logger');
const { sendEmail } = require('../utils/email');

/**
 * @desc    Get all MetaMask removal requests
 * @route   GET /api/admin/metamask
 * @access  Admin
 */
exports.getRemovalRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    // Build query
    const query = {
      'removalRequest.status': status || 'pending'
    };
    
    // Get removal requests
    const removalRequests = await MetaMaskConnection.find(query)
      .sort({ 'removalRequest.requestedAt': -1 })
      .populate({
        path: 'userId',
        select: 'email username'
      });

    res.status(200).json({
      status: 'success',
      count: removalRequests.length,
      data: {
        removalRequests
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get removal request counts by status
 * @route   GET /api/admin/metamask/counts
 * @access  Admin
 */
exports.getRemovalRequestCounts = async (req, res, next) => {
  try {
    const counts = await MetaMaskConnection.aggregate([
      {
        $group: {
          _id: '$removalRequest.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array to object
    const countsObj = counts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.status(200).json({
      status: 'success',
      data: {
        counts: countsObj
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Approve a removal request
 * @route   PUT /api/admin/metamask/:id/approve
 * @access  Admin
 */
exports.approveRemovalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    // Find the connection
    const connection = await MetaMaskConnection.findById(id);

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found'
      });
    }

    // Check if there's a pending removal request
    if (connection.removalRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'No pending removal request for this connection'
      });
    }

    // Approve removal request
    await connection.approveRemovalRequest(adminNotes);

    // Send email notification to user
    try {
      await sendEmail({
        to: connection.removalRequest.email,
        subject: 'MetaMask Disconnection Request Approved',
        template: 'metamask-removal-approved',
        data: {
          walletAddress: connection.walletAddress,
          approvedAt: connection.removalRequest.approvedAt,
          adminNotes: adminNotes || 'No notes provided'
        }
      });
    } catch (emailErr) {
      logger.error(`Failed to send approval notification email: ${emailErr.message}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Removal request approved successfully',
      data: {
        connection
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reject a removal request
 * @route   PUT /api/admin/metamask/:id/reject
 * @access  Admin
 */
exports.rejectRemovalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    // Find the connection
    const connection = await MetaMaskConnection.findById(id);

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found'
      });
    }

    // Check if there's a pending removal request
    if (connection.removalRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'No pending removal request for this connection'
      });
    }

    // Reject removal request
    await connection.rejectRemovalRequest(adminNotes);

    // Send email notification to user
    try {
      await sendEmail({
        to: connection.removalRequest.email,
        subject: 'MetaMask Disconnection Request Rejected',
        template: 'metamask-removal-rejected',
        data: {
          walletAddress: connection.walletAddress,
          rejectedAt: connection.removalRequest.rejectedAt,
          adminNotes: adminNotes || 'No notes provided'
        }
      });
    } catch (emailErr) {
      logger.error(`Failed to send rejection notification email: ${emailErr.message}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Removal request rejected successfully',
      data: {
        connection
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get MetaMask connection details
 * @route   GET /api/admin/metamask/:id
 * @access  Admin
 */
exports.getConnectionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the connection with user details
    const connection = await MetaMaskConnection.findById(id).populate({
      path: 'userId',
      select: 'email username'
    });

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found'
      });
    }

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
