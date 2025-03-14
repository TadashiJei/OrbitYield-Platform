const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Protocol Schema
 * Represents a DeFi protocol that offers yield opportunities
 */
const ProtocolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Protocol name is required'],
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: [true, 'Protocol slug is required'],
      trim: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'Protocol description is required']
    },
    website: {
      type: String,
      required: [true, 'Protocol website URL is required'],
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please provide a valid URL with HTTP or HTTPS'
      ]
    },
    logo: {
      type: String,
      required: [true, 'Protocol logo URL is required']
    },
    chainIds: {
      type: [String],
      required: [true, 'At least one chain ID is required'],
      validate: {
        validator: function(chainIds) {
          return chainIds.length > 0;
        },
        message: 'At least one chain ID must be specified'
      }
    },
    tvlUsd: {
      type: Number,
      default: 0
    },
    supportedAssets: {
      type: [String],
      default: []
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium'
    },
    audited: {
      type: Boolean,
      default: false
    },
    auditLinks: {
      type: [String],
      default: []
    },
    active: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      enum: [
        'lending',
        'dex',
        'yield_aggregator',
        'liquid_staking',
        'derivatives',
        'cdp',
        'other'
      ],
      required: [true, 'Protocol category is required']
    },
    implementationDetails: {
      adapter: {
        type: String,
        required: [true, 'Protocol adapter name is required']
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      contractAddresses: {
        type: Map,
        of: String,
        default: new Map()
      }
    },
    feeStructure: {
      depositFee: {
        type: Number,
        default: 0
      },
      withdrawalFee: {
        type: Number,
        default: 0
      },
      performanceFee: {
        type: Number,
        default: 0
      },
      managementFee: {
        type: Number,
        default: 0
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deprecated', 'maintenance'],
      default: 'active'
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

// Virtual for yield opportunities from this protocol
ProtocolSchema.virtual('yieldOpportunities', {
  ref: 'YieldOpportunity',
  localField: '_id',
  foreignField: 'protocol',
  justOne: false
});

// Pre save hook to update lastUpdated
ProtocolSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Static method to find protocols by chain ID
ProtocolSchema.statics.findByChainId = async function(chainId) {
  try {
    return await this.find({ chainIds: chainId, active: true })
      .sort({ name: 1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding protocols by chain ID: ${error.message}`);
    throw error;
  }
};

// Static method to find protocols by category
ProtocolSchema.statics.findByCategory = async function(category) {
  try {
    return await this.find({ category, active: true })
      .sort({ tvlUsd: -1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding protocols by category: ${error.message}`);
    throw error;
  }
};

// Static method to find protocols by risk level
ProtocolSchema.statics.findByRiskLevel = async function(riskLevel) {
  try {
    return await this.find({ riskLevel, active: true })
      .sort({ tvlUsd: -1 })
      .lean();
  } catch (error) {
    logger.error(`Error finding protocols by risk level: ${error.message}`);
    throw error;
  }
};

// Static method to update TVL
ProtocolSchema.statics.updateTvl = async function(protocolId, tvlUsd) {
  try {
    return await this.findByIdAndUpdate(
      protocolId,
      { tvlUsd, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
  } catch (error) {
    logger.error(`Error updating protocol TVL: ${error.message}`);
    throw error;
  }
};

// Create model from schema
const Protocol = mongoose.model('Protocol', ProtocolSchema);

module.exports = Protocol;
