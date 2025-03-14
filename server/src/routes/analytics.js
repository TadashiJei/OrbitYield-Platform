const express = require('express');
const {
  trackEvent,
  getUserActivity,
  getMostViewedStrategies,
  getStrategyConversionRates,
  getUserRetentionData,
  getAnalyticsDashboard
} = require('../controllers/analytics');

const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public route with optional authentication
router.post('/events', optionalAuth, trackEvent);

// Protected routes (user)
router.get('/users/:userId/activity', protect, getUserActivity);

// Admin routes
router.get('/strategies/most-viewed', protect, authorize('admin'), getMostViewedStrategies);
router.get('/strategies/conversion-rates', protect, authorize('admin'), getStrategyConversionRates);
router.get('/users/retention', protect, authorize('admin'), getUserRetentionData);
router.get('/dashboard', protect, authorize('admin'), getAnalyticsDashboard);

module.exports = router;
