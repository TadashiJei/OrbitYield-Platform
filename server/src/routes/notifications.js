const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  broadcastNotification
} = require('../controllers/notifications');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// User routes
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Admin routes
router.post('/', authorize('admin'), createNotification);
router.post('/broadcast', authorize('admin'), broadcastNotification);

module.exports = router;
