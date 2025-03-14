const express = require('express');
const {
  getConnectionStats,
  sendSystemAnnouncement,
  sendDirectMessage,
  disconnectUser,
  sendMetaMaskRemovalAlert
} = require('../controllers/websocketAdmin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin')); // Require admin role

// WebSocket admin routes
router.get('/stats', getConnectionStats);
router.post('/announcement', sendSystemAnnouncement);
router.post('/message/:userId', sendDirectMessage);
router.delete('/connections/:userId', disconnectUser);
router.post('/metamask-alert', sendMetaMaskRemovalAlert);

module.exports = router;
