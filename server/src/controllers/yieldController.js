const mongoose = require('mongoose');
const logger = require('../config/logger');
const yieldDataService = require('../services/YieldDataService');
const Protocol = require('../models/Protocol');
const YieldOpportunity = require('../models/YieldOpportunity');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const authService = require('../services/authService');

/**
 * Get all active protocols
 */
exports.getAllProtocols = catchAsync(async (req, res, next) => {
  const protocols = await yieldDataService.getAllProtocols();
  
  res.status(200).json({
    status: 'success',
    results: protocols.length,
    data: {
      protocols
    }
  });
});

/**
 * Get protocols by chain
 */
exports.getProtocolsByChain = catchAsync(async (req, res, next) => {
  const { chainId } = req.params;
  const protocols = await yieldDataService.getProtocolsByChain(chainId);
  
  res.status(200).json({
    status: 'success',
    results: protocols.length,
    data: {
      protocols
    }
  });
});

/**
 * Get protocols by category
 */
exports.getProtocolsByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const protocols = await yieldDataService.getProtocolsByCategory(category);
  
  res.status(200).json({
    status: 'success',
    results: protocols.length,
    data: {
      protocols
    }
  });
});

/**
 * Get protocols by risk level
 */
exports.getProtocolsByRiskLevel = catchAsync(async (req, res, next) => {
  const { riskLevel } = req.params;
  const protocols = await yieldDataService.getProtocolsByRiskLevel(riskLevel);
  
  res.status(200).json({
    status: 'success',
    results: protocols.length,
    data: {
      protocols
    }
  });
});

/**
 * Get all yield opportunities
 */
exports.getAllYieldOpportunities = catchAsync(async (req, res, next) => {
  const opportunities = await yieldDataService.getAllYieldOpportunities();
  
  res.status(200).json({
    status: 'success',
    results: opportunities.length,
    data: {
      opportunities
    }
  });
});

/**
 * Get yield opportunities by chain
 */
exports.getYieldOpportunitiesByChain = catchAsync(async (req, res, next) => {
  const { chainId } = req.params;
  const opportunities = await yieldDataService.getYieldOpportunitiesByChain(chainId);
  
  res.status(200).json({
    status: 'success',
    results: opportunities.length,
    data: {
      opportunities
    }
  });
});

/**
 * Get yield opportunities by asset
 */
exports.getYieldOpportunitiesByAsset = catchAsync(async (req, res, next) => {
  const { asset } = req.params;
  const opportunities = await yieldDataService.getYieldOpportunitiesByAsset(asset);
  
  res.status(200).json({
    status: 'success',
    results: opportunities.length,
    data: {
      opportunities
    }
  });
});

/**
 * Get yield opportunities by risk level
 */
exports.getYieldOpportunitiesByRiskLevel = catchAsync(async (req, res, next) => {
  const { riskLevel } = req.params;
  const opportunities = await yieldDataService.getYieldOpportunitiesByRiskLevel(riskLevel);
  
  res.status(200).json({
    status: 'success',
    results: opportunities.length,
    data: {
      opportunities
    }
  });
});

/**
 * Get top yield opportunities
 */
exports.getTopYieldOpportunities = catchAsync(async (req, res, next) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const opportunities = await yieldDataService.getTopYieldOpportunities(limit);
  
  res.status(200).json({
    status: 'success',
    results: opportunities.length,
    data: {
      opportunities
    }
  });
});

/**
 * Get yield opportunity by ID
 */
exports.getYieldOpportunityById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const opportunity = await yieldDataService.getYieldOpportunityById(id);
  
  if (!opportunity) {
    return next(new AppError('No yield opportunity found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      opportunity
    }
  });
});

/**
 * Get user investments
 */
exports.getUserInvestments = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const investments = await Investment.find({ user: userId })
    .populate({
      path: 'opportunity',
      select: 'name asset apy tvlUsd chainId',
      populate: {
        path: 'protocol',
        select: 'name logo website'
      }
    })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: investments.length,
    data: {
      investments
    }
  });
});

/**
 * Get investment by ID
 */
exports.getInvestmentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const investment = await Investment.findOne({ _id: id, user: userId })
    .populate({
      path: 'opportunity',
      select: 'name asset apy tvlUsd chainId',
      populate: {
        path: 'protocol',
        select: 'name logo website'
      }
    });
  
  if (!investment) {
    return next(new AppError('No investment found with that ID', 404));
  }
  
  // Get related transactions
  const transactions = await Transaction.findByInvestment(id);
  
  res.status(200).json({
    status: 'success',
    data: {
      investment,
      transactions
    }
  });
});

/**
 * Create new investment
 */
exports.createInvestment = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { opportunityId, walletAddress, amount, amountUsd, chainId } = req.body;
  
  // Validate opportunity
  const opportunity = await YieldOpportunity.findById(opportunityId);
  if (!opportunity) {
    return next(new AppError('No yield opportunity found with that ID', 404));
  }
  
  // Validate protocol
  const protocol = await Protocol.findById(opportunity.protocol);
  if (!protocol) {
    return next(new AppError('Protocol not found for the opportunity', 404));
  }
  
  // Create investment
  const investment = await Investment.create({
    user: userId,
    opportunity: opportunityId,
    protocol: opportunity.protocol,
    walletAddress,
    amount,
    amountUsd,
    chainId: chainId || opportunity.chainId,
    entryApy: opportunity.apy.current,
    asset: opportunity.asset,
    status: 'pending'
  });
  
  // Create transaction record
  await Transaction.create({
    userId,
    investmentId: investment._id,
    opportunityId,
    protocolId: opportunity.protocol,
    walletAddress,
    type: 'deposit',
    amount,
    amountUsd,
    asset: opportunity.asset,
    chainId: chainId || opportunity.chainId,
    status: 'pending',
    isPending: true,
    apy: opportunity.apy.current
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      investment
    }
  });
});

/**
 * Update investment
 */
exports.updateInvestment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;
  
  // Find investment and ensure it belongs to the user
  const investment = await Investment.findOne({ _id: id, user: userId });
  
  if (!investment) {
    return next(new AppError('No investment found with that ID', 404));
  }
  
  // Restrict fields that can be updated
  const allowedFields = ['autoHarvest', 'autoCompound', 'notes', 'status'];
  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});
  
  const updatedInvestment = await Investment.findByIdAndUpdate(id, filteredData, {
    new: true,
    runValidators: true
  }).populate({
    path: 'opportunity',
    select: 'name asset apy tvlUsd chainId',
    populate: {
      path: 'protocol',
      select: 'name logo website'
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      investment: updatedInvestment
    }
  });
});

/**
 * Withdraw from investment
 */
exports.withdrawFromInvestment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { amount, amountUsd, withdrawAll } = req.body;
  
  // Find investment and ensure it belongs to the user
  const investment = await Investment.findOne({ _id: id, user: userId })
    .populate('opportunity')
    .populate('protocol');
  
  if (!investment) {
    return next(new AppError('No investment found with that ID', 404));
  }
  
  if (investment.status !== 'active') {
    return next(new AppError('Cannot withdraw from a non-active investment', 400));
  }
  
  let withdrawAmount = amount;
  let withdrawAmountUsd = amountUsd;
  
  // If withdrawing all, use the current balance
  if (withdrawAll) {
    withdrawAmount = investment.currentBalance;
    withdrawAmountUsd = investment.currentBalanceUsd;
  } else if (!withdrawAmount) {
    return next(new AppError('Please specify an amount to withdraw', 400));
  }
  
  // Validate withdraw amount
  if (withdrawAmount > investment.currentBalance) {
    return next(new AppError('Withdraw amount exceeds available balance', 400));
  }
  
  // Create transaction record for the withdrawal
  const transaction = await Transaction.create({
    userId,
    investmentId: investment._id,
    opportunityId: investment.opportunity._id,
    protocolId: investment.protocol._id,
    walletAddress: investment.walletAddress,
    type: 'withdrawal',
    amount: withdrawAmount,
    amountUsd: withdrawAmountUsd,
    asset: investment.asset,
    chainId: investment.chainId,
    status: 'pending',
    isPending: true,
    apy: investment.currentApy
  });
  
  // If withdrawing all, set investment status to 'closing'
  let updatedInvestment = investment;
  if (withdrawAll) {
    updatedInvestment = await Investment.findByIdAndUpdate(id, {
      status: 'closing',
      lastWithdrawalAmount: withdrawAmount,
      lastWithdrawalTimestamp: Date.now()
    }, {
      new: true,
      runValidators: true
    });
  } else {
    // Update the investment with withdrawal info
    updatedInvestment = await Investment.findByIdAndUpdate(id, {
      currentBalance: investment.currentBalance - withdrawAmount,
      currentBalanceUsd: investment.currentBalanceUsd - withdrawAmountUsd,
      lastWithdrawalAmount: withdrawAmount,
      lastWithdrawalTimestamp: Date.now()
    }, {
      new: true,
      runValidators: true
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      investment: updatedInvestment,
      transaction
    }
  });
});

/**
 * Get user yield statistics
 */
exports.getUserYieldStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get yield statistics from transactions
  const yieldStats = await Transaction.getYieldStats(userId);
  
  // Get active investments count and total value
  const investments = await Investment.find({ user: userId, status: 'active' });
  const totalInvested = investments.reduce((total, inv) => total + inv.currentBalanceUsd, 0);
  const totalInvestedOriginal = investments.reduce((total, inv) => total + inv.amountUsd, 0);
  
  // Calculate profit/loss
  const profitLoss = totalInvested - totalInvestedOriginal + yieldStats.totalYieldUsd;
  const profitLossPercentage = totalInvestedOriginal > 0 
    ? (profitLoss / totalInvestedOriginal) * 100 
    : 0;
  
  // Get protocol breakdown
  const protocolIds = [...new Set(investments.map(inv => inv.protocol.toString()))];
  const protocols = await Protocol.find({ _id: { $in: protocolIds } });
  
  const protocolBreakdown = protocols.map(protocol => {
    const protocolInvestments = investments.filter(inv => inv.protocol.toString() === protocol._id.toString());
    const totalValue = protocolInvestments.reduce((total, inv) => total + inv.currentBalanceUsd, 0);
    const percentage = totalInvested > 0 ? (totalValue / totalInvested) * 100 : 0;
    
    return {
      protocolId: protocol._id,
      name: protocol.name,
      logo: protocol.logo,
      totalValue,
      percentage
    };
  }).sort((a, b) => b.totalValue - a.totalValue);
  
  // Get asset breakdown
  const assetBreakdown = {};
  investments.forEach(inv => {
    const asset = inv.asset;
    if (!assetBreakdown[asset]) {
      assetBreakdown[asset] = {
        asset,
        totalValue: 0,
        percentage: 0
      };
    }
    assetBreakdown[asset].totalValue += inv.currentBalanceUsd;
  });
  
  // Calculate percentages for assets
  Object.values(assetBreakdown).forEach(item => {
    item.percentage = totalInvested > 0 ? (item.totalValue / totalInvested) * 100 : 0;
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      yieldStats,
      investmentStats: {
        activeInvestments: investments.length,
        totalInvested,
        totalInvestedOriginal,
        profitLoss,
        profitLossPercentage
      },
      breakdowns: {
        protocol: protocolBreakdown,
        asset: Object.values(assetBreakdown).sort((a, b) => b.totalValue - a.totalValue)
      }
    }
  });
});

/**
 * Update transaction status (admin only)
 */
exports.updateTransactionStatus = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user.role || req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  const { id } = req.params;
  const { status, txHash, blockHeight, blockTimestamp, gasDetails, error } = req.body;
  
  const transaction = await Transaction.findById(id);
  
  if (!transaction) {
    return next(new AppError('No transaction found with that ID', 404));
  }
  
  // Update transaction status
  await transaction.updateStatus(status, error);
  
  // Add confirmation details if provided
  if (status === 'completed' && txHash) {
    await transaction.confirm(
      txHash, 
      blockHeight || null, 
      blockTimestamp ? new Date(blockTimestamp) : null
    );
  }
  
  // Add gas details if provided
  if (gasDetails) {
    await transaction.addGasDetails(gasDetails);
  }
  
  // If this is an investment transaction, update the investment accordingly
  if (transaction.investmentId) {
    const investment = await Investment.findById(transaction.investmentId);
    
    if (investment) {
      if (transaction.type === 'deposit' && status === 'completed') {
        // Update investment status to active
        await Investment.findByIdAndUpdate(investment._id, {
          status: 'active',
          lastUpdateTimestamp: Date.now()
        });
      } else if (transaction.type === 'withdrawal' && status === 'completed') {
        // If the investment status is 'closing', set it to 'closed'
        if (investment.status === 'closing') {
          await Investment.findByIdAndUpdate(investment._id, {
            status: 'closed',
            lastUpdateTimestamp: Date.now()
          });
        }
      }
    }
  }
  
  // Get updated transaction
  const updatedTransaction = await Transaction.findById(id);
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction: updatedTransaction
    }
  });
});

/**
 * Sync protocol opportunities (admin only)
 */
exports.syncProtocolOpportunities = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user.role || req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  const { protocolId } = req.params;
  
  const results = await yieldDataService.syncProtocolOpportunities(protocolId);
  
  res.status(200).json({
    status: 'success',
    data: results
  });
});

/**
 * Update all APY (admin only)
 */
exports.updateAllApy = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user.role || req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  const results = await yieldDataService.updateAllApy();
  
  res.status(200).json({
    status: 'success',
    data: results
  });
});

/**
 * Update protocol APY (admin only)
 */
exports.updateProtocolApy = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user.role || req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  const { protocolId } = req.params;
  
  const results = await yieldDataService.updateProtocolApy(protocolId);
  
  res.status(200).json({
    status: 'success',
    data: results
  });
});

/**
 * Update all TVL (admin only)
 */
exports.updateAllTvl = catchAsync(async (req, res, next) => {
  // Check if user is admin
  if (!req.user.role || req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  const results = await yieldDataService.updateAllTvl();
  
  res.status(200).json({
    status: 'success',
    data: results
  });
});

/**
 * Process auto-harvests (admin or system only)
 */
exports.processAutoHarvests = catchAsync(async (req, res, next) => {
  // Check if user is admin or this is a system call
  const isSystemCall = req.headers['x-api-key'] === process.env.SYSTEM_API_KEY;
  
  if (!isSystemCall && (!req.user.role || req.user.role !== 'admin')) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  const results = await yieldDataService.processAutoHarvests();
  
  res.status(200).json({
    status: 'success',
    data: results
  });
});
