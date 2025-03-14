const logger = require('../config/logger');
const YieldOpportunity = require('../models/YieldOpportunity');
const Protocol = require('../models/Protocol');

/**
 * APY Calculation Service
 * Provides utilities for calculating and updating APY for yield opportunities
 */
class ApyCalculationService {
  /**
   * Calculate APY based on periodic rate
   * @param {number} rate - Rate per period (e.g., daily rate)
   * @param {number} periods - Number of periods per year (e.g., 365 for daily)
   * @returns {number} - Annual Percentage Yield
   */
  static calculateApy(rate, periods = 365) {
    try {
      // APY = (1 + rate)^periods - 1
      return (Math.pow(1 + rate, periods) - 1) * 100;
    } catch (error) {
      logger.error(`Error calculating APY: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate APY from two balances and the time between them
   * @param {string} initialBalance - Initial balance as a string (BigNumber)
   * @param {string} finalBalance - Final balance as a string (BigNumber)
   * @param {number} timeElapsedMs - Time elapsed in milliseconds
   * @returns {number} - Annual Percentage Yield
   */
  static calculateApyFromBalances(initialBalance, finalBalance, timeElapsedMs) {
    try {
      const initialBN = BigInt(initialBalance);
      const finalBN = BigInt(finalBalance);
      
      if (initialBN === 0n || finalBN === 0n) {
        return 0;
      }
      
      // Convert to decimal for calculation
      const initial = Number(initialBN);
      const final = Number(finalBN);
      
      // Calculate the rate for the time period
      const rate = (final - initial) / initial;
      
      // Calculate the time in years
      const timeInYears = timeElapsedMs / (1000 * 60 * 60 * 24 * 365);
      
      // Calculate APY using the compound interest formula
      // APY = (1 + rate)^(1/timeInYears) - 1
      return (Math.pow(1 + rate, 1 / timeInYears) - 1) * 100;
    } catch (error) {
      logger.error(`Error calculating APY from balances: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate APY from daily rewards
   * @param {string} principalAmount - Principal amount as a string (BigNumber)
   * @param {string} dailyReward - Daily reward amount as a string (BigNumber)
   * @returns {number} - Annual Percentage Yield
   */
  static calculateApyFromDailyReward(principalAmount, dailyReward) {
    try {
      const principalBN = BigInt(principalAmount);
      const dailyRewardBN = BigInt(dailyReward);
      
      if (principalBN === 0n) {
        return 0;
      }
      
      // Calculate daily rate
      const dailyRate = Number(dailyRewardBN) / Number(principalBN);
      
      // Calculate APY using compound interest formula for daily compounding
      return this.calculateApy(dailyRate, 365);
    } catch (error) {
      logger.error(`Error calculating APY from daily reward: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate simple APR (non-compounding)
   * @param {string} principalAmount - Principal amount as a string (BigNumber)
   * @param {string} yearlyReward - Yearly reward amount as a string (BigNumber)
   * @returns {number} - Annual Percentage Rate
   */
  static calculateApr(principalAmount, yearlyReward) {
    try {
      const principalBN = BigInt(principalAmount);
      const yearlyRewardBN = BigInt(yearlyReward);
      
      if (principalBN === 0n) {
        return 0;
      }
      
      // Calculate APR as yearly reward / principal
      return (Number(yearlyRewardBN) / Number(principalBN)) * 100;
    } catch (error) {
      logger.error(`Error calculating APR: ${error.message}`);
      return 0;
    }
  }

  /**
   * Convert APR to APY based on compounding frequency
   * @param {number} apr - Annual Percentage Rate
   * @param {number} compoundingsPerYear - Number of compounding periods per year
   * @returns {number} - Annual Percentage Yield
   */
  static aprToApy(apr, compoundingsPerYear = 365) {
    try {
      // Convert APR to decimal
      const decimalApr = apr / 100;
      
      // Calculate APY using the compound interest formula
      // APY = (1 + APR/n)^n - 1
      return (Math.pow(1 + decimalApr / compoundingsPerYear, compoundingsPerYear) - 1) * 100;
    } catch (error) {
      logger.error(`Error converting APR to APY: ${error.message}`);
      return apr; // Return the input APR if calculation fails
    }
  }

  /**
   * Calculate APY for lending protocols
   * @param {number} supplyRate - Annual supply rate (in decimal)
   * @param {number} utilizationRate - Utilization rate (in decimal)
   * @param {number} compoundingsPerYear - Number of compounding periods per year
   * @returns {number} - Annual Percentage Yield
   */
  static calculateLendingApy(supplyRate, utilizationRate = 0.8, compoundingsPerYear = 365) {
    try {
      // Lending APY depends on supply rate and utilization
      const effectiveRate = supplyRate * utilizationRate;
      return this.aprToApy(effectiveRate * 100, compoundingsPerYear);
    } catch (error) {
      logger.error(`Error calculating lending APY: ${error.message}`);
      return supplyRate * 100; // Return the supply rate as APR if calculation fails
    }
  }

  /**
   * Calculate APY for liquidity providing
   * @param {number} feeApr - Annual fee APR
   * @param {number} tokenApr - Token rewards APR
   * @param {number} compoundingsPerYear - Number of compounding periods per year
   * @returns {number} - Annual Percentage Yield
   */
  static calculateLpApy(feeApr, tokenApr = 0, compoundingsPerYear = 365) {
    try {
      // LP APY combines fees and token rewards
      const totalApr = feeApr + tokenApr;
      return this.aprToApy(totalApr, compoundingsPerYear);
    } catch (error) {
      logger.error(`Error calculating LP APY: ${error.message}`);
      return feeApr + tokenApr; // Return the combined APR if calculation fails
    }
  }

  /**
   * Calculate average APY for a protocol
   * @param {string} protocolId - Protocol ID
   * @returns {Promise<number>} - Average APY
   */
  static async calculateProtocolAvgApy(protocolId) {
    try {
      const opportunities = await YieldOpportunity.find({
        protocol: protocolId,
        status: 'active'
      });
      
      if (opportunities.length === 0) {
        return 0;
      }
      
      const totalApy = opportunities.reduce((sum, opp) => sum + opp.apy.current, 0);
      return totalApy / opportunities.length;
    } catch (error) {
      logger.error(`Error calculating protocol average APY: ${error.message}`);
      return 0;
    }
  }

  /**
   * Update APY for a yield opportunity
   * @param {string} opportunityId - Yield opportunity ID
   * @param {Object} apyData - APY data object
   * @returns {Promise<Object>} - Updated yield opportunity
   */
  static async updateOpportunityApy(opportunityId, apyData) {
    try {
      const opportunity = await YieldOpportunity.updateApy(opportunityId, apyData);
      
      // Notify about major APY changes (>10% difference)
      const previousApy = opportunity.apy.current;
      const newApy = apyData.current;
      
      if (Math.abs(newApy - previousApy) > 10) {
        logger.info(`Major APY change detected for ${opportunity.name}: ${previousApy}% -> ${newApy}%`);
        
        // Here we could add notifications for users with investments in this opportunity
      }
      
      return opportunity;
    } catch (error) {
      logger.error(`Error updating opportunity APY: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update APY for all yield opportunities of a protocol
   * @param {string} protocolId - Protocol ID
   * @param {Function} apyFetcher - Function that fetches APY data for each opportunity
   * @returns {Promise<Array>} - Updated opportunities
   */
  static async updateProtocolOpportunities(protocolId, apyFetcher) {
    try {
      const opportunities = await YieldOpportunity.find({
        protocol: protocolId,
        status: 'active'
      });
      
      const updatedOpportunities = [];
      
      for (const opportunity of opportunities) {
        try {
          // Fetch APY data using the provided fetcher function
          const apyData = await apyFetcher(opportunity);
          
          // Update the opportunity
          const updated = await this.updateOpportunityApy(opportunity._id, apyData);
          updatedOpportunities.push(updated);
        } catch (error) {
          logger.error(`Error updating APY for opportunity ${opportunity._id}: ${error.message}`);
          // Continue with next opportunity
        }
      }
      
      // Update protocol's average APY
      const avgApy = await this.calculateProtocolAvgApy(protocolId);
      logger.info(`Updated average APY for protocol ${protocolId}: ${avgApy}%`);
      
      return updatedOpportunities;
    } catch (error) {
      logger.error(`Error updating protocol opportunities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate historical APY statistics
   * @param {Array} apyHistory - Array of APY data points with timestamps
   * @param {number} days - Number of days to consider
   * @returns {Object} - APY statistics (min, max, mean)
   */
  static calculateApyStats(apyHistory, days = 7) {
    try {
      // Filter history for the specified time period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const relevantHistory = apyHistory.filter(item => new Date(item.timestamp) >= cutoffDate);
      
      if (relevantHistory.length === 0) {
        return {
          min: 0,
          max: 0,
          mean: 0
        };
      }
      
      // Calculate statistics
      const values = relevantHistory.map(item => item.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        min,
        max,
        mean
      };
    } catch (error) {
      logger.error(`Error calculating APY statistics: ${error.message}`);
      return {
        min: 0,
        max: 0,
        mean: 0
      };
    }
  }

  /**
   * Calculate weighted average APY based on TVL
   * @param {Array} opportunities - Array of yield opportunities with APY and TVL
   * @returns {number} - Weighted average APY
   */
  static calculateWeightedAverageApy(opportunities) {
    try {
      const totalTvl = opportunities.reduce((sum, opp) => sum + opp.tvlUsd, 0);
      
      if (totalTvl === 0) {
        // If no TVL, calculate simple average
        const totalApy = opportunities.reduce((sum, opp) => sum + opp.apy.current, 0);
        return totalApy / opportunities.length;
      }
      
      // Calculate weighted average based on TVL
      const weightedSum = opportunities.reduce((sum, opp) => {
        const weight = opp.tvlUsd / totalTvl;
        return sum + (opp.apy.current * weight);
      }, 0);
      
      return weightedSum;
    } catch (error) {
      logger.error(`Error calculating weighted average APY: ${error.message}`);
      return 0;
    }
  }
}

module.exports = ApyCalculationService;
