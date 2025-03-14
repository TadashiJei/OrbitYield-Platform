const mongoose = require('mongoose');
const AppError = require('../utils/appError');

/**
 * Rebalancing Strategy Schema
 * Defines rules and parameters for automatic portfolio rebalancing
 */
const RebalancingStrategySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Strategy name is required'],
    trim: true,
    maxlength: [100, 'Strategy name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'draft'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['threshold', 'periodic', 'custom'],
    required: [true, 'Strategy type is required']
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  },
  // Define target allocation percentages by asset or protocol
  targetAllocations: [{
    type: {
      type: String,
      enum: ['asset', 'protocol', 'chain'],
      required: [true, 'Allocation type is required']
    },
    id: {
      type: String,
      required: [true, 'Asset/Protocol/Chain ID is required']
    }, 
    name: {
      type: String,
      required: [true, 'Allocation name is required']
    },
    targetPercentage: {
      type: Number,
      required: [true, 'Target percentage is required'],
      min: [0, 'Target percentage must be at least 0'],
      max: [100, 'Target percentage cannot exceed 100']
    },
    minPercentage: {
      type: Number,
      min: [0, 'Minimum percentage must be at least 0'],
      max: [100, 'Minimum percentage cannot exceed 100']
    },
    maxPercentage: {
      type: Number,
      min: [0, 'Maximum percentage must be at least 0'],
      max: [100, 'Maximum percentage cannot exceed 100']
    }
  }],
  // Triggers that will cause a rebalance operation
  triggers: {
    // Deviation threshold (percentage) that triggers rebalancing
    deviationThreshold: {
      type: Number,
      default: 5,
      min: [1, 'Deviation threshold must be at least 1%'],
      max: [50, 'Deviation threshold cannot exceed 50%']
    },
    // For periodic rebalancing
    schedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'custom'],
      default: 'monthly'
    },
    // For custom schedule, store as cron expression
    customSchedule: {
      type: String
    },
    // If true, will only suggest rebalances but not auto-execute
    manualApprovalRequired: {
      type: Boolean,
      default: true
    },
    // Minimum time between rebalances (in hours)
    minTimeBetweenRebalances: {
      type: Number,
      default: 24,
      min: [1, 'Minimum time between rebalances must be at least 1 hour']
    }
  },
  // Execution parameters
  executionParams: {
    // Maximum slippage allowed for trades (percentage)
    maxSlippage: {
      type: Number,
      default: 0.5,
      min: [0.1, 'Max slippage must be at least 0.1%'],
      max: [10, 'Max slippage cannot exceed 10%']
    },
    // Maximum gas price willing to pay (in gwei)
    maxGasPrice: {
      type: Number
    },
    // Target gas price to optimize for (in gwei)
    targetGasPrice: {
      type: Number
    },
    // Whether to prioritize gas efficiency or speed
    gasMode: {
      type: String,
      enum: ['efficient', 'fast', 'aggressive'],
      default: 'efficient'
    },
    // Maximum percentage of portfolio to rebalance at once
    maxRebalancePercentage: {
      type: Number,
      default: 100,
      min: [1, 'Max rebalance percentage must be at least 1%'],
      max: [100, 'Max rebalance percentage cannot exceed 100%']
    }
  },
  notifications: {
    // Whether to send notifications for rebalance events
    enabled: {
      type: Boolean,
      default: true
    },
    // Channels to notify on (email, push, in-app)
    channels: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    // What events to notify on
    events: {
      started: {
        type: Boolean,
        default: true
      },
      completed: {
        type: Boolean,
        default: true
      },
      failed: {
        type: Boolean,
        default: true
      },
      approval: {
        type: Boolean,
        default: true
      }
    }
  },
  // Whether simulation should be performed before execution
  simulateBeforeExecution: {
    type: Boolean,
    default: true
  },
  // Advanced options
  advanced: {
    // Whether to use flash loans for atomic rebalancing
    useFlashLoans: {
      type: Boolean,
      default: false
    },
    // Optimization target (e.g., minimize gas, maximize returns)
    optimizationTarget: {
      type: String,
      enum: ['minimizeGas', 'maximizeReturns', 'balanced'],
      default: 'balanced'
    },
    // Maximum number of transactions to execute in one rebalance
    maxTransactions: {
      type: Number,
      default: 10,
      min: [1, 'Maximum transactions must be at least 1'],
      max: [50, 'Maximum transactions cannot exceed 50']
    },
    // Custom execution paths (e.g., specific DEXs to use)
    customExecutionPaths: [{
      dex: String,
      priority: Number
    }]
  },
  lastRebalance: {
    timestamp: Date,
    status: {
      type: String,
      enum: ['completed', 'failed', 'partial', 'pending', 'simulated']
    },
    details: mongoose.Schema.Types.Mixed
  },
  nextScheduledRebalance: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Validate target allocations sum to 100%
RebalancingStrategySchema.pre('save', function(next) {
  if (this.targetAllocations && this.targetAllocations.length > 0) {
    const sum = this.targetAllocations.reduce((acc, allocation) => {
      return acc + allocation.targetPercentage;
    }, 0);

    // Allow a small margin of error due to floating point
    if (sum < 99.5 || sum > 100.5) {
      return next(new AppError('Target allocations must sum to 100%', 400));
    }
  }

  // Ensure min/max percentages are consistent
  for (const allocation of this.targetAllocations) {
    if (allocation.minPercentage && allocation.minPercentage > allocation.targetPercentage) {
      return next(new AppError('Minimum percentage cannot be greater than target percentage', 400));
    }
    if (allocation.maxPercentage && allocation.maxPercentage < allocation.targetPercentage) {
      return next(new AppError('Maximum percentage cannot be less than target percentage', 400));
    }
  }

  next();
});

// Find strategies that need rebalancing based on threshold
RebalancingStrategySchema.statics.findEligibleForThresholdRebalance = function() {
  return this.find({
    status: 'active',
    type: { $in: ['threshold', 'custom'] },
    'triggers.manualApprovalRequired': false,
    $or: [
      { lastRebalance: { $exists: false } },
      { 
        'lastRebalance.timestamp': { 
          $lt: new Date(Date.now() - 1000 * 60 * 60 * this.triggers.minTimeBetweenRebalances)
        }
      }
    ]
  });
};

// Find strategies that need periodic rebalancing
RebalancingStrategySchema.statics.findEligibleForPeriodicRebalance = function() {
  return this.find({
    status: 'active',
    type: 'periodic',
    'triggers.manualApprovalRequired': false,
    nextScheduledRebalance: { $lte: new Date() }
  });
};

// Calculate current allocation vs target to determine if rebalancing is needed
RebalancingStrategySchema.methods.needsRebalancing = async function(currentAllocations) {
  // If no current allocations provided, assume rebalancing is needed
  if (!currentAllocations) return true;

  let needsRebalancing = false;
  const deviationThreshold = this.triggers.deviationThreshold;

  for (const target of this.targetAllocations) {
    const current = currentAllocations.find(a => 
      a.type === target.type && a.id === target.id
    );

    // If we can't find current allocation for a target, rebalancing is needed
    if (!current) {
      needsRebalancing = true;
      break;
    }

    // Calculate difference between current and target
    const difference = Math.abs(current.percentage - target.targetPercentage);
    
    // Check if deviation exceeds threshold
    if (difference > deviationThreshold) {
      needsRebalancing = true;
      break;
    }

    // Check if allocation is outside min/max bounds
    if (
      (target.minPercentage && current.percentage < target.minPercentage) ||
      (target.maxPercentage && current.percentage > target.maxPercentage)
    ) {
      needsRebalancing = true;
      break;
    }
  }

  return needsRebalancing;
};

// Update the next scheduled rebalance date
RebalancingStrategySchema.methods.updateNextScheduledRebalance = function() {
  const schedule = this.triggers.schedule;
  let nextDate = new Date();

  switch (schedule) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'custom':
      // For custom schedules, would need to parse cron expression
      // This is placeholder logic
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  this.nextScheduledRebalance = nextDate;
  return this;
};

// Record a rebalance attempt
RebalancingStrategySchema.methods.recordRebalance = async function(status, details) {
  this.lastRebalance = {
    timestamp: new Date(),
    status,
    details
  };

  // If this is a periodic strategy, update the next scheduled rebalance
  if (this.type === 'periodic') {
    this.updateNextScheduledRebalance();
  }

  await this.save();
  return this;
};

module.exports = mongoose.model('RebalancingStrategy', RebalancingStrategySchema);
