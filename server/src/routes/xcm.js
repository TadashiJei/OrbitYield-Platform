const express = require('express');
const {
  submitXcmTransaction,
  updateXcmTransactionStatus,
  getXcmTransactions,
  getXcmTransaction,
  getSupportedChains
} = require('../controllers/xcm');

const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/supported-chains', getSupportedChains);

// Protected routes
router.use('/transactions', protect);
router.get('/transactions', getXcmTransactions);
router.get('/transactions/:id', getXcmTransaction);
router.post('/transactions', submitXcmTransaction);

// Admin routes
router.put('/transactions/:id', protect, authorize('admin'), updateXcmTransactionStatus);

module.exports = router;
