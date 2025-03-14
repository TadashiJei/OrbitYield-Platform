const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  getTransactionStats,
  getXcmTransactions
} = require('../controllers/transactions');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// User routes
router.get('/', getTransactions);
router.get('/stats', getTransactionStats);
router.get('/xcm', getXcmTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);

// Admin routes
router.put('/:id', authorize('admin'), updateTransaction);

module.exports = router;
