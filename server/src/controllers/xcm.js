const Transaction = require('../models/Transaction');
const logger = require('../config/logger');

/**
 * @desc    Submit a cross-chain transaction
 * @route   POST /api/xcm/transactions
 * @access  Private
 */
exports.submitXcmTransaction = async (req, res, next) => {
  try {
    const { 
      sourceChain, 
      destinationChain, 
      asset, 
      amount, 
      walletAddress,
      xcmMessage,
      strategyId
    } = req.body;

    // Validate required fields
    if (!sourceChain || !destinationChain || !asset || !amount || !walletAddress) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all required XCM transaction details'
      });
    }

    // Create XCM transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      strategyId: strategyId || null,
      walletAddress,
      type: 'xcm_transfer',
      amount,
      asset,
      status: 'pending',
      isPending: true,
      xcmRelated: true,
      xcmDetails: {
        sourceChain,
        destinationChain,
        message: xcmMessage || '',
        isIncoming: false
      }
    });

    // In a production scenario, this would trigger a process to monitor the XCM transaction

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
 * @desc    Update XCM transaction status
 * @route   PUT /api/xcm/transactions/:id
 * @access  Private (Admin)
 */
exports.updateXcmTransactionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, txHash, blockHeight, errorMessage } = req.body;
    
    // Find the transaction
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found'
      });
    }

    // Check if transaction is XCM related
    if (!transaction.xcmRelated) {
      return res.status(400).json({
        status: 'fail',
        message: 'Not an XCM transaction'
      });
    }

    // Update transaction fields
    if (status) {
      transaction.status = status;
      transaction.isPending = status === 'pending';
      
      if (status === 'failed' && errorMessage) {
        transaction.failureReason = errorMessage;
      }
    }

    // If txHash is provided
    if (txHash) {
      transaction.txHash = txHash;
      
      // If block details are provided
      if (blockHeight) {
        transaction.blockDetails = {
          ...transaction.blockDetails,
          height: blockHeight,
          timestamp: Date.now()
        };
      }
    }

    await transaction.save();

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
 * @desc    Get all XCM transactions for the logged in user
 * @route   GET /api/xcm/transactions
 * @access  Private
 */
exports.getXcmTransactions = async (req, res, next) => {
  try {
    const { sourceChain, destinationChain, status, limit = 20, page = 1 } = req.query;
    
    // Build query
    const queryObj = { 
      userId: req.user.id,
      xcmRelated: true
    };
    
    if (status) queryObj.status = status;
    if (sourceChain) queryObj['xcmDetails.sourceChain'] = sourceChain;
    if (destinationChain) queryObj['xcmDetails.destinationChain'] = destinationChain;

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
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
 * @desc    Get XCM transaction by ID
 * @route   GET /api/xcm/transactions/:id
 * @access  Private
 */
exports.getXcmTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate({
      path: 'strategyId',
      select: 'name protocol asset chainId'
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found'
      });
    }

    // Check if transaction belongs to user or user is admin
    if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to access this transaction'
      });
    }

    // Check if transaction is XCM related
    if (!transaction.xcmRelated) {
      return res.status(400).json({
        status: 'fail',
        message: 'Not an XCM transaction'
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
 * @desc    Get XCM chain support information
 * @route   GET /api/xcm/supported-chains
 * @access  Public
 */
exports.getSupportedChains = async (req, res, next) => {
  try {
    // This would typically come from a database
    // Hardcoded for demonstration
    const supportedChains = [
      {
        id: 'polkadot',
        name: 'Polkadot',
        description: 'The Polkadot Relay Chain',
        icon: 'polkadot.svg',
        isRelay: true
      },
      {
        id: 'kusama',
        name: 'Kusama',
        description: 'Polkadot\'s canary network',
        icon: 'kusama.svg',
        isRelay: true
      },
      {
        id: 'acala',
        name: 'Acala',
        description: 'DeFi hub of Polkadot',
        icon: 'acala.svg',
        isRelay: false,
        relayChain: 'polkadot',
        parachainId: 2000
      },
      {
        id: 'moonbeam',
        name: 'Moonbeam',
        description: 'Ethereum-compatible smart contract parachain on Polkadot',
        icon: 'moonbeam.svg',
        isRelay: false,
        relayChain: 'polkadot',
        parachainId: 2004
      },
      {
        id: 'astar',
        name: 'Astar',
        description: 'dApp hub supporting EVM and WASM contracts on Polkadot',
        icon: 'astar.svg',
        isRelay: false,
        relayChain: 'polkadot',
        parachainId: 2006
      },
      {
        id: 'karura',
        name: 'Karura',
        description: 'DeFi hub of Kusama',
        icon: 'karura.svg',
        isRelay: false,
        relayChain: 'kusama',
        parachainId: 2000
      },
      {
        id: 'moonriver',
        name: 'Moonriver',
        description: 'Ethereum-compatible smart contract parachain on Kusama',
        icon: 'moonriver.svg',
        isRelay: false,
        relayChain: 'kusama',
        parachainId: 2023
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        supportedChains
      }
    });
  } catch (err) {
    next(err);
  }
};
