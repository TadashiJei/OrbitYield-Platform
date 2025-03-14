const mongoose = require('mongoose');
const logger = require('../config/logger');
const Protocol = require('../models/Protocol');
const YieldOpportunity = require('../models/YieldOpportunity');
const Investment = require('../models/Investment');
const ProtocolAdapterManager = require('./ProtocolAdapterManager');
const apyCalculationService = require('../utils/apyCalculationService');
const notificationService = require('../utils/notificationService');

/**
 * Yield Data Service
 * Provides unified API for yield opportunities across different protocols
 */
class YieldDataService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the yield data service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing Yield Data Service');
      
      // Initialize protocol adapter manager
      await ProtocolAdapterManager.initialize();
      
      this.initialized = true;
      logger.info('Yield Data Service initialized');
    } catch (error) {
      logger.error(`Error initializing Yield Data Service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all supported protocols
   * @returns {Promise<Array>} - Array of protocols
   */
  async getAllProtocols() {
    try {
      return await Protocol.find({ active: true }).sort({ name: 1 }).lean();
    } catch (error) {
      logger.error(`Error getting all protocols: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get protocols by chain
   * @param {string} chainId - Chain ID
   * @returns {Promise<Array>} - Array of protocols for the chain
   */
  async getProtocolsByChain(chainId) {
    try {
      return await Protocol.findByChainId(chainId);
    } catch (error) {
      logger.error(`Error getting protocols by chain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get protocols by category
   * @param {string} category - Protocol category
   * @returns {Promise<Array>} - Array of protocols in the category
   */
  async getProtocolsByCategory(category) {
    try {
      return await Protocol.findByCategory(category);
    } catch (error) {
      logger.error(`Error getting protocols by category: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get protocols by risk level
   * @param {string} riskLevel - Risk level
   * @returns {Promise<Array>} - Array of protocols with the risk level
   */
  async getProtocolsByRiskLevel(riskLevel) {
    try {
      return await Protocol.findByRiskLevel(riskLevel);
    } catch (error) {
      logger.error(`Error getting protocols by risk level: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all active yield opportunities
   * @returns {Promise<Array>} - Array of yield opportunities
   */
  async getAllYieldOpportunities() {
    try {
      return await YieldOpportunity.findActive();
    } catch (error) {
      logger.error(`Error getting all yield opportunities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get yield opportunities by chain
   * @param {string} chainId - Chain ID
   * @returns {Promise<Array>} - Array of yield opportunities for the chain
   */
  async getYieldOpportunitiesByChain(chainId) {
    try {
      return await YieldOpportunity.findByChain(chainId);
    } catch (error) {
      logger.error(`Error getting yield opportunities by chain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get yield opportunities by asset
   * @param {string} asset - Asset address or symbol
   * @returns {Promise<Array>} - Array of yield opportunities for the asset
   */
  async getYieldOpportunitiesByAsset(asset) {
    try {
      return await YieldOpportunity.findByAsset(asset);
    } catch (error) {
      logger.error(`Error getting yield opportunities by asset: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get yield opportunities by risk level
   * @param {string} riskLevel - Risk level
   * @returns {Promise<Array>} - Array of yield opportunities with the risk level
   */
  async getYieldOpportunitiesByRiskLevel(riskLevel) {
    try {
      return await YieldOpportunity.findByRiskLevel(riskLevel);
    } catch (error) {
      logger.error(`Error getting yield opportunities by risk level: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get top APY yield opportunities
   * @param {number} limit - Number of opportunities to return
   * @returns {Promise<Array>} - Array of top APY yield opportunities
   */
  async getTopYieldOpportunities(limit = 10) {
    try {
      return await YieldOpportunity.findTopByApy(limit);
    } catch (error) {
      logger.error(`Error getting top yield opportunities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get yield opportunity by ID
   * @param {string} id - Yield opportunity ID
   * @returns {Promise<Object>} - Yield opportunity
   */
  async getYieldOpportunityById(id) {
    try {
      const opportunity = await YieldOpportunity.findById(id)
        .populate('protocol', 'name logo website riskLevel category')
        .lean();
      
      if (!opportunity) {
        throw new Error(`Yield opportunity not found with ID: ${id}`);
      }
      
      return opportunity;
    } catch (error) {
      logger.error(`Error getting yield opportunity by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync yield opportunities for a protocol
   * @param {string} protocolId - Protocol ID
   * @returns {Promise<Object>} - Sync results
   */
  async syncProtocolOpportunities(protocolId) {
    try {
      // Get protocol from database
      const protocol = await Protocol.findById(protocolId);
      
      if (!protocol) {
        throw new Error(`Protocol not found with ID: ${protocolId}`);
      }
      
      // Get adapter for protocol
      const adapter = ProtocolAdapterManager.getAdapterForProtocol(protocol);
      
      const results = {
        created: 0,
        updated: 0,
        errors: 0,
        opportunities: []
      };
      
      // Process each chain that the protocol supports
      for (const chainId of protocol.chainIds) {
        try {
          // Get opportunities from adapter
          const adapterOpportunities = await adapter.getYieldOpportunities(chainId);
          
          for (const opportunity of adapterOpportunities) {
            try {
              // Check if opportunity already exists
              const existingOpportunity = await YieldOpportunity.findOne({
                protocol: protocol._id,
                asset: opportunity.asset,
                chainId: opportunity.chainId
              });
              
              if (existingOpportunity) {
                // Update existing opportunity
                const updated = await YieldOpportunity.findByIdAndUpdate(
                  existingOpportunity._id,
                  {
                    ...opportunity,
                    protocol: protocol._id,
                    lastUpdated: Date.now()
                  },
                  { new: true, runValidators: true }
                );
                
                results.updated++;
                results.opportunities.push(updated);
              } else {
                // Create new opportunity
                const created = await YieldOpportunity.create({
                  ...opportunity,
                  protocol: protocol._id
                });
                
                results.created++;
                results.opportunities.push(created);
              }
            } catch (error) {
              logger.error(`Error processing opportunity: ${error.message}`);
              results.errors++;
            }
          }
        } catch (error) {
          logger.error(`Error processing chain ${chainId} for protocol ${protocol.name}: ${error.message}`);
          results.errors++;
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error syncing protocol opportunities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update APY for all yield opportunities
   * @returns {Promise<Object>} - Update results
   */
  async updateAllApy() {
    try {
      const protocols = await Protocol.find({ active: true });
      
      const results = {
        updated: 0,
        errors: 0,
        protocols: []
      };
      
      for (const protocol of protocols) {
        try {
          const protocolResult = await this.updateProtocolApy(protocol._id);
          results.updated += protocolResult.updated;
          results.errors += protocolResult.errors;
          results.protocols.push({
            protocol: protocol.name,
            updated: protocolResult.updated,
            errors: protocolResult.errors
          });
        } catch (error) {
          logger.error(`Error updating APY for protocol ${protocol.name}: ${error.message}`);
          results.errors++;
          results.protocols.push({
            protocol: protocol.name,
            updated: 0,
            errors: 1,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error updating all APY: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update APY for a specific protocol
   * @param {string} protocolId - Protocol ID
   * @returns {Promise<Object>} - Update results
   */
  async updateProtocolApy(protocolId) {
    try {
      // Get protocol from database
      const protocol = await Protocol.findById(protocolId);
      
      if (!protocol) {
        throw new Error(`Protocol not found with ID: ${protocolId}`);
      }
      
      // Get adapter for protocol
      const adapter = ProtocolAdapterManager.getAdapterForProtocol(protocol);
      
      // Get all active opportunities for this protocol
      const opportunities = await YieldOpportunity.find({
        protocol: protocol._id,
        status: 'active'
      });
      
      const results = {
        updated: 0,
        errors: 0,
        opportunities: []
      };
      
      for (const opportunity of opportunities) {
        try {
          // Get APY data from adapter
          const apyData = await adapter.getApyData(opportunity);
          
          // Update opportunity APY
          const updated = await YieldOpportunity.updateApy(opportunity._id, apyData);
          
          results.updated++;
          results.opportunities.push({
            id: updated._id,
            name: updated.name,
            previousApy: opportunity.apy.current,
            newApy: apyData.current
          });
          
          // Notify about significant APY changes
          if (Math.abs(apyData.current - opportunity.apy.current) > 5) {
            // Notify users who have investments in this opportunity
            const investments = await Investment.find({
              opportunity: opportunity._id,
              status: 'active'
            });
            
            for (const investment of investments) {
              // Create notification for the user
              await notificationService.createNotification({
                user: investment.user,
                title: 'APY Change Alert',
                message: `The APY for your ${opportunity.name} investment has ${apyData.current > opportunity.apy.current ? 'increased' : 'decreased'} from ${opportunity.apy.current.toFixed(2)}% to ${apyData.current.toFixed(2)}%.`,
                type: 'apy_change',
                importance: 'medium',
                metadata: {
                  opportunityId: opportunity._id,
                  protocolId: protocol._id,
                  previousApy: opportunity.apy.current,
                  newApy: apyData.current,
                  investmentId: investment._id
                }
              });
            }
          }
        } catch (error) {
          logger.error(`Error updating APY for opportunity ${opportunity.name}: ${error.message}`);
          results.errors++;
          results.opportunities.push({
            id: opportunity._id,
            name: opportunity.name,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error updating protocol APY: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update TVL for all yield opportunities
   * @returns {Promise<Object>} - Update results
   */
  async updateAllTvl() {
    try {
      const protocols = await Protocol.find({ active: true });
      
      const results = {
        updated: 0,
        errors: 0,
        protocols: []
      };
      
      for (const protocol of protocols) {
        try {
          const protocolResult = await this.updateProtocolTvl(protocol._id);
          results.updated += protocolResult.updated;
          results.errors += protocolResult.errors;
          results.protocols.push({
            protocol: protocol.name,
            updated: protocolResult.updated,
            errors: protocolResult.errors
          });
        } catch (error) {
          logger.error(`Error updating TVL for protocol ${protocol.name}: ${error.message}`);
          results.errors++;
          results.protocols.push({
            protocol: protocol.name,
            updated: 0,
            errors: 1,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error updating all TVL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update TVL for a specific protocol
   * @param {string} protocolId - Protocol ID
   * @returns {Promise<Object>} - Update results
   */
  async updateProtocolTvl(protocolId) {
    try {
      // Get protocol from database
      const protocol = await Protocol.findById(protocolId);
      
      if (!protocol) {
        throw new Error(`Protocol not found with ID: ${protocolId}`);
      }
      
      // Get adapter for protocol
      const adapter = ProtocolAdapterManager.getAdapterForProtocol(protocol);
      
      // Get all active opportunities for this protocol
      const opportunities = await YieldOpportunity.find({
        protocol: protocol._id,
        status: 'active'
      });
      
      const results = {
        updated: 0,
        errors: 0,
        opportunities: []
      };
      
      let protocolTvl = 0;
      
      for (const opportunity of opportunities) {
        try {
          // Get TVL from adapter
          const tvl = await adapter.getTvl(opportunity);
          
          // Update opportunity TVL
          const updated = await YieldOpportunity.updateTvl(opportunity._id, tvl);
          
          protocolTvl += tvl;
          
          results.updated++;
          results.opportunities.push({
            id: updated._id,
            name: updated.name,
            previousTvl: opportunity.tvlUsd,
            newTvl: tvl
          });
        } catch (error) {
          logger.error(`Error updating TVL for opportunity ${opportunity.name}: ${error.message}`);
          results.errors++;
          results.opportunities.push({
            id: opportunity._id,
            name: opportunity.name,
            error: error.message
          });
        }
      }
      
      // Update protocol TVL
      await Protocol.updateTvl(protocol._id, protocolTvl);
      
      return results;
    } catch (error) {
      logger.error(`Error updating protocol TVL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process auto-harvest operations for eligible investments
   * @returns {Promise<Object>} - Harvest results
   */
  async processAutoHarvests() {
    try {
      // Get investments eligible for harvest
      const eligibleInvestments = await Investment.findEligibleForHarvest();
      
      const results = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        details: []
      };
      
      for (const investment of eligibleInvestments) {
        try {
          results.processed++;
          
          // Get adapter for protocol
          const adapter = ProtocolAdapterManager.getAdapterForProtocol(investment.protocol);
          
          // Check for claimable rewards
          const claimableRewards = await adapter.getClaimableRewards(investment);
          
          // Skip if no rewards or below threshold
          if (!claimableRewards || claimableRewards.length === 0) {
            // Update last attempt timestamp
            await Investment.findByIdAndUpdate(
              investment._id,
              { 'autoHarvest.lastAttempt': Date.now() },
              { new: true }
            );
            
            results.skipped++;
            results.details.push({
              investmentId: investment._id,
              status: 'skipped',
              reason: 'No claimable rewards'
            });
            
            continue;
          }
          
          // Check if rewards are above threshold
          const rewardAboveThreshold = claimableRewards.some(reward => {
            return BigInt(reward.amount) >= BigInt(investment.autoHarvest.threshold || '0');
          });
          
          if (!rewardAboveThreshold) {
            // Update last attempt timestamp
            await Investment.findByIdAndUpdate(
              investment._id,
              { 'autoHarvest.lastAttempt': Date.now() },
              { new: true }
            );
            
            results.skipped++;
            results.details.push({
              investmentId: investment._id,
              status: 'skipped',
              reason: 'Rewards below threshold'
            });
            
            continue;
          }
          
          // Perform harvest
          const harvestResult = await adapter.harvest(investment);
          
          if (harvestResult.status === 'success') {
            // Record harvest in investment
            const harvestData = {
              amount: claimableRewards[0].amount, // Using first reward for simplicity
              amountUsd: claimableRewards[0].amountUsd || 0,
              timestamp: Date.now(),
              transactionHash: harvestResult.transactionHash
            };
            
            await investment.recordHarvest(harvestData);
            
            // Create notification for the user
            await notificationService.createNotification({
              user: investment.user,
              title: 'Harvest Completed',
              message: `Your ${investment.opportunity.name} investment has been automatically harvested.`,
              type: 'harvest',
              importance: 'medium',
              metadata: {
                opportunityId: investment.opportunity._id,
                protocolId: investment.protocol._id,
                investmentId: investment._id,
                harvestData
              }
            });
            
            results.succeeded++;
            results.details.push({
              investmentId: investment._id,
              status: 'success',
              transactionHash: harvestResult.transactionHash
            });
          } else {
            // Update last attempt timestamp
            await Investment.findByIdAndUpdate(
              investment._id,
              { 'autoHarvest.lastAttempt': Date.now() },
              { new: true }
            );
            
            results.failed++;
            results.details.push({
              investmentId: investment._id,
              status: 'failed',
              reason: harvestResult.message || 'Unknown error'
            });
          }
        } catch (error) {
          logger.error(`Error processing auto-harvest for investment ${investment._id}: ${error.message}`);
          
          // Update last attempt timestamp to prevent continuous retries
          await Investment.findByIdAndUpdate(
            investment._id,
            { 'autoHarvest.lastAttempt': Date.now() },
            { new: true }
          );
          
          results.failed++;
          results.details.push({
            investmentId: investment._id,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing auto-harvests: ${error.message}`);
      throw error;
    }
  }
}

// Create and export a singleton instance
const yieldDataService = new YieldDataService();
module.exports = yieldDataService;
