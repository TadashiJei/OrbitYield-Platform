const rebalancingService = require('../services/RebalancingService');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * @desc    Get all rebalancing strategies for a user
 * @route   GET /api/rebalancing/strategies
 * @access  Private
 */
const getRebalancingStrategies = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const strategies = await rebalancingService.getUserStrategies(userId);
  res.json(strategies);
});

/**
 * @desc    Get a specific rebalancing strategy
 * @route   GET /api/rebalancing/strategies/:id
 * @access  Private
 */
const getRebalancingStrategy = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const strategyId = req.params.id;
  const strategy = await rebalancingService.getStrategyById(strategyId, userId);
  res.json(strategy);
});

/**
 * @desc    Create a new rebalancing strategy
 * @route   POST /api/rebalancing/strategies
 * @access  Private
 */
const createRebalancingStrategy = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const strategyData = req.body;
  
  // Ensure strategy belongs to the requesting user
  strategyData.user = userId;
  
  const strategy = await rebalancingService.createStrategy(strategyData);
  res.status(201).json(strategy);
});

/**
 * @desc    Update a rebalancing strategy
 * @route   PUT /api/rebalancing/strategies/:id
 * @access  Private
 */
const updateRebalancingStrategy = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const strategyId = req.params.id;
  const strategyData = req.body;
  
  const strategy = await rebalancingService.updateStrategy(strategyId, strategyData, userId);
  res.json(strategy);
});

/**
 * @desc    Delete a rebalancing strategy
 * @route   DELETE /api/rebalancing/strategies/:id
 * @access  Private
 */
const deleteRebalancingStrategy = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const strategyId = req.params.id;
  
  await rebalancingService.deleteStrategy(strategyId, userId);
  res.status(204).send();
});

/**
 * @desc    Get rebalancing operations for a user
 * @route   GET /api/rebalancing/operations
 * @access  Private
 */
const getRebalancingOperations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, strategyId, limit = 10, page = 1 } = req.query;
  
  const operations = await rebalancingService.getUserOperations(userId, { 
    status, 
    strategyId,
    limit: parseInt(limit), 
    page: parseInt(page)
  });
  
  res.json(operations);
});

/**
 * @desc    Get a specific rebalancing operation
 * @route   GET /api/rebalancing/operations/:id
 * @access  Private
 */
const getRebalancingOperation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const operationId = req.params.id;
  
  const operation = await rebalancingService.getOperationById(operationId, userId);
  res.json(operation);
});

/**
 * @desc    Create a rebalancing preview/plan
 * @route   POST /api/rebalancing/operations/plan
 * @access  Private
 */
const createRebalancingPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { strategyId, manualAllocation } = req.body;
  
  const plan = await rebalancingService.createRebalancingPlanForStrategy(strategyId, userId, manualAllocation);
  res.status(201).json(plan);
});

/**
 * @desc    Simulate a rebalancing operation
 * @route   POST /api/rebalancing/operations/:id/simulate
 * @access  Private
 */
const simulateRebalancingOperation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const operationId = req.params.id;
  
  const operation = await rebalancingService.simulateRebalancingOperation(operationId, userId);
  res.json(operation);
});

/**
 * @desc    Execute a rebalancing operation
 * @route   POST /api/rebalancing/operations/:id/execute
 * @access  Private
 */
const executeRebalancingOperation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const operationId = req.params.id;
  
  const operation = await rebalancingService.executeRebalancingOperation(operationId, userId);
  res.json(operation);
});

/**
 * @desc    Approve or reject a rebalancing operation
 * @route   POST /api/rebalancing/operations/:id/approve
 * @access  Private
 */
const approveRebalancingOperation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const operationId = req.params.id;
  const { approved, reason } = req.body;
  
  const operation = await rebalancingService.processRebalancingApproval(
    operationId, 
    Boolean(approved), 
    userId, 
    reason || ''
  );
  
  res.json(operation);
});

/**
 * @desc    Manually trigger a threshold check for strategies
 * @route   POST /api/rebalancing/check-thresholds
 * @access  Private
 */
const checkThresholds = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const result = await rebalancingService.processThresholdRebalances(userId);
  res.json({ 
    success: true, 
    message: 'Threshold check completed',
    operationsCreated: result.length,
    operations: result
  });
});

module.exports = {
  getRebalancingStrategies,
  getRebalancingStrategy,
  createRebalancingStrategy,
  updateRebalancingStrategy,
  deleteRebalancingStrategy,
  getRebalancingOperations,
  getRebalancingOperation,
  createRebalancingPlan,
  simulateRebalancingOperation,
  executeRebalancingOperation,
  approveRebalancingOperation,
  checkThresholds
};
