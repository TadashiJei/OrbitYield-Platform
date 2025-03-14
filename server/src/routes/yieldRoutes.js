const express = require('express');
const yieldController = require('../controllers/yieldController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes - no authentication required
router.get('/protocols', yieldController.getAllProtocols);
router.get('/protocols/chain/:chainId', yieldController.getProtocolsByChain);
router.get('/protocols/category/:category', yieldController.getProtocolsByCategory);
router.get('/protocols/risk/:riskLevel', yieldController.getProtocolsByRiskLevel);

router.get('/opportunities', yieldController.getAllYieldOpportunities);
router.get('/opportunities/top', yieldController.getTopYieldOpportunities);
router.get('/opportunities/chain/:chainId', yieldController.getYieldOpportunitiesByChain);
router.get('/opportunities/asset/:asset', yieldController.getYieldOpportunitiesByAsset);
router.get('/opportunities/risk/:riskLevel', yieldController.getYieldOpportunitiesByRiskLevel);
router.get('/opportunities/:id', yieldController.getYieldOpportunityById);

// Protected routes - authentication required
router.use(authController.protect);

// User investment routes
router.get('/investments', yieldController.getUserInvestments);
router.get('/investments/:id', yieldController.getInvestmentById);
router.post('/investments', yieldController.createInvestment);
router.patch('/investments/:id', yieldController.updateInvestment);
router.post('/investments/:id/withdraw', yieldController.withdrawFromInvestment);
router.get('/stats', yieldController.getUserYieldStats);

// Admin routes
router.use(authController.restrictTo('admin'));
router.patch('/transactions/:id/status', yieldController.updateTransactionStatus);
router.post('/protocols/:protocolId/sync', yieldController.syncProtocolOpportunities);
router.post('/apy/update-all', yieldController.updateAllApy);
router.post('/protocols/:protocolId/apy', yieldController.updateProtocolApy);
router.post('/tvl/update-all', yieldController.updateAllTvl);
router.post('/auto-harvests', yieldController.processAutoHarvests);

module.exports = router;
