const express = require('express');
const {
  getRemovalRequests,
  getRemovalRequestCounts,
  approveRemovalRequest,
  rejectRemovalRequest,
  getConnectionDetails
} = require('../controllers/admin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// MetaMask routes
router.get('/metamask', getRemovalRequests);
router.get('/metamask/counts', getRemovalRequestCounts);
router.get('/metamask/:id', getConnectionDetails);
router.put('/metamask/:id/approve', approveRemovalRequest);
router.put('/metamask/:id/reject', rejectRemovalRequest);

module.exports = router;
