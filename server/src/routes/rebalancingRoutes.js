const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const rebalancingController = require('../controllers/rebalancingController');

// Strategy routes
router.route('/strategies')
  .get(protect, rebalancingController.getRebalancingStrategies)
  .post(protect, rebalancingController.createRebalancingStrategy);

router.route('/strategies/:id')
  .get(protect, rebalancingController.getRebalancingStrategy)
  .put(protect, rebalancingController.updateRebalancingStrategy)
  .delete(protect, rebalancingController.deleteRebalancingStrategy);

// Operation routes
router.route('/operations')
  .get(protect, rebalancingController.getRebalancingOperations);

router.route('/operations/plan')
  .post(protect, rebalancingController.createRebalancingPlan);

router.route('/operations/:id')
  .get(protect, rebalancingController.getRebalancingOperation);

router.route('/operations/:id/simulate')
  .post(protect, rebalancingController.simulateRebalancingOperation);

router.route('/operations/:id/execute')
  .post(protect, rebalancingController.executeRebalancingOperation);

router.route('/operations/:id/approve')
  .post(protect, rebalancingController.approveRebalancingOperation);

// Utility routes
router.route('/check-thresholds')
  .post(protect, rebalancingController.checkThresholds);

module.exports = router;
