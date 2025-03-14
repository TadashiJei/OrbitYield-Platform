const mongoose = require('mongoose');

const StrategySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Strategy name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Strategy description is required']
  },
  protocol: {
    type: String,
    required: [true, 'Protocol name is required'],
    trim: true
  },
  asset: {
    type: String,
    required: [true, 'Asset symbol is required'],
    trim: true
  },
  chainId: {
    type: String,
    required: [true, 'Chain ID is required']
  },
  parachainId: {
    type: String
  },
  contractAddress: {
    type: String,
    required: [true, 'Contract address is required']
  },
  apy: {
    current: {
      type: Number,
      required: [true, 'Current APY is required']
    },
    historical: [{
      date: Date,
      value: Number
    }]
  },
  tvl: {
    type: Number,
    required: [true, 'Total Value Locked is required']
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Risk level is required']
  },
  riskFactors: {
    smart_contract: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    impermanent_loss: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    protocol_risk: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    market_risk: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    liquidity_risk: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  minInvestment: {
    type: Number,
    default: 0
  },
  maxInvestment: {
    type: Number,
    default: 0 // 0 means no maximum
  },
  lockPeriod: {
    type: Number,
    default: 0 // in days, 0 means no lock period
  },
  withdrawalFee: {
    type: Number,
    default: 0 // percentage
  },
  performanceFee: {
    type: Number,
    default: 0 // percentage
  },
  depositInstructions: {
    type: String
  },
  withdrawInstructions: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  xcmEnabled: {
    type: Boolean,
    default: false
  },
  xcmDestinations: [{
    parachainId: String,
    name: String
  }],
  metadataURI: {
    type: String
  },
  auditReports: [{
    name: String,
    date: Date,
    url: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for active user investments
StrategySchema.virtual('activeInvestments', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'strategyId',
  match: { type: 'deposit', status: 'completed' }
});

// Composite index for querying by chain and protocol
StrategySchema.index({ chainId: 1, protocol: 1 });

// Index for APY for sorting by APY
StrategySchema.index({ 'apy.current': -1 });

// Index for risk level
StrategySchema.index({ riskLevel: 1 });

// Calculate overall risk score
StrategySchema.methods.calculateRiskScore = function() {
  const { smart_contract, impermanent_loss, protocol_risk, market_risk, liquidity_risk } = this.riskFactors;
  
  // Calculate weighted average (all factors equally weighted for now)
  const totalFactors = 5;
  const sum = smart_contract + impermanent_loss + protocol_risk + market_risk + liquidity_risk;
  
  return sum / totalFactors;
};

// Update APY and add to historical records
StrategySchema.methods.updateAPY = async function(newAPY) {
  // Add current APY to historical record
  this.apy.historical.push({
    date: new Date(),
    value: this.apy.current
  });
  
  // Keep only last 30 days of history
  if (this.apy.historical.length > 30) {
    this.apy.historical = this.apy.historical.slice(-30);
  }
  
  // Update current APY
  this.apy.current = newAPY;
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Strategy', StrategySchema);
