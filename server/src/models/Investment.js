const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Investment Schema
 * Tracks user investments in yield opportunities
 */
const InvestmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'YieldOpportunity',
      required: [true, 'Yield opportunity reference is required']
    },
    protocol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Protocol',
      required: [true, 'Protocol reference is required']
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required']
    },
    chainId: {
      type: String,
      required: [true, 'Chain ID is required']
    },
    asset: {
      type: String,
      required: [true, 'Asset is required']
    },
    assetDecimals: {
      type: Number,
      required: [true, 'Asset decimals are required']
    },
    assetSymbol: {
      type: String,
      required: [true, 'Asset symbol is required']
    },
    initialAmount: {
      type: String, // BigNumber as string to preserve precision
      required: [true, 'Initial investment amount is required']
    },
    initialAmountUsd: {
      type: Number,
      required: [true, 'Initial investment amount in USD is required']
    },
    currentAmount: {
      type: String, // BigNumber as string to preserve precision
      required: [true, 'Current investment amount is required']
    },
    currentAmountUsd: {
      type: Number,
      required: [true, 'Current investment amount in USD is required']
    },
    apyAtInvestment: {
      type: Number,
      required: [true, 'APY at time of investment is required']
    },
    currentApy: {
      type: Number,
      required: [true, 'Current APY is required']
    },
    profitLoss: {
      type: Number, // Can be negative for loss
      default: 0
    },
    yieldEarned: {
      type: String, // BigNumber as string
      default: '0'
    },
    yieldEarnedUsd: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'withdrawn', 'partially_withdrawn', 'failed'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    lastHarvestDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    totalHarvested: {
      type: String, // BigNumber as string
      default: '0'
    },
    totalHarvestedUsd: {
      type: Number,
      default: 0
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      }
    ],
    withdrawals: [
      {
        amount: String, // BigNumber as string
        amountUsd: Number,
        timestamp: {
          type: Date,
          default: Date.now
        },
        transactionHash: String,
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transaction'
        }
      }
    ],
    harvests: [
      {
        amount: String, // BigNumber as string
        amountUsd: Number,
        timestamp: {
          type: Date,
          default: Date.now
        },
        transactionHash: String,
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transaction'
        }
      }
    ],
    autoHarvest: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: Number, // In hours
        default: 24
      },
      threshold: {
        type: String, // Minimum amount to harvest (BigNumber as string)
        default: '0'
      },
      lastAttempt: {
        type: Date,
        default: null
      }
    },
    autoCompound: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: Number, // In hours
        default: 24
      },
      lastAttempt: {
        type: Date,
        default: null
      }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for better query performance
InvestmentSchema.index({ user: 1, status: 1 });
InvestmentSchema.index({ opportunity: 1, status: 1 });
InvestmentSchema.index({ protocol: 1, status: 1 });
InvestmentSchema.index({ chainId: 1, status: 1 });

// Pre save hook to update lastUpdated
InvestmentSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Method to update current amount and profit/loss
InvestmentSchema.methods.updateCurrentAmount = async function(amount, amountUsd, apy) {
  try {
    this.currentAmount = amount;
    this.currentAmountUsd = amountUsd;
    this.currentApy = apy || this.currentApy;
    
    // Calculate profit/loss
    this.profitLoss = this.currentAmountUsd - this.initialAmountUsd;
    
    // Calculate yield earned (current - initial)
    const initialBN = BigInt(this.initialAmount);
    const currentBN = BigInt(amount);
    
    if (currentBN > initialBN) {
      this.yieldEarned = (currentBN - initialBN).toString();
      // Update USD value of yield earned based on current price ratio
      const priceRatio = amountUsd / parseFloat(amount);
      this.yieldEarnedUsd = parseFloat(this.yieldEarned) * priceRatio;
    }
    
    this.lastUpdated = Date.now();
    return await this.save();
  } catch (error) {
    logger.error(`Error updating investment current amount: ${error.message}`);
    throw error;
  }
};

// Method to record a withdrawal
InvestmentSchema.methods.recordWithdrawal = async function(withdrawalData) {
  try {
    this.withdrawals.push(withdrawalData);
    
    const withdrawalAmountBN = BigInt(withdrawalData.amount);
    const currentAmountBN = BigInt(this.currentAmount);
    
    if (withdrawalAmountBN >= currentAmountBN) {
      // Full withdrawal
      this.status = 'withdrawn';
      this.currentAmount = '0';
      this.currentAmountUsd = 0;
      this.endDate = withdrawalData.timestamp || Date.now();
    } else {
      // Partial withdrawal
      this.status = 'partially_withdrawn';
      this.currentAmount = (currentAmountBN - withdrawalAmountBN).toString();
      // Update USD value based on current price ratio
      const priceRatio = this.currentAmountUsd / parseFloat(this.currentAmount);
      this.currentAmountUsd = parseFloat(this.currentAmount) * priceRatio;
    }
    
    this.lastUpdated = Date.now();
    return await this.save();
  } catch (error) {
    logger.error(`Error recording investment withdrawal: ${error.message}`);
    throw error;
  }
};

// Method to record a harvest
InvestmentSchema.methods.recordHarvest = async function(harvestData) {
  try {
    this.harvests.push(harvestData);
    this.lastHarvestDate = harvestData.timestamp || Date.now();
    
    // Update total harvested
    const harvestAmountBN = BigInt(harvestData.amount);
    const totalHarvestedBN = BigInt(this.totalHarvested);
    this.totalHarvested = (totalHarvestedBN + harvestAmountBN).toString();
    this.totalHarvestedUsd += harvestData.amountUsd;
    
    this.lastUpdated = Date.now();
    return await this.save();
  } catch (error) {
    logger.error(`Error recording investment harvest: ${error.message}`);
    throw error;
  }
};

// Static method to find user investments
InvestmentSchema.statics.findByUser = async function(userId, status = 'active') {
  try {
    return await this.find({ user: userId, status })
      .populate('opportunity', 'name asset assetSymbol riskLevel apy')
      .populate('protocol', 'name logo website category')
      .sort({ currentAmountUsd: -1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding user investments: ${error.message}`);
    throw error;
  }
};

// Static method to find investments by opportunity
InvestmentSchema.statics.findByOpportunity = async function(opportunityId) {
  try {
    return await this.find({ opportunity: opportunityId, status: 'active' })
      .populate('user', 'name email')
      .sort({ currentAmountUsd: -1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding investments by opportunity: ${error.message}`);
    throw error;
  }
};

// Static method to find investments by protocol
InvestmentSchema.statics.findByProtocol = async function(protocolId) {
  try {
    return await this.find({ protocol: protocolId, status: 'active' })
      .populate('user', 'name email')
      .populate('opportunity', 'name asset assetSymbol riskLevel apy')
      .sort({ currentAmountUsd: -1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding investments by protocol: ${error.message}`);
    throw error;
  }
};

// Static method to find investments by chain
InvestmentSchema.statics.findByChain = async function(chainId) {
  try {
    return await this.find({ chainId, status: 'active' })
      .populate('user', 'name email')
      .populate('opportunity', 'name asset assetSymbol riskLevel apy')
      .populate('protocol', 'name logo website category')
      .sort({ currentAmountUsd: -1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding investments by chain: ${error.message}`);
    throw error;
  }
};

// Static method to calculate total investments
InvestmentSchema.statics.calculateTotalInvestments = async function(userId) {
  try {
    const aggregateResult = await this.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), status: 'active' } },
      {
        $group: {
          _id: null,
          totalInitialUsd: { $sum: '$initialAmountUsd' },
          totalCurrentUsd: { $sum: '$currentAmountUsd' },
          totalProfitLoss: { $sum: '$profitLoss' },
          totalYieldEarnedUsd: { $sum: '$yieldEarnedUsd' },
          totalHarvestedUsd: { $sum: '$totalHarvestedUsd' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (aggregateResult.length === 0) {
      return {
        totalInitialUsd: 0,
        totalCurrentUsd: 0,
        totalProfitLoss: 0,
        totalYieldEarnedUsd: 0,
        totalHarvestedUsd: 0,
        count: 0
      };
    }

    return aggregateResult[0];
  } catch (error) {
    logger.error(`Error calculating total investments: ${error.message}`);
    throw error;
  }
};

// Static method to find investments eligible for harvest
InvestmentSchema.statics.findEligibleForHarvest = async function() {
  try {
    const now = new Date();
    
    return await this.find({
      status: 'active',
      'autoHarvest.enabled': true,
      $or: [
        { 'autoHarvest.lastAttempt': null },
        {
          $expr: {
            $gt: [
              { $subtract: [now, '$autoHarvest.lastAttempt'] },
              { $multiply: ['$autoHarvest.frequency', 60 * 60 * 1000] } // Convert hours to milliseconds
            ]
          }
        }
      ]
    })
      .populate('opportunity')
      .populate('protocol')
      .lean();
  } catch (error) {
    logger.error(`Error finding investments eligible for harvest: ${error.message}`);
    throw error;
  }
};

// Static method to find investments eligible for compounding
InvestmentSchema.statics.findEligibleForCompounding = async function() {
  try {
    const now = new Date();
    
    return await this.find({
      status: 'active',
      'autoCompound.enabled': true,
      $or: [
        { 'autoCompound.lastAttempt': null },
        {
          $expr: {
            $gt: [
              { $subtract: [now, '$autoCompound.lastAttempt'] },
              { $multiply: ['$autoCompound.frequency', 60 * 60 * 1000] } // Convert hours to milliseconds
            ]
          }
        }
      ]
    })
      .populate('opportunity')
      .populate('protocol')
      .lean();
  } catch (error) {
    logger.error(`Error finding investments eligible for compounding: ${error.message}`);
    throw error;
  }
};

// Create model from schema
const Investment = mongoose.model('Investment', InvestmentSchema);

module.exports = Investment;
