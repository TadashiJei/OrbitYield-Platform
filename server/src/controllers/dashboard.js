const Transaction = require('../models/Transaction');
const Strategy = require('../models/Strategy');
const User = require('../models/User');
const MetaMaskConnection = require('../models/MetaMaskConnection');
const logger = require('../config/logger');

/**
 * @desc    Get user dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get active strategies count
    const activeStrategiesCount = await Strategy.countDocuments({ 
      isActive: true,
      isPaused: false
    });

    // Get user's active wallet connections
    const walletConnections = await MetaMaskConnection.find({
      userId,
      isActive: true
    }).select('walletAddress chainId label lastUsed');

    // Get user's recent transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'strategyId',
        select: 'name protocol asset chainId apy.current'
      });

    // Get user's investment stats
    const investmentStats = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: 'deposit', status: 'completed' } },
      {
        $group: {
          _id: '$asset',
          totalInvested: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get most profitable strategies
    const profitableStrategies = await Strategy.find({ isActive: true })
      .sort({ 'apy.current': -1 })
      .limit(3);

    // Get user's risk profile
    const user = await User.findById(userId).select('preferences.riskLevel');
    const userRiskLevel = user.preferences?.riskLevel || 'medium';

    // Get risk-appropriate strategies
    let riskQuery = {};
    if (userRiskLevel === 'low') {
      riskQuery = { riskLevel: 'low' };
    } else if (userRiskLevel === 'medium') {
      riskQuery = { riskLevel: { $in: ['low', 'medium'] } };
    }
    
    const recommendedStrategies = await Strategy.find({
      ...riskQuery,
      isActive: true,
      isPaused: false
    })
    .sort({ 'apy.current': -1 })
    .limit(3);

    // Construct dashboard data
    const dashboardData = {
      overview: {
        activeStrategiesCount,
        walletConnectionsCount: walletConnections.length,
        userRiskLevel,
        activeInvestmentsCount: investmentStats.reduce((acc, stat) => acc + stat.count, 0)
      },
      walletConnections,
      recentTransactions,
      investmentStats,
      topStrategies: profitableStrategies.map(strategy => ({
        id: strategy._id,
        name: strategy.name,
        protocol: strategy.protocol,
        asset: strategy.asset,
        chainId: strategy.chainId,
        apy: strategy.apy.current,
        riskLevel: strategy.riskLevel
      })),
      recommendedStrategies: recommendedStrategies.map(strategy => ({
        id: strategy._id,
        name: strategy.name,
        protocol: strategy.protocol,
        asset: strategy.asset,
        chainId: strategy.chainId,
        apy: strategy.apy.current,
        riskLevel: strategy.riskLevel
      }))
    };

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get admin dashboard data
 * @route   GET /api/dashboard/admin
 * @access  Admin
 */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Get user stats
    const userCount = await User.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Get strategy stats
    const strategyCount = await Strategy.countDocuments();
    const activeStrategyCount = await Strategy.countDocuments({ isActive: true, isPaused: false });
    const pausedStrategyCount = await Strategy.countDocuments({ isActive: true, isPaused: true });

    // Get transaction stats
    const transactionCount = await Transaction.countDocuments();
    const pendingTransactionCount = await Transaction.countDocuments({ status: 'pending' });
    const completedTransactionCount = await Transaction.countDocuments({ status: 'completed' });
    const failedTransactionCount = await Transaction.countDocuments({ status: 'failed' });

    // Get transaction volume
    const transactionVolume = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$asset',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get pending MetaMask removal requests
    const pendingRemovalRequests = await MetaMaskConnection.countDocuments({
      'removalRequest.status': 'pending'
    });

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: 'userId',
        select: 'username email'
      })
      .populate({
        path: 'strategyId',
        select: 'name protocol asset chainId'
      });

    // Get top strategies by user adoption
    const topStrategiesByUsage = await Transaction.aggregate([
      { $match: { status: 'completed', type: 'deposit' } },
      {
        $group: {
          _id: '$strategyId',
          userCount: { $addToSet: '$userId' },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          strategyId: '$_id',
          userCount: { $size: '$userCount' },
          totalAmount: 1
        }
      },
      { $sort: { userCount: -1 } },
      { $limit: 5 }
    ]);

    // Get strategy details for top strategies
    const strategyIds = topStrategiesByUsage.map(item => item._id);
    const topStrategies = await Strategy.find({ _id: { $in: strategyIds } });

    // Enrich top strategies data
    const enrichedTopStrategies = topStrategiesByUsage.map(item => {
      const strategyDetails = topStrategies.find(s => s._id.toString() === item._id.toString());
      return {
        id: item._id,
        name: strategyDetails ? strategyDetails.name : 'Unknown Strategy',
        protocol: strategyDetails ? strategyDetails.protocol : 'Unknown',
        asset: strategyDetails ? strategyDetails.asset : 'Unknown',
        userCount: item.userCount,
        totalAmount: item.totalAmount
      };
    });

    // Construct admin dashboard data
    const adminDashboardData = {
      userStats: {
        total: userCount,
        newToday: newUsersToday
      },
      strategyStats: {
        total: strategyCount,
        active: activeStrategyCount,
        paused: pausedStrategyCount
      },
      transactionStats: {
        total: transactionCount,
        pending: pendingTransactionCount,
        completed: completedTransactionCount,
        failed: failedTransactionCount
      },
      transactionVolume,
      pendingMetaMaskRemovals: pendingRemovalRequests,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        asset: tx.asset,
        userId: tx.userId ? tx.userId._id : null,
        username: tx.userId ? tx.userId.username : 'Unknown',
        strategy: tx.strategyId ? tx.strategyId.name : 'None',
        date: tx.createdAt
      })),
      topStrategies: enrichedTopStrategies
    };

    res.status(200).json({
      status: 'success',
      data: adminDashboardData
    });
  } catch (err) {
    next(err);
  }
};
