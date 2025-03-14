const mongoose = require('mongoose');
const logger = require('../config/logger');
const RebalancingStrategy = require('../models/RebalancingStrategy');
const RebalancingOperation = require('../models/RebalancingOperation');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const YieldOpportunity = require('../models/YieldOpportunity');
const Protocol = require('../models/Protocol');
const ProtocolAdapterManager = require('./ProtocolAdapterManager');
const notificationService = require('../utils/notificationService');
const BigNumber = require('bignumber.js');

/**
 * Rebalancing Service
 * Handles portfolio rebalancing operations
 */
class RebalancingService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the rebalancing service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing Rebalancing Service');
      
      // Initialize dependencies
      await ProtocolAdapterManager.initialize();
      
      this.initialized = true;
      logger.info('Rebalancing Service initialized');
    } catch (error) {
      logger.error(`Error initializing Rebalancing Service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all rebalancing strategies for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of strategies
   */
  async getUserStrategies(userId) {
    try {
      return await RebalancingStrategy.find({ user: userId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Error getting user strategies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a rebalancing strategy by ID
   * @param {string} strategyId - Strategy ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Strategy object
   */
  async getStrategyById(strategyId, userId) {
    try {
      const strategy = await RebalancingStrategy.findById(strategyId);
      
      if (!strategy) {
        throw new Error(`Strategy not found with ID: ${strategyId}`);
      }
      
      // Check if user is authorized to access this strategy
      if (strategy.user.toString() !== userId) {
        throw new Error('Unauthorized access to strategy');
      }
      
      return strategy;
    } catch (error) {
      logger.error(`Error getting strategy by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new rebalancing strategy
   * @param {Object} strategyData - Strategy data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created strategy
   */
  async createStrategy(strategyData, userId) {
    try {
      // Set the user ID
      strategyData.user = userId;
      
      // Create the strategy
      const strategy = await RebalancingStrategy.create(strategyData);
      
      logger.info(`Created rebalancing strategy ${strategy._id} for user ${userId}`);
      
      return strategy;
    } catch (error) {
      logger.error(`Error creating rebalancing strategy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a rebalancing strategy
   * @param {string} strategyId - Strategy ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Updated strategy
   */
  async updateStrategy(strategyId, updateData, userId) {
    try {
      // Check if strategy exists and belongs to user
      const strategy = await this.getStrategyById(strategyId, userId);
      
      // Update the strategy
      const updatedStrategy = await RebalancingStrategy.findByIdAndUpdate(
        strategyId,
        updateData,
        { new: true, runValidators: true }
      );
      
      logger.info(`Updated rebalancing strategy ${strategyId}`);
      
      return updatedStrategy;
    } catch (error) {
      logger.error(`Error updating rebalancing strategy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a rebalancing strategy
   * @param {string} strategyId - Strategy ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} - Success status
   */
  async deleteStrategy(strategyId, userId) {
    try {
      // Check if strategy exists and belongs to user
      const strategy = await this.getStrategyById(strategyId, userId);
      
      // Delete the strategy
      await RebalancingStrategy.findByIdAndDelete(strategyId);
      
      logger.info(`Deleted rebalancing strategy ${strategyId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting rebalancing strategy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get rebalancing operations for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of operations
   */
  async getUserOperations(userId, filters = {}) {
    try {
      // Build query
      const query = { user: userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.strategyId) {
        query.strategy = filters.strategyId;
      }
      
      if (filters.dateFrom && filters.dateTo) {
        query.createdAt = {
          $gte: new Date(filters.dateFrom),
          $lte: new Date(filters.dateTo)
        };
      }
      
      // Execute query
      const operations = await RebalancingOperation.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .populate('strategy', 'name type')
        .exec();
      
      return operations;
    } catch (error) {
      logger.error(`Error getting user operations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a rebalancing operation by ID
   * @param {string} operationId - Operation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Operation object
   */
  async getOperationById(operationId, userId) {
    try {
      const operation = await RebalancingOperation.findById(operationId)
        .populate('strategy', 'name type')
        .exec();
      
      if (!operation) {
        throw new Error(`Operation not found with ID: ${operationId}`);
      }
      
      // Check if user is authorized to access this operation
      if (operation.user.toString() !== userId) {
        throw new Error('Unauthorized access to operation');
      }
      
      return operation;
    } catch (error) {
      logger.error(`Error getting operation by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate current allocation of a user's portfolio
   * @param {string} userId - User ID
   * @param {string} portfolioId - Portfolio ID (optional)
   * @returns {Promise<Object>} - Current allocation
   */
  async calculateCurrentAllocation(userId, portfolioId = null) {
    try {
      // Query to get user's active investments
      const query = { user: userId, status: 'active' };
      
      if (portfolioId) {
        query.portfolioId = portfolioId;
      }
      
      const investments = await Investment.find(query)
        .populate({
          path: 'opportunity',
          select: 'name asset apy protocol chainId',
          populate: {
            path: 'protocol',
            select: 'name logo'
          }
        })
        .exec();
      
      // Calculate total portfolio value
      const totalValue = investments.reduce((total, inv) => total + inv.currentBalanceUsd, 0);
      
      // Group by different dimensions
      const assetAllocation = {};
      const protocolAllocation = {};
      const chainAllocation = {};
      
      // Calculate allocations
      investments.forEach(inv => {
        const assetId = inv.asset;
        const protocolId = inv.opportunity.protocol._id.toString();
        const chainId = inv.chainId;
        
        // Asset allocation
        if (!assetAllocation[assetId]) {
          assetAllocation[assetId] = {
            type: 'asset',
            id: assetId,
            name: inv.asset,
            amountUsd: 0,
            percentage: 0
          };
        }
        assetAllocation[assetId].amountUsd += inv.currentBalanceUsd;
        
        // Protocol allocation
        if (!protocolAllocation[protocolId]) {
          protocolAllocation[protocolId] = {
            type: 'protocol',
            id: protocolId,
            name: inv.opportunity.protocol.name,
            amountUsd: 0,
            percentage: 0
          };
        }
        protocolAllocation[protocolId].amountUsd += inv.currentBalanceUsd;
        
        // Chain allocation
        if (!chainAllocation[chainId]) {
          chainAllocation[chainId] = {
            type: 'chain',
            id: chainId,
            name: chainId, // Would need a lookup to get proper name
            amountUsd: 0,
            percentage: 0
          };
        }
        chainAllocation[chainId].amountUsd += inv.currentBalanceUsd;
      });
      
      // Calculate percentages
      if (totalValue > 0) {
        Object.values(assetAllocation).forEach(asset => {
          asset.percentage = (asset.amountUsd / totalValue) * 100;
        });
        
        Object.values(protocolAllocation).forEach(protocol => {
          protocol.percentage = (protocol.amountUsd / totalValue) * 100;
        });
        
        Object.values(chainAllocation).forEach(chain => {
          chain.percentage = (chain.amountUsd / totalValue) * 100;
        });
      }
      
      return {
        totalValue,
        assetAllocation: Object.values(assetAllocation),
        protocolAllocation: Object.values(protocolAllocation),
        chainAllocation: Object.values(chainAllocation)
      };
    } catch (error) {
      logger.error(`Error calculating current allocation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a rebalancing plan based on current and target allocations
   * @param {Array} currentAllocation - Current allocation
   * @param {Array} targetAllocation - Target allocation
   * @param {number} totalValue - Total portfolio value
   * @param {Object} executionParams - Execution parameters
   * @returns {Promise<Object>} - Rebalancing plan
   */
  async createRebalancingPlan(currentAllocation, targetAllocation, totalValue, executionParams) {
    try {
      // Create arrays to hold transactions and changes
      const transactions = [];
      const changes = [];
      
      // Create maps for easy lookup
      const currentMap = new Map(currentAllocation.map(item => [item.id, item]));
      const targetMap = new Map(targetAllocation.map(item => [item.id, item]));
      
      // Process removes (assets to decrease)
      for (const [id, current] of currentMap.entries()) {
        const target = targetMap.get(id);
        
        // Asset not in target or needs to be decreased
        if (!target || current.percentage > target.targetPercentage) {
          const decreasePercentage = target 
            ? current.percentage - target.targetPercentage 
            : current.percentage;
          
          const decreaseAmountUsd = (decreasePercentage / 100) * totalValue;
          
          changes.push({
            type: current.type,
            id: current.id,
            name: current.name,
            action: 'decrease',
            fromPercentage: current.percentage,
            toPercentage: target ? target.targetPercentage : 0,
            changePercentage: decreasePercentage,
            changeAmountUsd: decreaseAmountUsd
          });
        }
      }
      
      // Process adds (assets to increase)
      for (const [id, target] of targetMap.entries()) {
        const current = currentMap.get(id);
        
        // New asset or needs to be increased
        if (!current || current.percentage < target.targetPercentage) {
          const increasePercentage = current 
            ? target.targetPercentage - current.percentage 
            : target.targetPercentage;
          
          const increaseAmountUsd = (increasePercentage / 100) * totalValue;
          
          changes.push({
            type: target.type,
            id: target.id,
            name: target.name,
            action: 'increase',
            fromPercentage: current ? current.percentage : 0,
            toPercentage: target.targetPercentage,
            changePercentage: increasePercentage,
            changeAmountUsd: increaseAmountUsd
          });
        }
      }
      
      // Sort changes by amount (largest first)
      changes.sort((a, b) => b.changeAmountUsd - a.changeAmountUsd);
      
      // Generate transactions based on changes
      // This is a simplified algorithm - would need more complex logic in production
      const decreases = changes.filter(c => c.action === 'decrease');
      const increases = changes.filter(c => c.action === 'increase');
      
      let decreaseIndex = 0;
      let decreaseAmountRemaining = 0;
      
      for (const increase of increases) {
        let remainingToIncrease = increase.changeAmountUsd;
        
        while (remainingToIncrease > 0) {
          // Get next decrease or continue with current one
          if (decreaseAmountRemaining <= 0 && decreaseIndex < decreases.length) {
            decreaseAmountRemaining = decreases[decreaseIndex].changeAmountUsd;
            decreaseIndex++;
          }
          
          // If no more decreases, we can't fulfill this increase
          if (decreaseAmountRemaining <= 0) {
            break;
          }
          
          // Determine amount to move
          const moveAmount = Math.min(remainingToIncrease, decreaseAmountRemaining);
          
          // Create transaction
          const currentDecrease = decreases[decreaseIndex - 1];
          transactions.push({
            type: 'swap',
            status: 'pending',
            fromAsset: currentDecrease.name,
            toAsset: increase.name,
            fromAmount: moveAmount.toString(), // This would need to be converted from USD to actual token amount
            toAmount: moveAmount.toString(), // This would need slippage calculation
            fromAmountUsd: moveAmount,
            toAmountUsd: moveAmount
          });
          
          // Update remaining amounts
          remainingToIncrease -= moveAmount;
          decreaseAmountRemaining -= moveAmount;
        }
      }
      
      return {
        totalValue,
        changes,
        transactions
      };
    } catch (error) {
      logger.error(`Error creating rebalancing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initiate a manual rebalancing operation
   * @param {string} strategyId - Strategy ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created operation
   */
  async initiateManualRebalance(strategyId, userId) {
    try {
      // Get strategy and verify ownership
      const strategy = await this.getStrategyById(strategyId, userId);
      
      // Calculate current allocation
      const allocation = await this.calculateCurrentAllocation(userId, strategy.portfolioId);
      
      // Check if rebalancing is needed
      let currentAllocation;
      if (strategy.type === 'threshold') {
        // For threshold-based strategies, we need to check by allocation type
        switch (strategy.targetAllocations[0]?.type) {
          case 'asset':
            currentAllocation = allocation.assetAllocation;
            break;
          case 'protocol':
            currentAllocation = allocation.protocolAllocation;
            break;
          case 'chain':
            currentAllocation = allocation.chainAllocation;
            break;
          default:
            currentAllocation = allocation.assetAllocation;
        }
        
        const needsRebalancing = await strategy.needsRebalancing(currentAllocation);
        
        if (!needsRebalancing) {
          throw new Error('Rebalancing not needed at this time based on current thresholds');
        }
      }
      
      // Create a rebalancing plan
      const plan = await this.createRebalancingPlan(
        currentAllocation,
        strategy.targetAllocations,
        allocation.totalValue,
        strategy.executionParams
      );
      
      // Create the rebalancing operation
      const operation = await RebalancingOperation.create({
        user: userId,
        strategy: strategyId,
        portfolioId: strategy.portfolioId,
        status: 'pending',
        initiatedBy: 'user',
        initiatedAt: Date.now(),
        currentAllocation: currentAllocation,
        targetAllocation: strategy.targetAllocations,
        transactions: plan.transactions,
        approval: {
          required: strategy.triggers.manualApprovalRequired,
          approved: !strategy.triggers.manualApprovalRequired
        }
      });
      
      // If approval is required, set status to waiting approval
      if (strategy.triggers.manualApprovalRequired) {
        await operation.updateStatus('waitingApproval');
        
        // Send notification if enabled
        if (strategy.notifications.enabled && strategy.notifications.events.approval) {
          await notificationService.createNotification({
            user: userId,
            title: 'Rebalancing Approval Required',
            message: `Your portfolio rebalancing strategy "${strategy.name}" requires your approval to execute.`,
            type: 'rebalance_approval',
            importance: 'high',
            metadata: {
              strategyId: strategy._id,
              operationId: operation._id
            }
          });
          
          // Record notification sent
          await operation.recordNotification('waitingApproval', ['inApp']);
        }
      } else {
        // Otherwise, simulate or execute directly
        if (strategy.simulateBeforeExecution) {
          await operation.updateStatus('simulating');
          await this.simulateRebalancingOperation(operation._id, userId);
        } else {
          await operation.updateStatus('executing');
          await this.executeRebalancingOperation(operation._id, userId);
        }
      }
      
      logger.info(`Initiated manual rebalance ${operation._id} for strategy ${strategyId}`);
      
      return operation;
    } catch (error) {
      logger.error(`Error initiating manual rebalance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process pending threshold-based rebalances
   * @returns {Promise<Object>} - Processing results
   */
  async processThresholdRebalances() {
    try {
      // Find all active threshold-based strategies
      const eligibleStrategies = await RebalancingStrategy.findEligibleForThresholdRebalance();
      
      const results = {
        processed: 0,
        rebalanced: 0,
        skipped: 0,
        errors: 0,
        details: []
      };
      
      for (const strategy of eligibleStrategies) {
        try {
          results.processed++;
          
          // Calculate current allocation
          const allocation = await this.calculateCurrentAllocation(strategy.user, strategy.portfolioId);
          
          // Select appropriate allocation type
          let currentAllocation;
          switch (strategy.targetAllocations[0]?.type) {
            case 'asset':
              currentAllocation = allocation.assetAllocation;
              break;
            case 'protocol':
              currentAllocation = allocation.protocolAllocation;
              break;
            case 'chain':
              currentAllocation = allocation.chainAllocation;
              break;
            default:
              currentAllocation = allocation.assetAllocation;
          }
          
          // Check if rebalancing is needed
          const needsRebalancing = await strategy.needsRebalancing(currentAllocation);
          
          if (!needsRebalancing) {
            results.skipped++;
            results.details.push({
              strategyId: strategy._id,
              status: 'skipped',
              reason: 'Thresholds not triggered'
            });
            continue;
          }
          
          // Create a rebalancing plan
          const plan = await this.createRebalancingPlan(
            currentAllocation,
            strategy.targetAllocations,
            allocation.totalValue,
            strategy.executionParams
          );
          
          // Create the rebalancing operation
          const operation = await RebalancingOperation.create({
            user: strategy.user,
            strategy: strategy._id,
            portfolioId: strategy.portfolioId,
            status: 'pending',
            initiatedBy: 'system',
            initiatedAt: Date.now(),
            currentAllocation: currentAllocation,
            targetAllocation: strategy.targetAllocations,
            transactions: plan.transactions,
            approval: {
              required: strategy.triggers.manualApprovalRequired,
              approved: !strategy.triggers.manualApprovalRequired
            }
          });
          
          // If approval is required, set status to waiting approval
          if (strategy.triggers.manualApprovalRequired) {
            await operation.updateStatus('waitingApproval');
            
            // Send notification if enabled
            if (strategy.notifications.enabled && strategy.notifications.events.approval) {
              await notificationService.createNotification({
                user: strategy.user,
                title: 'Rebalancing Approval Required',
                message: `Your portfolio rebalancing strategy "${strategy.name}" requires your approval to execute.`,
                type: 'rebalance_approval',
                importance: 'high',
                metadata: {
                  strategyId: strategy._id,
                  operationId: operation._id
                }
              });
              
              // Record notification sent
              await operation.recordNotification('waitingApproval', ['inApp']);
            }
          } else {
            // Otherwise, simulate or execute directly
            if (strategy.simulateBeforeExecution) {
              await operation.updateStatus('simulating');
              await this.simulateRebalancingOperation(operation._id, strategy.user);
            } else {
              await operation.updateStatus('executing');
              await this.executeRebalancingOperation(operation._id, strategy.user);
            }
          }
          
          results.rebalanced++;
          results.details.push({
            strategyId: strategy._id,
            status: 'rebalanced',
            operationId: operation._id
          });
          
          // Record this rebalance attempt in the strategy
          await strategy.recordRebalance('pending', { operationId: operation._id });
        } catch (error) {
          logger.error(`Error processing threshold rebalance for strategy ${strategy._id}: ${error.message}`);
          
          results.errors++;
          results.details.push({
            strategyId: strategy._id,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing threshold rebalances: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process pending periodic rebalances
   * @returns {Promise<Object>} - Processing results
   */
  async processPeriodicRebalances() {
    try {
      // Find all active periodic strategies due for rebalancing
      const eligibleStrategies = await RebalancingStrategy.findEligibleForPeriodicRebalance();
      
      const results = {
        processed: 0,
        rebalanced: 0,
        errors: 0,
        details: []
      };
      
      for (const strategy of eligibleStrategies) {
        try {
          results.processed++;
          
          // Calculate current allocation
          const allocation = await this.calculateCurrentAllocation(strategy.user, strategy.portfolioId);
          
          // Select appropriate allocation type
          let currentAllocation;
          switch (strategy.targetAllocations[0]?.type) {
            case 'asset':
              currentAllocation = allocation.assetAllocation;
              break;
            case 'protocol':
              currentAllocation = allocation.protocolAllocation;
              break;
            case 'chain':
              currentAllocation = allocation.chainAllocation;
              break;
            default:
              currentAllocation = allocation.assetAllocation;
          }
          
          // Create a rebalancing plan
          const plan = await this.createRebalancingPlan(
            currentAllocation,
            strategy.targetAllocations,
            allocation.totalValue,
            strategy.executionParams
          );
          
          // Create the rebalancing operation
          const operation = await RebalancingOperation.create({
            user: strategy.user,
            strategy: strategy._id,
            portfolioId: strategy.portfolioId,
            status: 'pending',
            initiatedBy: 'system',
            initiatedAt: Date.now(),
            currentAllocation: currentAllocation,
            targetAllocation: strategy.targetAllocations,
            transactions: plan.transactions,
            approval: {
              required: strategy.triggers.manualApprovalRequired,
              approved: !strategy.triggers.manualApprovalRequired
            }
          });
          
          // If approval is required, set status to waiting approval
          if (strategy.triggers.manualApprovalRequired) {
            await operation.updateStatus('waitingApproval');
            
            // Send notification if enabled
            if (strategy.notifications.enabled && strategy.notifications.events.approval) {
              await notificationService.createNotification({
                user: strategy.user,
                title: 'Periodic Rebalancing Approval Required',
                message: `Your scheduled portfolio rebalancing "${strategy.name}" requires your approval to execute.`,
                type: 'rebalance_approval',
                importance: 'high',
                metadata: {
                  strategyId: strategy._id,
                  operationId: operation._id
                }
              });
              
              // Record notification sent
              await operation.recordNotification('waitingApproval', ['inApp']);
            }
          } else {
            // Otherwise, simulate or execute directly
            if (strategy.simulateBeforeExecution) {
              await operation.updateStatus('simulating');
              await this.simulateRebalancingOperation(operation._id, strategy.user);
            } else {
              await operation.updateStatus('executing');
              await this.executeRebalancingOperation(operation._id, strategy.user);
            }
          }
          
          results.rebalanced++;
          results.details.push({
            strategyId: strategy._id,
            status: 'rebalanced',
            operationId: operation._id
          });
          
          // Update next scheduled rebalance date
          strategy.updateNextScheduledRebalance();
          await strategy.save();
          
          // Record this rebalance attempt in the strategy
          await strategy.recordRebalance('pending', { operationId: operation._id });
        } catch (error) {
          logger.error(`Error processing periodic rebalance for strategy ${strategy._id}: ${error.message}`);
          
          results.errors++;
          results.details.push({
            strategyId: strategy._id,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing periodic rebalances: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simulate a rebalancing operation
   * @param {string} operationId - Operation ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Operation with simulation results
   */
  async simulateRebalancingOperation(operationId, userId) {
    try {
      // Get operation and verify ownership
      const operation = await this.getOperationById(operationId, userId);
      
      if (operation.status !== 'simulating') {
        await operation.updateStatus('simulating');
      }
      
      // Get strategy to access execution parameters
      const strategy = await this.getStrategyById(operation.strategy, userId);
      
      logger.info(`Simulating rebalancing operation ${operationId}`);
      
      // Deep copy the transactions for simulation
      const simulatedTransactions = JSON.parse(JSON.stringify(operation.transactions));
      
      // Mock simulation results
      const simulationResults = {
        performed: true,
        result: 'success',
        expectedGasCost: 0,
        expectedGasCostUsd: 0,
        expectedSlippage: 0,
        estimatedDuration: 0,
        warnings: [],
        errors: [],
        details: {}
      };
      
      // Track totals for the simulation
      let totalGasCost = 0;
      let totalSlippage = 0;
      let estimatedDuration = 0;
      
      // Simulate each transaction
      for (let i = 0; i < simulatedTransactions.length; i++) {
        const tx = simulatedTransactions[i];
        
        try {
          // Get protocol adapters as needed
          let sourceAdapter, targetAdapter;
          
          if (tx.fromProtocol) {
            sourceAdapter = await ProtocolAdapterManager.getAdapter(tx.fromProtocol, tx.fromChain);
          }
          
          if (tx.toProtocol) {
            targetAdapter = await ProtocolAdapterManager.getAdapter(tx.toProtocol, tx.toChain);
          }
          
          // Calculate estimated gas costs
          let estimatedGas;
          if (sourceAdapter && sourceAdapter.estimateGas) {
            estimatedGas = await sourceAdapter.estimateGas(tx.type, {
              asset: tx.fromAsset,
              amount: tx.fromAmount
            });
          } else {
            // Default gas estimates based on transaction type
            switch (tx.type) {
              case 'swap':
                estimatedGas = { gasUsed: '200000', gasPrice: '50000000000' }; // 200k gas at 50 gwei
                break;
              case 'deposit':
              case 'withdrawal':
                estimatedGas = { gasUsed: '150000', gasPrice: '50000000000' }; // 150k gas at 50 gwei
                break;
              default:
                estimatedGas = { gasUsed: '100000', gasPrice: '50000000000' }; // 100k gas at 50 gwei
            }
          }
          
          // Calculate gas cost in ETH
          const gasCostEth = new BigNumber(estimatedGas.gasUsed)
            .multipliedBy(new BigNumber(estimatedGas.gasPrice))
            .dividedBy(new BigNumber(10).pow(18));
          
          // Assuming ETH price of $3000 for this simulation
          const ethPrice = 3000;
          const gasCostUsd = gasCostEth.multipliedBy(ethPrice).toNumber();
          
          // Simulate slippage
          let slippage;
          if (tx.type === 'swap') {
            // For swaps, estimate slippage based on size
            const amountUsd = new BigNumber(tx.fromAmountUsd);
            if (amountUsd.lt(1000)) {
              slippage = 0.001; // 0.1% for small trades
            } else if (amountUsd.lt(10000)) {
              slippage = 0.003; // 0.3% for medium trades
            } else if (amountUsd.lt(100000)) {
              slippage = 0.005; // 0.5% for large trades
            } else {
              slippage = 0.01; // 1% for very large trades
            }
            
            // Adjust based on strategy max slippage
            slippage = Math.min(slippage, strategy.executionParams.maxSlippage / 100);
          } else {
            slippage = 0; // No slippage for deposits/withdrawals in this simulation
          }
          
          // Calculate expected execution time based on transaction type
          let txDuration;
          switch (tx.type) {
            case 'swap':
              txDuration = 30; // 30 seconds for swaps
              break;
            case 'deposit':
              txDuration = 45; // 45 seconds for deposits
              break;
            case 'withdrawal':
              txDuration = 60; // 60 seconds for withdrawals
              break;
            default:
              txDuration = 20; // 20 seconds for other transactions
          }
          
          // Check if cross-chain and add additional time
          if (tx.fromChain && tx.toChain && tx.fromChain !== tx.toChain) {
            txDuration += 300; // Add 5 minutes for cross-chain operations
            simulationResults.warnings.push(`Cross-chain transaction from ${tx.fromChain} to ${tx.toChain} may take several minutes to complete.`);
          }
          
          // Update simulation totals
          totalGasCost += gasCostUsd;
          totalSlippage += slippage;
          estimatedDuration += txDuration;
          
          // Update transaction with simulation results
          simulatedTransactions[i].status = 'pending';
          simulatedTransactions[i].gas = {
            gasUsed: estimatedGas.gasUsed,
            gasPrice: estimatedGas.gasPrice,
            gasCost: gasCostEth.toString(),
            gasCostUsd: gasCostUsd
          };
          simulatedTransactions[i].slippage = {
            expected: slippage,
            actual: null
          };
          
          // Check if gas price exceeds max gas price in strategy
          if (strategy.executionParams.maxGasPrice && 
              new BigNumber(estimatedGas.gasPrice).gt(new BigNumber(strategy.executionParams.maxGasPrice).multipliedBy(1e9))) {
            simulationResults.warnings.push(`Transaction ${i + 1} exceeds maximum gas price. Consider waiting for lower gas prices.`);
          }
        } catch (error) {
          logger.error(`Error simulating transaction ${i}: ${error.message}`);
          simulationResults.errors.push(`Error simulating transaction ${i}: ${error.message}`);
          simulatedTransactions[i].status = 'failed';
          simulatedTransactions[i].error = {
            code: 'SIMULATION_ERROR',
            message: error.message
          };
        }
      }
      
      // Update simulation results
      simulationResults.expectedGasCost = totalGasCost;
      simulationResults.expectedGasCostUsd = totalGasCost;
      simulationResults.expectedSlippage = totalSlippage / simulatedTransactions.length; // Average slippage
      simulationResults.estimatedDuration = estimatedDuration;
      
      // If there are errors, update the result status
      if (simulationResults.errors.length > 0) {
        simulationResults.result = 'failed';
      } else if (simulationResults.warnings.length > 0) {
        simulationResults.result = 'partial';
      }
      
      // Calculate estimated portfolio value after rebalancing
      const currentTotal = operation.currentAllocation.reduce((sum, item) => sum + (item.amountUsd || 0), 0);
      const slippageCost = currentTotal * (simulationResults.expectedSlippage / 100);
      const portfolioValueAfter = currentTotal - totalGasCost - slippageCost;
      
      simulationResults.details = {
        simulatedTransactions,
        portfolioValueBefore: currentTotal,
        portfolioValueAfter: portfolioValueAfter,
        slippageCost: slippageCost,
        gasCost: totalGasCost
      };
      
      // Update operation with simulation results
      operation.simulation = simulationResults;
      operation.transactions = simulatedTransactions;
      
      // If simulation was successful and no approval required, move to execution
      if (simulationResults.result === 'success' && !operation.approval.required) {
        await operation.updateStatus('executing');
        return this.executeRebalancingOperation(operationId, userId);
      } 
      // If simulation failed and no approval required, mark as failed
      else if (simulationResults.result === 'failed' && !operation.approval.required) {
        await operation.updateStatus('failed', {
          error: {
            code: 'SIMULATION_FAILED',
            message: 'Simulation failed with errors',
            details: simulationResults.errors
          }
        });
      } 
      // If approval required, set status to waitingApproval
      else if (operation.approval.required) {
        await operation.updateStatus('waitingApproval');
        
        // Send notification if enabled
        const strategy = await RebalancingStrategy.findById(operation.strategy);
        if (strategy.notifications.enabled && strategy.notifications.events.approval) {
          await notificationService.createNotification({
            user: userId,
            title: 'Rebalancing Simulation Completed',
            message: `Rebalancing simulation for "${strategy.name}" completed. Your approval is required to execute.`,
            type: 'rebalance_simulation',
            importance: 'medium',
            metadata: {
              strategyId: strategy._id,
              operationId: operation._id,
              simulationResult: simulationResults.result
            }
          });
        }
      } 
      // Otherwise update status to completed simulation
      else {
        await operation.updateStatus('simulated');
      }
      
      // Save the operation
      await operation.save();
      
      return operation;
    } catch (error) {
      logger.error(`Error simulating rebalancing operation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Execute a rebalancing operation
   * @param {string} operationId - Operation ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated operation
   */
  async executeRebalancingOperation(operationId, userId) {
    try {
      // Get operation and verify ownership
      const operation = await this.getOperationById(operationId, userId);
      
      if (operation.status !== 'executing') {
        await operation.updateStatus('executing');
      }
      
      // Get strategy
      const strategy = await this.getStrategyById(operation.strategy, userId);
      
      logger.info(`Executing rebalancing operation ${operationId}`);
      
      // Send start notification if enabled
      if (strategy.notifications.enabled && strategy.notifications.events.started) {
        await notificationService.createNotification({
          user: userId,
          title: 'Rebalancing Started',
          message: `Rebalancing operation for "${strategy.name}" has started execution.`,
          type: 'rebalance_started',
          importance: 'medium',
          metadata: {
            strategyId: strategy._id,
            operationId: operation._id
          }
        });
        
        // Record notification sent
        await operation.recordNotification('started', ['inApp']);
      }
      
      // In a real implementation, this would execute the actual transactions
      // For now, we'll simulate successful execution
      
      // Update operation status to completed
      await operation.updateStatus('completed', {
        performance: {
          portfolioValueBefore: 10000, // Example value
          portfolioValueAfter: 10050,  // Example value
          totalGasCost: 0.05,          // Example value
          totalGasCostUsd: 150,        // Example value
          totalSlippage: 0.2,          // Example value
          executionTime: 120,          // Example value (seconds)
          successRate: 100             // Example value (percentage)
        }
      });
      
      // Send completion notification if enabled
      if (strategy.notifications.enabled && strategy.notifications.events.completed) {
        await notificationService.createNotification({
          user: userId,
          title: 'Rebalancing Completed',
          message: `Rebalancing operation for "${strategy.name}" has been completed successfully.`,
          type: 'rebalance_completed',
          importance: 'medium',
          metadata: {
            strategyId: strategy._id,
            operationId: operation._id
          }
        });
        
        // Record notification sent
        await operation.recordNotification('completed', ['inApp']);
      }
      
      // Record this rebalance completion in the strategy
      await strategy.recordRebalance('completed', {
        operationId: operation._id
      });
      
      logger.info(`Completed rebalancing operation ${operationId}`);
      
      return operation;
    } catch (error) {
      logger.error(`Error executing rebalancing operation: ${error.message}`);
      
      try {
        // Try to update operation status to failed
        const operation = await RebalancingOperation.findById(operationId);
        if (operation) {
          await operation.updateStatus('failed', {
            error: {
              code: 'EXECUTION_ERROR',
              message: error.message
            }
          });
          
          // Send failure notification if enabled
          const strategy = await RebalancingStrategy.findById(operation.strategy);
          if (strategy && strategy.notifications.enabled && strategy.notifications.events.failed) {
            await notificationService.createNotification({
              user: userId,
              title: 'Rebalancing Failed',
              message: `Rebalancing operation for "${strategy.name}" has failed: ${error.message}`,
              type: 'rebalance_failed',
              importance: 'high',
              metadata: {
                strategyId: strategy._id,
                operationId: operation._id,
                error: error.message
              }
            });
            
            // Record notification sent
            await operation.recordNotification('failed', ['inApp']);
          }
        }
      } catch (notifError) {
        logger.error(`Error sending failure notification: ${notifError.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Process approvals for rebalancing operations
   * @param {string} operationId - Operation ID
   * @param {boolean} approved - Whether the operation is approved
   * @param {string} userId - User ID
   * @param {string} reason - Rejection reason (if not approved)
   * @returns {Promise<Object>} - Updated operation
   */
  async processRebalancingApproval(operationId, approved, userId, reason = '') {
    try {
      // Get operation and verify ownership
      const operation = await this.getOperationById(operationId, userId);
      
      if (operation.status !== 'waitingApproval') {
        throw new Error(`Operation is not waiting for approval. Current status: ${operation.status}`);
      }
      
      if (!operation.approval.required) {
        throw new Error('This operation does not require approval');
      }
      
      // Process approval
      await operation.processApproval({ _id: userId }, approved, reason);
      
      // If approved, proceed with execution
      if (approved) {
        return this.executeRebalancingOperation(operationId, userId);
      }
      
      return operation;
    } catch (error) {
      logger.error(`Error processing rebalancing approval: ${error.message}`);
      throw error;
    }
  }
}

// Create and export singleton instance
const rebalancingService = new RebalancingService();
module.exports = rebalancingService;
