const mongoose = require('mongoose');

/**
 * Rebalancing Operation Schema
 * Tracks the execution of rebalancing operations
 */
const RebalancingOperationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  strategy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RebalancingStrategy',
    required: [true, 'Strategy ID is required']
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  },
  status: {
    type: String,
    enum: ['pending', 'simulating', 'waitingApproval', 'executing', 'completed', 'failed', 'cancelled', 'partial'],
    default: 'pending'
  },
  initiatedBy: {
    type: String,
    enum: ['system', 'user', 'api'],
    default: 'system'
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  // Current allocation before rebalancing
  currentAllocation: [{
    type: {
      type: String,
      enum: ['asset', 'protocol', 'chain']
    },
    id: String,
    name: String,
    percentage: Number,
    amountUsd: Number
  }],
  // Target allocation after rebalancing
  targetAllocation: [{
    type: {
      type: String,
      enum: ['asset', 'protocol', 'chain']
    },
    id: String,
    name: String,
    percentage: Number,
    amountUsd: Number
  }],
  // Actual allocation achieved after rebalancing
  achievedAllocation: [{
    type: {
      type: String,
      enum: ['asset', 'protocol', 'chain']
    },
    id: String,
    name: String,
    percentage: Number,
    amountUsd: Number
  }],
  // Transactions needed for the rebalance
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'swap', 'transfer', 'lend', 'borrow', 'repay']
    },
    status: {
      type: String,
      enum: ['pending', 'executing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    fromAsset: String,
    fromAssetAddress: String,
    toAsset: String,
    toAssetAddress: String,
    fromAmount: String, // Using string to handle large numbers
    toAmount: String,
    fromAmountUsd: Number,
    toAmountUsd: Number,
    fromProtocol: String,
    toProtocol: String,
    fromChain: String,
    toChain: String,
    txHash: String,
    error: {
      code: String,
      message: String,
      details: mongoose.Schema.Types.Mixed
    },
    executedAt: Date,
    gas: {
      gasUsed: String,
      gasPrice: String,
      gasCost: Number,
      gasCostUsd: Number
    },
    route: {
      steps: [{
        dex: String,
        fromAsset: String,
        toAsset: String,
        percentage: Number
      }]
    },
    slippage: {
      expected: Number,
      actual: Number
    }
  }],
  // Simulation results if performed
  simulation: {
    performed: {
      type: Boolean,
      default: false
    },
    result: {
      type: String,
      enum: ['success', 'partial', 'failed']
    },
    expectedGasCost: Number,
    expectedGasCostUsd: Number,
    expectedSlippage: Number,
    estimatedDuration: Number, // in seconds
    warnings: [String],
    errors: [String],
    details: mongoose.Schema.Types.Mixed
  },
  // Performance metrics
  performance: {
    portfolioValueBefore: Number,
    portfolioValueAfter: Number,
    totalGasCost: Number,
    totalGasCostUsd: Number,
    totalSlippage: Number,
    executionTime: Number, // in seconds
    successRate: Number, // percentage of successful transactions
    estimatedSavings: Number, // estimated USD saved by optimizations
    optimizationDetails: mongoose.Schema.Types.Mixed
  },
  // Error details if the operation failed
  error: {
    code: String,
    message: String,
    transactionIndex: Number,
    details: mongoose.Schema.Types.Mixed
  },
  // Manual override information
  manualOverride: {
    overridden: {
      type: Boolean,
      default: false
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    overriddenAt: Date,
    reason: String,
    originalPlan: mongoose.Schema.Types.Mixed
  },
  // Approval information if manual approval required
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  notificationsSent: [{
    type: {
      type: String,
      enum: ['started', 'completed', 'failed', 'waitingApproval']
    },
    timestamp: Date,
    channels: [String]
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for querying operations by user
RebalancingOperationSchema.index({ user: 1, createdAt: -1 });

// Index for querying operations by strategy
RebalancingOperationSchema.index({ strategy: 1, createdAt: -1 });

// Index for querying operations by status
RebalancingOperationSchema.index({ status: 1 });

/**
 * Update operation status
 * @param {string} status - New status
 * @param {Object} details - Additional details
 * @returns {Promise<Object>} - Updated operation
 */
RebalancingOperationSchema.methods.updateStatus = async function(status, details = {}) {
  this.status = status;
  
  if (status === 'completed' || status === 'partial' || status === 'failed') {
    this.completedAt = Date.now();
  }
  
  if (details.error) {
    this.error = details.error;
  }
  
  if (details.performance) {
    this.performance = { ...this.performance, ...details.performance };
  }
  
  if (details.achievedAllocation) {
    this.achievedAllocation = details.achievedAllocation;
  }
  
  await this.save();
  return this;
};

/**
 * Update transaction status
 * @param {number} index - Transaction index
 * @param {string} status - New status
 * @param {Object} details - Additional details
 * @returns {Promise<Object>} - Updated operation
 */
RebalancingOperationSchema.methods.updateTransactionStatus = async function(index, status, details = {}) {
  if (!this.transactions[index]) {
    throw new Error(`Transaction at index ${index} not found`);
  }
  
  this.transactions[index].status = status;
  
  if (status === 'completed') {
    this.transactions[index].executedAt = Date.now();
  }
  
  if (details.txHash) {
    this.transactions[index].txHash = details.txHash;
  }
  
  if (details.error) {
    this.transactions[index].error = details.error;
  }
  
  if (details.gas) {
    this.transactions[index].gas = details.gas;
  }
  
  if (details.slippage) {
    this.transactions[index].slippage = details.slippage;
  }
  
  await this.save();
  return this;
};

/**
 * Record notification sent
 * @param {string} type - Notification type
 * @param {Array} channels - Notification channels
 * @returns {Promise<Object>} - Updated operation
 */
RebalancingOperationSchema.methods.recordNotification = async function(type, channels) {
  this.notificationsSent.push({
    type,
    timestamp: Date.now(),
    channels
  });
  
  await this.save();
  return this;
};

/**
 * Process approval
 * @param {Object} user - User who approved
 * @param {boolean} approved - Whether approved or rejected
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Updated operation
 */
RebalancingOperationSchema.methods.processApproval = async function(user, approved, reason = '') {
  this.approval.approved = approved;
  
  if (approved) {
    this.approval.approvedBy = user._id;
    this.approval.approvedAt = Date.now();
    this.status = 'executing';
  } else {
    this.approval.rejectedAt = Date.now();
    this.approval.rejectionReason = reason;
    this.status = 'cancelled';
  }
  
  await this.save();
  return this;
};

/**
 * Apply manual override
 * @param {Object} user - User who overrode
 * @param {string} reason - Override reason
 * @param {Object} originalPlan - Original plan being overridden
 * @returns {Promise<Object>} - Updated operation
 */
RebalancingOperationSchema.methods.applyOverride = async function(user, reason, originalPlan = null) {
  this.manualOverride = {
    overridden: true,
    overriddenBy: user._id,
    overriddenAt: Date.now(),
    reason
  };
  
  if (originalPlan) {
    this.manualOverride.originalPlan = originalPlan;
  }
  
  await this.save();
  return this;
};

/**
 * Find pending operations
 * @returns {Promise<Array>} - Pending operations
 */
RebalancingOperationSchema.statics.findPending = function() {
  return this.find({ 
    status: { $in: ['pending', 'simulating', 'executing'] } 
  }).sort({ createdAt: 1 });
};

/**
 * Find operations waiting for approval
 * @returns {Promise<Array>} - Operations waiting for approval
 */
RebalancingOperationSchema.statics.findAwaitingApproval = function() {
  return this.find({
    status: 'waitingApproval',
    'approval.required': true,
    'approval.approved': false,
    'approval.rejectedAt': { $exists: false }
  }).sort({ createdAt: 1 });
};

/**
 * Find completed operations by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Completed operations
 */
RebalancingOperationSchema.statics.findCompletedInDateRange = function(startDate, endDate) {
  return this.find({
    status: { $in: ['completed', 'partial'] },
    completedAt: { $gte: startDate, $lte: endDate }
  }).sort({ completedAt: -1 });
};

/**
 * Calculate performance stats
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} - Performance stats
 */
RebalancingOperationSchema.statics.calculatePerformanceStats = async function(userId, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const operations = await this.find({
    user: userId,
    status: { $in: ['completed', 'partial'] },
    completedAt: { $gte: startDate, $lte: endDate }
  });
  
  let totalOperations = operations.length;
  let successfulOperations = operations.filter(op => op.status === 'completed').length;
  let totalGasCostUsd = 0;
  let totalValueImprovement = 0;
  let totalSlippage = 0;
  
  operations.forEach(op => {
    if (op.performance) {
      totalGasCostUsd += op.performance.totalGasCostUsd || 0;
      
      if (op.performance.portfolioValueBefore && op.performance.portfolioValueAfter) {
        totalValueImprovement += op.performance.portfolioValueAfter - op.performance.portfolioValueBefore;
      }
      
      totalSlippage += op.performance.totalSlippage || 0;
    }
  });
  
  return {
    totalOperations,
    successfulOperations,
    successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
    totalGasCostUsd,
    avgGasCostUsd: totalOperations > 0 ? totalGasCostUsd / totalOperations : 0,
    totalValueImprovement,
    avgValueImprovement: totalOperations > 0 ? totalValueImprovement / totalOperations : 0,
    totalSlippage,
    avgSlippage: totalOperations > 0 ? totalSlippage / totalOperations : 0
  };
};

module.exports = mongoose.model('RebalancingOperation', RebalancingOperationSchema);
