const express = require('express');
const {
  getStrategies,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  getStrategyAnalytics,
  togglePauseStrategy,
  updateStrategyAPY
} = require('../controllers/strategies');

const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Routes with optional authentication
router.get('/', optionalAuth, getStrategies);
router.get('/:id', optionalAuth, getStrategy);
router.get('/:id/analytics', optionalAuth, getStrategyAnalytics);

// Protected routes for admins only
router.use(protect);
router.use(authorize('admin'));

router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);
router.put('/:id/toggle-pause', togglePauseStrategy);
router.put('/:id/update-apy', updateStrategyAPY);

module.exports = router;
