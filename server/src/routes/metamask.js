const express = require('express');
const {
  saveConnection,
  getConnections,
  updateConnection,
  requestRemoval,
  getRemovalStatus
} = require('../controllers/metamask');

const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', protect, saveConnection);
router.get('/', protect, getConnections);
router.put('/:id', protect, updateConnection);
router.post('/removal-request', protect, requestRemoval);

// Public routes (with optional auth)
router.get('/removal-request/:walletAddress', optionalAuth, getRemovalStatus);

module.exports = router;
