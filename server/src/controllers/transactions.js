const Transaction = require('../models/Transaction');
const Strategy = require('../models/Strategy');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc    Get all transactions for the logged in user
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, status, strategy, limit = 20, page = 1 } = req.query;
    
    // Build query
    const queryObj = { userId: req.user.id };
    
    if (type) queryObj.type = type;
    if (status) queryObj.status = status;
    if (strategy) queryObj.strategyId = strategy;

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = parseInt(page) * parseInt(limit);
    const total = await Transaction.countDocuments(queryObj);

    // Execute query
    const transactions = await Transaction.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit))
      .populate({
        path: 'strategyId',
        select: 'name protocol asset chainId'
      });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
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
      count: transactions.length,
      pagination,
      total,
      data: {
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate({
      path: 'strategyId',
      select: 'name protocol asset chainId contractAddress apy.current'
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found'
      });
    }

    // Check if transaction belongs to user
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to access this transaction'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res, next) => {
  try {
    // Get fields from request body
    const { strategyId, walletAddress, type, amount, asset, txHash } = req.body;
    
    // Validate required fields
    if (!strategyId || !walletAddress || !type || !amount || !asset) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide strategyId, walletAddress, type, amount, and asset'
      });
    }

    // Check if strategy exists
    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    // Check if strategy is active and not paused
    if (!strategy.isActive || strategy.isPaused) {
      return res.status(400).json({
        status: 'fail',
        message: 'Strategy is not available at the moment'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      strategyId,
      walletAddress,
      type,
      amount,
      asset,
      status: txHash ? 'completed' : 'pending',
      txHash,
      isPending: !txHash
    });

    // If there's a txHash, record block details later via an async process
    if (txHash) {
      // In a real implementation, you would have a worker process to
      // fetch block details from the blockchain and update the transaction
      logger.info(`Transaction created with txHash: ${txHash}`);
    }

    res.status(201).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update transaction
 * @route   PUT /api/transactions/:id
 * @access  Private (Admin)
 */
exports.updateTransaction = async (req, res, next) => {
  try {
    const { status, txHash, blockHeight, blockTimestamp } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found'
      });
    }

    // Update transaction fields
    if (status) {
      await transaction.updateStatus(status);
    }

    // If txHash is provided, confirm the transaction
    if (txHash) {
      await transaction.confirm(
        txHash,
        blockHeight || null,
        blockTimestamp ? new Date(blockTimestamp) : null
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get transaction statistics
 * @route   GET /api/transactions/stats
 * @access  Private
 */
exports.getTransactionStats = async (req, res, next) => {
  try {
    // Get total transactions by type
    const transactionsByType = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get total successful transactions by strategy
    const transactionsByStrategy = await Transaction.aggregate([
      { 
        $match: { 
          userId: req.user._id,
          status: 'completed'
        } 
      },
      {
        $group: {
          _id: '$strategyId',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'strategies',
          localField: '_id',
          foreignField: '_id',
          as: 'strategy'
        }
      },
      {
        $project: {
          count: 1,
          totalAmount: 1,
          strategy: { $arrayElemAt: ['$strategy', 0] }
        }
      },
      {
        $project: {
          count: 1,
          totalAmount: 1,
          strategyName: '$strategy.name',
          strategyProtocol: '$strategy.protocol',
          strategyAsset: '$strategy.asset'
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'strategyId',
        select: 'name protocol asset'
      });

    res.status(200).json({
      status: 'success',
      data: {
        transactionsByType,
        transactionsByStrategy,
        recentTransactions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get transactions with XCM-related details
 * @route   GET /api/transactions/xcm
 * @access  Private
 */
exports.getXcmTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      xcmRelated: true
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'strategyId',
      select: 'name protocol asset chainId'
    });

    res.status(200).json({
      status: 'success',
      count: transactions.length,
      data: {
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
};
