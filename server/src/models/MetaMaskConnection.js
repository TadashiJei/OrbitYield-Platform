const mongoose = require('mongoose');

const MetaMaskConnectionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  chainId: {
    type: String,
    default: '1' // Ethereum mainnet by default
  },
  label: {
    type: String,
    default: 'My Wallet'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  removalRequest: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedAt: Date,
    reason: String,
    email: String,
    approvedAt: Date,
    rejectedAt: Date,
    adminNotes: String
  }
}, {
  timestamps: true
});

// Update last used timestamp
MetaMaskConnectionSchema.methods.updateLastUsed = async function() {
  this.lastUsed = Date.now();
  await this.save();
  return this;
};

// Request removal
MetaMaskConnectionSchema.methods.requestRemoval = async function(reason, email) {
  this.removalRequest = {
    status: 'pending',
    requestedAt: Date.now(),
    reason,
    email
  };
  await this.save();
  return this;
};

// Approve removal request
MetaMaskConnectionSchema.methods.approveRemovalRequest = async function(adminNotes) {
  this.removalRequest.status = 'approved';
  this.removalRequest.approvedAt = Date.now();
  this.removalRequest.adminNotes = adminNotes || '';
  this.isActive = false;
  await this.save();
  return this;
};

// Reject removal request
MetaMaskConnectionSchema.methods.rejectRemovalRequest = async function(adminNotes) {
  this.removalRequest.status = 'rejected';
  this.removalRequest.rejectedAt = Date.now();
  this.removalRequest.adminNotes = adminNotes || '';
  await this.save();
  return this;
};

module.exports = mongoose.model('MetaMaskConnection', MetaMaskConnectionSchema);
