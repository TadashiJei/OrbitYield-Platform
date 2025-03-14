const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy'
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment'
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YieldOpportunity'
  },
  protocolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Protocol'
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required']
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'yield', 'fee', 'harvest', 'stake', 'unstake', 'claim', 'compound'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  amountUsd: {
    type: Number,
    min: [0, 'USD amount must be positive']
  },
  asset: {
    type: String,
    required: [true, 'Asset symbol is required']
  },
  assetAddress: {
    type: String
  },
  chainId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  txHash: {
    type: String,
    trim: true
  },
  blockHeight: {
    type: Number
  },
  blockTimestamp: {
    type: Date
  },
  fee: {
    type: Number,
    default: 0
  },
  gasUsed: {
    type: String
  },
  gasPrice: {
    type: String
  },
  effectiveGasPrice: {
    type: String
  },
  notes: {
    type: String
  },
  apy: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  isPending: {
    type: Boolean,
    default: false
  },
  isAutomatic: {
    type: Boolean,
    default: false
  },
  xcmRelated: {
    type: Boolean,
    default: false
  },
  xcmDetails: {
    sourceChain: String,
    destinationChain: String,
    messageHash: String
  },
  rewardData: {
    rewardToken: String,
    rewardTokenAddress: String,
    rewardAmount: Number,
    rewardAmountUsd: Number
  }
}, {
  timestamps: true
});

// Indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ strategyId: 1 });
TransactionSchema.index({ investmentId: 1 });
TransactionSchema.index({ opportunityId: 1 });
TransactionSchema.index({ protocolId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ txHash: 1 });
TransactionSchema.index({ chainId: 1 });
TransactionSchema.index({ type: 1 });

/**
 * Update transaction status
 * @param {string} newStatus - New status
 * @param {Object} errorDetails - Error details for failed transactions
 * @returns {Promise<Object>} - Updated transaction
 */
TransactionSchema.methods.updateStatus = async function(newStatus, errorDetails) {
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.isPending = false;
  } else if (newStatus === 'failed' && errorDetails) {
    this.isPending = false;
    this.error = errorDetails;
  }
  
  await this.save();
  return this;
};

/**
 * Add blockchain confirmation details
 * @param {string} txHash - Transaction hash
 * @param {number} blockHeight - Block height
 * @param {Date} blockTimestamp - Block timestamp
 * @returns {Promise<Object>} - Updated transaction
 */
TransactionSchema.methods.confirm = async function(txHash, blockHeight, blockTimestamp) {
  this.txHash = txHash;
  this.blockHeight = blockHeight;
  this.blockTimestamp = blockTimestamp;
  this.status = 'completed';
  this.isPending = false;
  
  await this.save();
  return this;
};

/**
 * Add gas usage details
 * @param {Object} gasDetails - Gas details including gasUsed, gasPrice, and effectiveGasPrice
 * @returns {Promise<Object>} - Updated transaction
 */
TransactionSchema.methods.addGasDetails = async function(gasDetails) {
  this.gasUsed = gasDetails.gasUsed?.toString() || this.gasUsed;
  this.gasPrice = gasDetails.gasPrice?.toString() || this.gasPrice;
  this.effectiveGasPrice = gasDetails.effectiveGasPrice?.toString() || this.effectiveGasPrice;
  
  // Calculate fee if not already set
  if (gasDetails.gasUsed && gasDetails.effectiveGasPrice && !this.fee) {
    const gasUsedBN = BigInt(gasDetails.gasUsed);
    const effectiveGasPriceBN = BigInt(gasDetails.effectiveGasPrice);
    const feeBN = gasUsedBN * effectiveGasPriceBN;
    
    // Convert to ether units (divide by 10^18)
    this.fee = Number(feeBN) / 1e18;
  }
  
  await this.save();
  return this;
};

/**
 * Add reward data for yield transactions
 * @param {Object} rewardData - Reward data
 * @returns {Promise<Object>} - Updated transaction
 */
TransactionSchema.methods.addRewardData = async function(rewardData) {
  this.rewardData = {
    rewardToken: rewardData.rewardToken,
    rewardTokenAddress: rewardData.rewardTokenAddress,
    rewardAmount: rewardData.rewardAmount,
    rewardAmountUsd: rewardData.rewardAmountUsd
  };
  
  await this.save();
  return this;
};

/**
 * Find transactions by investment
 * @param {string} investmentId - Investment ID
 * @returns {Promise<Array>} - Array of transactions
 */
TransactionSchema.statics.findByInvestment = function(investmentId) {
  return this.find({ investmentId })
    .sort({ createdAt: -1 })
    .populate('opportunityId', 'name asset')
    .populate('protocolId', 'name')
    .exec();
};

/**
 * Find transactions by protocol
 * @param {string} protocolId - Protocol ID
 * @returns {Promise<Array>} - Array of transactions
 */
TransactionSchema.statics.findByProtocol = function(protocolId) {
  return this.find({ protocolId })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Find transactions by opportunity
 * @param {string} opportunityId - Opportunity ID
 * @returns {Promise<Array>} - Array of transactions
 */
TransactionSchema.statics.findByOpportunity = function(opportunityId) {
  return this.find({ opportunityId })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Find transactions by user and type
 * @param {string} userId - User ID
 * @param {string} type - Transaction type
 * @returns {Promise<Array>} - Array of transactions
 */
TransactionSchema.statics.findByUserAndType = function(userId, type) {
  return this.find({ userId, type })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Get yield statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Yield statistics
 */
TransactionSchema.statics.getYieldStats = async function(userId) {
  const yieldTransactions = await this.find({ 
    userId, 
    type: { $in: ['yield', 'harvest', 'claim'] },
    status: 'completed'
  });
  
  let totalYield = 0;
  let totalYieldUsd = 0;
  const yieldByAsset = {};
  const yieldByProtocol = {};
  
  for (const tx of yieldTransactions) {
    totalYield += tx.amount;
    totalYieldUsd += tx.amountUsd || 0;
    
    // Aggregate by asset
    if (!yieldByAsset[tx.asset]) {
      yieldByAsset[tx.asset] = 0;
    }
    yieldByAsset[tx.asset] += tx.amount;
    
    // Aggregate by protocol
    if (tx.protocolId) {
      const protocolId = tx.protocolId.toString();
      if (!yieldByProtocol[protocolId]) {
        yieldByProtocol[protocolId] = 0;
      }
      yieldByProtocol[protocolId] += tx.amountUsd || 0;
    }
  }
  
  return {
    totalYield,
    totalYieldUsd,
    yieldByAsset,
    yieldByProtocol,
    transactionCount: yieldTransactions.length
  };
};

module.exports = mongoose.model('Transaction', TransactionSchema);
