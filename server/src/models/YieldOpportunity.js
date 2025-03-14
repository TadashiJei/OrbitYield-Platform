const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Yield Opportunity Schema
 * Represents specific yield opportunities offered by protocols
 */
const YieldOpportunitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Yield opportunity name is required'],
      trim: true
    },
    protocol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Protocol',
      required: [true, 'Protocol reference is required']
    },
    asset: {
      type: String,
      required: [true, 'Asset identifier is required'],
      trim: true
    },
    assetName: {
      type: String,
      required: [true, 'Asset name is required']
    },
    assetSymbol: {
      type: String,
      required: [true, 'Asset symbol is required']
    },
    assetDecimals: {
      type: Number,
      required: [true, 'Asset decimals are required'],
      min: 0,
      max: 18
    },
    assetAddress: {
      type: String,
      required: [true, 'Asset contract address is required']
    },
    chainId: {
      type: String,
      required: [true, 'Chain ID is required']
    },
    apy: {
      current: {
        type: Number,
        required: [true, 'Current APY is required'],
        min: 0
      },
      min7d: {
        type: Number,
        default: 0
      },
      max7d: {
        type: Number,
        default: 0
      },
      mean7d: {
        type: Number,
        default: 0
      },
      min30d: {
        type: Number,
        default: 0
      },
      max30d: {
        type: Number,
        default: 0
      },
      mean30d: {
        type: Number,
        default: 0
      }
    },
    tvlUsd: {
      type: Number,
      default: 0
    },
    minInvestmentUsd: {
      type: Number,
      default: 0
    },
    maxInvestmentUsd: {
      type: Number,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      required: [true, 'Risk level is required']
    },
    strategyType: {
      type: String,
      enum: [
        'lending',
        'liquidity_providing',
        'staking',
        'farming',
        'leveraged_farming',
        'options',
        'derivatives',
        'autocompounding',
        'other'
      ],
      required: [true, 'Strategy type is required']
    },
    implementationDetails: {
      contractAddress: {
        type: String,
        required: [true, 'Contract address is required']
      },
      strategyContractAddress: {
        type: String,
        default: null
      },
      approvalAddress: {
        type: String,
        default: null
      },
      adapter: {
        type: String,
        required: [true, 'Adapter name is required']
      },
      methodName: {
        type: String,
        required: [true, 'Method name is required']
      },
      withdrawMethodName: {
        type: String,
        required: [true, 'Withdraw method name is required']
      },
      entryContractABI: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      extraData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    rewardTokens: [
      {
        symbol: {
          type: String,
          required: true
        },
        address: {
          type: String,
          required: true
        },
        decimals: {
          type: Number,
          required: true
        }
      }
    ],
    depositFee: {
      type: Number,
      default: 0
    },
    withdrawalFee: {
      type: Number,
      default: 0
    },
    harvestable: {
      type: Boolean,
      default: false
    },
    harvestFrequency: {
      type: Number, // In hours
      default: 24
    },
    compoundable: {
      type: Boolean,
      default: false
    },
    autocompounding: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    },
    liquidityProfile: {
      lockTime: {
        type: Number, // In seconds, 0 means no lock
        default: 0
      },
      withdrawalWindow: {
        type: String, // "anytime", "daily", "weekly", "monthly", etc.
        default: 'anytime'
      },
      unlockTime: {
        type: Date,
        default: null
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deprecated', 'paused'],
      default: 'active'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for better query performance
YieldOpportunitySchema.index({ chainId: 1, status: 1 });
YieldOpportunitySchema.index({ protocol: 1, asset: 1, chainId: 1 }, { unique: true });
YieldOpportunitySchema.index({ 'apy.current': -1, status: 1 });
YieldOpportunitySchema.index({ riskLevel: 1, status: 1 });

// Pre save hook to update lastUpdated
YieldOpportunitySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Static method to find active opportunities
YieldOpportunitySchema.statics.findActive = async function() {
  try {
    return await this.find({ status: 'active' })
      .sort({ 'apy.current': -1 })
      .populate('protocol', 'name logo website riskLevel category')
      .lean();
  } catch (error) {
    logger.error(`Error finding active yield opportunities: ${error.message}`);
    throw error;
  }
};

// Static method to find opportunities by chain
YieldOpportunitySchema.statics.findByChain = async function(chainId) {
  try {
    return await this.find({ chainId, status: 'active' })
      .sort({ 'apy.current': -1 })
      .populate('protocol', 'name logo website riskLevel category')
      .lean();
  } catch (error) {
    logger.error(`Error finding yield opportunities by chain: ${error.message}`);
    throw error;
  }
};

// Static method to find opportunities by asset
YieldOpportunitySchema.statics.findByAsset = async function(asset) {
  try {
    return await this.find({ asset, status: 'active' })
      .sort({ 'apy.current': -1 })
      .populate('protocol', 'name logo website riskLevel category')
      .lean();
  } catch (error) {
    logger.error(`Error finding yield opportunities by asset: ${error.message}`);
    throw error;
  }
};

// Static method to find opportunities by risk level
YieldOpportunitySchema.statics.findByRiskLevel = async function(riskLevel) {
  try {
    return await this.find({ riskLevel, status: 'active' })
      .sort({ 'apy.current': -1 })
      .populate('protocol', 'name logo website riskLevel category')
      .lean();
  } catch (error) {
    logger.error(`Error finding yield opportunities by risk level: ${error.message}`);
    throw error;
  }
};

// Static method to find top APY opportunities
YieldOpportunitySchema.statics.findTopByApy = async function(limit = 10) {
  try {
    return await this.find({ status: 'active' })
      .sort({ 'apy.current': -1 })
      .limit(limit)
      .populate('protocol', 'name logo website riskLevel category')
      .lean();
  } catch (error) {
    logger.error(`Error finding top APY yield opportunities: ${error.message}`);
    throw error;
  }
};

// Static method to update APY
YieldOpportunitySchema.statics.updateApy = async function(id, apyData) {
  try {
    return await this.findByIdAndUpdate(
      id,
      {
        'apy.current': apyData.current,
        'apy.min7d': apyData.min7d || 0,
        'apy.max7d': apyData.max7d || 0,
        'apy.mean7d': apyData.mean7d || 0,
        'apy.min30d': apyData.min30d || 0,
        'apy.max30d': apyData.max30d || 0,
        'apy.mean30d': apyData.mean30d || 0,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error(`Error updating yield opportunity APY: ${error.message}`);
    throw error;
  }
};

// Static method to update TVL
YieldOpportunitySchema.statics.updateTvl = async function(id, tvlUsd) {
  try {
    return await this.findByIdAndUpdate(
      id,
      { tvlUsd, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error(`Error updating yield opportunity TVL: ${error.message}`);
    throw error;
  }
};

// Create model from schema
const YieldOpportunity = mongoose.model('YieldOpportunity', YieldOpportunitySchema);

module.exports = YieldOpportunity;
