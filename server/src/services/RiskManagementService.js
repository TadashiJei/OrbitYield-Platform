/**
 * Risk Management Service
 * Provides advanced risk assessment, monitoring, and management capabilities for the OrbitYield platform
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');
const Protocol = require('../models/Protocol');
const YieldOpportunity = require('../models/YieldOpportunity');
const User = require('../models/User');
const Strategy = require('../models/Strategy');
const Notification = require('../models/Notification');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

/**
 * Risk Management Service Class
 * Implements comprehensive risk assessment and management features:
 * - Protocol and opportunity risk scoring
 * - Risk-based allocation strategies
 * - Risk alerts and notifications
 * - Historical risk data analysis
 */
class RiskManagementService {
  constructor() {
    this.riskFactors = {
      tvlWeight: 0.25,
      auditWeight: 0.20,
      ageWeight: 0.15,
      volatilityWeight: 0.15,
      complexityWeight: 0.15,
      communityWeight: 0.10
    };
    
    this.riskThresholds = {
      low: 30,
      medium: 60,
      high: 85
    };
    
    this.riskMetrics = {
      protocols: new Map(), // Cache for protocol risk metrics
      opportunities: new Map() // Cache for opportunity risk metrics
    };
    
    // Initialize ML model configs
    this.mlConfig = {
      enabled: process.env.RISK_ML_ENABLED === 'true',
      endpoint: process.env.RISK_ML_ENDPOINT || 'https://api.orbitai.io/risk-prediction',
      apiKey: process.env.RISK_ML_API_KEY || '',
      version: process.env.RISK_ML_MODEL_VERSION || 'v1',
      features: {
        volatilityPrediction: process.env.RISK_ML_VOLATILITY_ENABLED === 'true',
        smartRiskScoring: process.env.RISK_ML_SMART_SCORING === 'true',
        anomalyDetection: process.env.RISK_ML_ANOMALY_DETECTION === 'true'
      },
      cacheTime: 3600000 // 1 hour cache for ML predictions
    };
  }

  /**
   * Calculate comprehensive risk score for a protocol
   * @param {Object} protocol - Protocol object
   * @returns {Object} Risk score and breakdown
   */
  async calculateProtocolRiskScore(protocol) {
    try {
      // Check cache first
      if (this.riskMetrics.protocols.has(protocol._id.toString())) {
        const cachedScore = this.riskMetrics.protocols.get(protocol._id.toString());
        if (Date.now() - cachedScore.timestamp < 3600000) { // Valid for 1 hour
          return cachedScore;
        }
      }
      
      // Base metrics
      const tvlScore = this._calculateTvlScore(protocol.tvlUsd);
      const auditScore = this._calculateAuditScore(protocol.audited, protocol.auditLinks);
      const ageScore = await this._calculateProtocolAgeScore(protocol);
      const volatilityScore = await this._calculateVolatilityScore(protocol);
      const complexityScore = this._calculateComplexityScore(protocol);
      const communityScore = await this._calculateCommunityScore(protocol);
      
      // Weighted score calculation
      const weightedScore = 
        (tvlScore * this.riskFactors.tvlWeight) +
        (auditScore * this.riskFactors.auditWeight) +
        (ageScore * this.riskFactors.ageWeight) +
        (volatilityScore * this.riskFactors.volatilityWeight) +
        (complexityScore * this.riskFactors.complexityWeight) +
        (communityScore * this.riskFactors.communityWeight);
      
      // Normalize to 0-100 scale
      const normalizedScore = Math.min(Math.max(0, weightedScore), 100);
      
      // Determine risk level
      let riskLevel;
      if (normalizedScore <= this.riskThresholds.low) {
        riskLevel = 'low';
      } else if (normalizedScore <= this.riskThresholds.medium) {
        riskLevel = 'medium';
      } else if (normalizedScore <= this.riskThresholds.high) {
        riskLevel = 'high';
      } else {
        riskLevel = 'very_high';
      }
      
      // Create risk score object
      const riskScore = {
        protocol: protocol._id,
        protocolName: protocol.name,
        overallScore: normalizedScore,
        riskLevel,
        breakdown: {
          tvl: {
            score: tvlScore,
            weight: this.riskFactors.tvlWeight
          },
          audit: {
            score: auditScore,
            weight: this.riskFactors.auditWeight
          },
          age: {
            score: ageScore,
            weight: this.riskFactors.ageWeight
          },
          volatility: {
            score: volatilityScore,
            weight: this.riskFactors.volatilityWeight
          },
          complexity: {
            score: complexityScore,
            weight: this.riskFactors.complexityWeight
          },
          community: {
            score: communityScore,
            weight: this.riskFactors.communityWeight
          }
        },
        timestamp: Date.now()
      };
      
      // Cache the score
      this.riskMetrics.protocols.set(protocol._id.toString(), riskScore);
      
      // If enabled, enhance with ML model prediction
      if (this.mlConfig.enabled) {
        const mlEnhancedScore = await this._enhanceScoreWithML(riskScore, protocol);
        return mlEnhancedScore;
      }
      
      return riskScore;
    } catch (error) {
      logger.error(`Error calculating protocol risk score: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate TVL-based risk score
   * Higher TVL = Lower risk (inverse relationship)
   * @param {Number} tvlUsd - TVL in USD
   * @returns {Number} Risk score (0-100)
   */
  _calculateTvlScore(tvlUsd) {
    if (tvlUsd >= 1000000000) { // $1B+ TVL (very low risk)
      return 10;
    } else if (tvlUsd >= 100000000) { // $100M+ TVL (low risk)
      return 30;
    } else if (tvlUsd >= 10000000) { // $10M+ TVL (medium risk)
      return 50;
    } else if (tvlUsd >= 1000000) { // $1M+ TVL (high risk)
      return 80;
    } else { // Under $1M TVL (very high risk)
      return 95;
    }
  }
  
  /**
   * Calculate audit-based risk score
   * More audits = Lower risk
   * @param {Boolean} audited - Whether protocol is audited
   * @param {Array} auditLinks - Links to audit reports
   * @returns {Number} Risk score (0-100)
   */
  _calculateAuditScore(audited, auditLinks) {
    if (!audited) {
      return 100; // Not audited = maximum risk
    }
    
    const auditCount = auditLinks ? auditLinks.length : 0;
    
    if (auditCount >= 3) {
      return 15; // 3+ audits = very low risk
    } else if (auditCount === 2) {
      return 30; // 2 audits = low risk
    } else if (auditCount === 1) {
      return 50; // 1 audit = medium risk
    } else {
      return 80; // Claims to be audited but no links = high risk
    }
  }
  
  /**
   * Calculate protocol age score
   * Older protocols tend to be less risky
   * @param {Object} protocol - Protocol object
   * @returns {Number} Risk score (0-100)
   */
  async _calculateProtocolAgeScore(protocol) {
    try {
      // Use creation timestamp if available
      const createdAt = protocol.createdAt || new Date();
      const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (ageInDays >= 365 * 3) { // 3+ years (very low risk)
        return 15;
      } else if (ageInDays >= 365) { // 1+ year (low risk)
        return 35;
      } else if (ageInDays >= 180) { // 6+ months (medium risk)
        return 60;
      } else if (ageInDays >= 30) { // 1+ month (high risk)
        return 80;
      } else { // Under 1 month (very high risk)
        return 95;
      }
    } catch (error) {
      logger.error(`Error calculating protocol age score: ${error.message}`);
      return 50; // Default to medium risk on error
    }
  }
  
  /**
   * Calculate volatility score based on historical yield data
   * Higher volatility = Higher risk
   * @param {Object} protocol - Protocol object
   * @returns {Number} Risk score (0-100)
   */
  async _calculateVolatilityScore(protocol) {
    try {
      // Fetch historical yield opportunities for this protocol
      const opportunities = await YieldOpportunity.find({ protocol: protocol._id });
      
      if (!opportunities || opportunities.length === 0) {
        return 50; // No data available, default to medium risk
      }
      
      // Get historical APY data for these opportunities
      const apyHistories = [];
      
      for (const opportunity of opportunities) {
        // Check if we have historical metrics
        if (opportunity.metrics && opportunity.metrics.apyHistory && opportunity.metrics.apyHistory.length > 0) {
          apyHistories.push(opportunity.metrics.apyHistory);
        }
      }
      
      // If no historical data available, estimate based on protocol category
      if (apyHistories.length === 0) {
        // Assign estimated volatility based on protocol category
        switch (protocol.category) {
          case 'lending':
            return 30; // Lending protocols usually have low volatility
          case 'liquid_staking':
            return 25; // Staking has very low volatility
          case 'yield_aggregator':
            return 60; // Yield aggregators can have medium-high volatility
          case 'dex':
            return 55; // DEXes have medium volatility
          case 'derivatives':
            return 80; // Derivatives have high volatility
          default:
            return 50; // Default to medium
        }
      }
      
      // Calculate the coefficient of variation for each opportunity
      const volatilities = [];
      
      for (const history of apyHistories) {
        const values = history.map(item => item.value);
        
        // Need at least 2 data points to calculate standard deviation
        if (values.length < 2) {
          continue;
        }
        
        // Calculate mean
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Calculate standard deviation
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate coefficient of variation (normalized volatility)
        const cv = mean !== 0 ? stdDev / mean : stdDev;
        volatilities.push(cv);
      }
      
      // If we still couldn't calculate volatility, return medium risk
      if (volatilities.length === 0) {
        return 50;
      }
      
      // Calculate average volatility across all opportunities
      const avgVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
      
      // Map coefficient of variation to risk score (0-100)
      // CV of 0 = very stable = low risk
      // CV of 1+ = highly volatile = high risk
      if (avgVolatility < 0.05) {
        return 15; // Very low volatility
      } else if (avgVolatility < 0.15) {
        return 30; // Low volatility
      } else if (avgVolatility < 0.30) {
        return 50; // Medium volatility
      } else if (avgVolatility < 0.5) {
        return 75; // High volatility
      } else {
        return 90; // Very high volatility
      }
    } catch (error) {
      logger.error(`Error calculating volatility score: ${error.message}`);
      return 50; // Default to medium risk on error
    }
  }
  
  /**
   * Calculate complexity score
   * More complex protocols tend to be riskier
   * @param {Object} protocol - Protocol object
   * @returns {Number} Risk score (0-100)
   */
  _calculateComplexityScore(protocol) {
    // Assign complexity score based on protocol category
    switch (protocol.category) {
      case 'lending':
        return 30; // Simple lending = low risk
      case 'liquid_staking':
        return 40; // Liquid staking = low-medium risk
      case 'dex':
        return 50; // DEX = medium risk
      case 'yield_aggregator':
        return 65; // Yield aggregator = medium-high risk
      case 'derivatives':
        return 80; // Derivatives = high risk
      case 'cdp':
        return 75; // CDP = high risk
      case 'other':
      default:
        return 70; // Other/unknown = high risk
    }
  }
  
  /**
   * Calculate community score
   * Larger, more active communities indicate lower risk
   * @param {Object} protocol - Protocol object
   * @returns {Number} Risk score (0-100)
   */
  async _calculateCommunityScore(protocol) {
    try {
      // Use GitHub stats if available
      if (protocol.socialStats && protocol.socialStats.github) {
        const { stars, forks, contributors, issuesResolved, lastCommitDays } = protocol.socialStats.github;
        
        // Calculate GitHub score component (0-50 points)
        let githubScore = 0;
        
        // Stars (up to 15 points)
        if (stars >= 5000) githubScore += 15;
        else if (stars >= 2000) githubScore += 12;
        else if (stars >= 1000) githubScore += 9;
        else if (stars >= 500) githubScore += 7;
        else if (stars >= 100) githubScore += 5;
        else if (stars > 0) githubScore += 3;
        
        // Contributors (up to 10 points)
        if (contributors >= 50) githubScore += 10;
        else if (contributors >= 25) githubScore += 8;
        else if (contributors >= 10) githubScore += 6;
        else if (contributors >= 5) githubScore += 4;
        else if (contributors > 0) githubScore += 2;
        
        // Recent activity (up to 10 points) - lower is better
        if (lastCommitDays <= 1) githubScore += 10;
        else if (lastCommitDays <= 7) githubScore += 8;
        else if (lastCommitDays <= 30) githubScore += 5;
        else if (lastCommitDays <= 90) githubScore += 3;
        else githubScore += 0;
        
        // Forks (up to 5 points)
        if (forks >= 1000) githubScore += 5;
        else if (forks >= 500) githubScore += 4;
        else if (forks >= 100) githubScore += 3;
        else if (forks >= 50) githubScore += 2;
        else if (forks > 0) githubScore += 1;
        
        // Issue resolution (up to 10 points)
        if (issuesResolved >= 0.9) githubScore += 10; // 90%+ issues resolved
        else if (issuesResolved >= 0.8) githubScore += 8;
        else if (issuesResolved >= 0.6) githubScore += 5;
        else if (issuesResolved >= 0.4) githubScore += 3;
        else githubScore += 0;
      }
      
      // Use social media stats if available
      let socialScore = 0;
      if (protocol.socialStats && protocol.socialStats.social) {
        const { twitter, discord, telegram, totalFollowers } = protocol.socialStats.social;
        
        // Calculate social score component (0-50 points)
        // Total followers (up to 30 points)
        if (totalFollowers >= 500000) socialScore += 30;
        else if (totalFollowers >= 250000) socialScore += 25;
        else if (totalFollowers >= 100000) socialScore += 20;
        else if (totalFollowers >= 50000) socialScore += 15;
        else if (totalFollowers >= 10000) socialScore += 10;
        else if (totalFollowers > 0) socialScore += 5;
        
        // Platform diversity (up to 20 points)
        let activeChannels = 0;
        if (twitter.followers > 5000) activeChannels++;
        if (discord.members > 5000) activeChannels++;
        if (telegram.members > 5000) activeChannels++;
        
        socialScore += activeChannels * 6; // 6 points per active channel
      }
      
      // If we have both GitHub and social scores, use their combined score
      if (protocol.socialStats && protocol.socialStats.github && protocol.socialStats.social) {
        // Calculate weighted average
        const combinedScore = (githubScore * 0.5) + (socialScore * 0.5);
        // Invert for risk score (higher community score = lower risk)
        return 100 - combinedScore;
      }
      
      // If we don't have real stats, estimate based on TVL as a proxy
      if (protocol.tvlUsd >= 500000000) { // $500M+ TVL (likely strong community)
        return 20;
      } else if (protocol.tvlUsd >= 50000000) { // $50M+ TVL
        return 40;
      } else if (protocol.tvlUsd >= 5000000) { // $5M+ TVL
        return 60;
      } else { // Under $5M TVL (likely smaller community)
        return 80;
      }
    } catch (error) {
      logger.error(`Error calculating community score: ${error.message}`);
      return 50; // Default to medium risk on error
    }
  }
  
  /**
   * Enhance risk score with ML model prediction
   * @param {Object} baseScore - Base risk score object
   * @param {Object} protocol - Protocol object
   * @returns {Object} Enhanced risk score
   */
  async _enhanceScoreWithML(baseScore, protocol) {
    if (!this.mlConfig.enabled) {
      return baseScore;
    }
    
    try {
      // Prepare features for ML model
      const features = {
        tvl: protocol.tvlUsd,
        audited: protocol.audited ? 1 : 0,
        auditCount: protocol.auditLinks ? protocol.auditLinks.length : 0,
        ageInDays: (Date.now() - protocol.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        category: protocol.category,
        baseRiskScore: baseScore.overallScore
      };
      
      // Call ML API for prediction
      const response = await axios.post(this.mlConfig.endpoint, {
        features,
        apiKey: this.mlConfig.apiKey
      });
      
      if (response.data && response.data.predictedRiskScore) {
        // Blend ML prediction with base score (70% ML, 30% base)
        const blendedScore = (response.data.predictedRiskScore * 0.7) + (baseScore.overallScore * 0.3);
        const normalizedScore = Math.min(Math.max(0, blendedScore), 100);
        
        // Determine risk level from blended score
        let riskLevel;
        if (normalizedScore <= this.riskThresholds.low) {
          riskLevel = 'low';
        } else if (normalizedScore <= this.riskThresholds.medium) {
          riskLevel = 'medium';
        } else if (normalizedScore <= this.riskThresholds.high) {
          riskLevel = 'high';
        } else {
          riskLevel = 'very_high';
        }
        
        return {
          ...baseScore,
          overallScore: normalizedScore,
          riskLevel,
          mlEnhanced: true,
          mlConfidence: response.data.confidence || 0.7
        };
      }
      
      return baseScore;
    } catch (error) {
      logger.error(`Error enhancing score with ML: ${error.message}`);
      return baseScore; // Fall back to base score on error
    }
  }
  
  /**
   * Calculate risk score for a yield opportunity
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Object} Risk score and breakdown
   */
  async calculateOpportunityRiskScore(opportunity) {
    try {
      // Check cache first
      if (this.riskMetrics.opportunities.has(opportunity._id.toString())) {
        const cachedScore = this.riskMetrics.opportunities.get(opportunity._id.toString());
        if (Date.now() - cachedScore.timestamp < 3600000) { // Valid for 1 hour
          return cachedScore;
        }
      }
      
      // First, get the protocol risk score
      const protocol = await Protocol.findById(opportunity.protocol);
      if (!protocol) {
        throw new Error(`Protocol not found for opportunity: ${opportunity._id}`);
      }
      
      const protocolRiskScore = await this.calculateProtocolRiskScore(protocol);
      
      // Calculate additional opportunity-specific risk factors
      const yieldVolatilityScore = await this._calculateYieldVolatility(opportunity);
      const impermanentLossScore = this._calculateImpermanentLossRisk(opportunity);
      const liquidityScore = this._calculateLiquidityRisk(opportunity);
      
      // Combine protocol risk (70%) with opportunity-specific risk (30%)
      const opportunitySpecificScore = (
        (yieldVolatilityScore * 0.4) +
        (impermanentLossScore * 0.3) +
        (liquidityScore * 0.3)
      );
      
      const combinedScore = (protocolRiskScore.overallScore * 0.7) + (opportunitySpecificScore * 0.3);
      const normalizedScore = Math.min(Math.max(0, combinedScore), 100);
      
      // Determine risk level
      let riskLevel;
      if (normalizedScore <= this.riskThresholds.low) {
        riskLevel = 'low';
      } else if (normalizedScore <= this.riskThresholds.medium) {
        riskLevel = 'medium';
      } else if (normalizedScore <= this.riskThresholds.high) {
        riskLevel = 'high';
      } else {
        riskLevel = 'very_high';
      }
      
      // Create risk score object
      const riskScore = {
        opportunity: opportunity._id,
        opportunityName: opportunity.name,
        protocol: protocol._id,
        protocolName: protocol.name,
        overallScore: normalizedScore,
        riskLevel,
        breakdown: {
          protocol: {
            score: protocolRiskScore.overallScore,
            weight: 0.7,
            details: protocolRiskScore.breakdown
          },
          yieldVolatility: {
            score: yieldVolatilityScore,
            weight: 0.12 // 40% of 30%
          },
          impermanentLoss: {
            score: impermanentLossScore,
            weight: 0.09 // 30% of 30%
          },
          liquidity: {
            score: liquidityScore,
            weight: 0.09 // 30% of 30%
          }
        },
        timestamp: Date.now()
      };
      
      // Cache the score
      this.riskMetrics.opportunities.set(opportunity._id.toString(), riskScore);
      
      return riskScore;
    } catch (error) {
      logger.error(`Error calculating opportunity risk score: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate yield volatility risk
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Number} Risk score (0-100)
   */
  async _calculateYieldVolatility(opportunity) {
    try {
      // TODO: Implement historical yield volatility calculation
      // For now, use APY as a proxy (higher APY often correlates with higher volatility)
      const apy = opportunity.metrics?.apy || 0;
      
      if (apy <= 3) { // Very low yield (<= 3%)
        return 10;
      } else if (apy <= 8) { // Low yield (<= 8%)
        return 30;
      } else if (apy <= 15) { // Medium yield (<= 15%)
        return 50;
      } else if (apy <= 30) { // High yield (<= 30%)
        return 75;
      } else { // Very high yield (> 30%)
        return 90;
      }
    } catch (error) {
      logger.error(`Error calculating yield volatility: ${error.message}`);
      return 50; // Default to medium risk on error
    }
  }
  
  /**
   * Calculate impermanent loss risk for LP positions
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Number} Risk score (0-100)
   */
  _calculateImpermanentLossRisk(opportunity) {
    try {
      // Only applicable to LP positions
      if (opportunity.type !== 'lp') {
        return 0;
      }
      
      // TODO: Implement proper impermanent loss calculation
      // For now, use a placeholder based on asset types
      const assets = opportunity.assets || [];
      
      if (assets.length < 2) {
        return 50; // Default for unknown LP composition
      }
      
      // Check if stablecoin pair
      const isStablecoinPair = assets.every(asset => 
        asset.toLowerCase().includes('usd') || 
        asset.toLowerCase().includes('usdt') || 
        asset.toLowerCase().includes('usdc') || 
        asset.toLowerCase().includes('dai')
      );
      
      if (isStablecoinPair) {
        return 20; // Low risk for stablecoin pairs
      }
      
      // Check if contains volatile assets
      const hasVolatileAssets = assets.some(asset =>
        asset.toLowerCase().includes('etf') ||
        asset.toLowerCase().includes('ape') ||
        asset.toLowerCase().includes('meme')
      );
      
      if (hasVolatileAssets) {
        return 90; // High risk for highly volatile assets
      }
      
      // Default medium-high risk for most token pairs
      return 70;
    } catch (error) {
      logger.error(`Error calculating impermanent loss risk: ${error.message}`);
      return 60; // Default to medium-high risk on error
    }
  }
  
  /**
   * Calculate liquidity risk
   * @param {Object} opportunity - Yield opportunity object
   * @returns {Number} Risk score (0-100)
   */
  _calculateLiquidityRisk(opportunity) {
    try {
      // Use total liquidity or TVL as a proxy
      const liquidity = opportunity.metrics?.liquidity || opportunity.metrics?.tvl || 0;
      
      if (liquidity >= 10000000) { // $10M+ (very low risk)
        return 15;
      } else if (liquidity >= 1000000) { // $1M+ (low risk)
        return 35;
      } else if (liquidity >= 100000) { // $100K+ (medium risk)
        return 60;
      } else if (liquidity >= 10000) { // $10K+ (high risk)
        return 80;
      } else { // Under $10K (very high risk)
        return 95;
      }
    } catch (error) {
      logger.error(`Error calculating liquidity risk: ${error.message}`);
      return 60; // Default to medium-high risk on error
    }
  }
  
  /**
   * Generate risk-based allocation strategy
   * @param {Object} user - User object or user risk preferences
   * @param {Array} opportunities - Array of yield opportunities
   * @param {Object} options - Additional options (amount, duration, etc.)
   * @returns {Object} Recommended allocation strategy
   */
  async generateRiskBasedAllocation(user, opportunities, options = {}) {
    try {
      // Get user risk preferences
      const riskPreference = user.preferences?.riskLevel || 'medium';
      const allocationAmount = options.amount || 10000; // Default $10K
      
      // Calculate risk scores for all opportunities
      const opportunitiesWithRisk = await Promise.all(
        opportunities.map(async (opportunity) => {
          const riskScore = await this.calculateOpportunityRiskScore(opportunity);
          return {
            ...opportunity,
            riskScore
          };
        })
      );
      
      // Filter opportunities based on user risk preference
      let filteredOpportunities;
      if (riskPreference === 'low') {
        filteredOpportunities = opportunitiesWithRisk.filter(o => 
          o.riskScore.riskLevel === 'low'
        );
      } else if (riskPreference === 'medium') {
        filteredOpportunities = opportunitiesWithRisk.filter(o => 
          o.riskScore.riskLevel === 'low' || o.riskScore.riskLevel === 'medium'
        );
      } else { // high
        filteredOpportunities = opportunitiesWithRisk; // all opportunities
      }
      
      // If no opportunities match the criteria, return empty allocation
      if (filteredOpportunities.length === 0) {
        return {
          status: 'no_match',
          message: 'No opportunities match the risk criteria',
          allocation: []
        };
      }
      
      // Sort by a combination of risk and yield
      filteredOpportunities.sort((a, b) => {
        // Calculate risk-adjusted return
        const aRiskAdjReturn = (a.metrics?.apy || 0) / (a.riskScore.overallScore || 1);
        const bRiskAdjReturn = (b.metrics?.apy || 0) / (b.riskScore.overallScore || 1);
        return bRiskAdjReturn - aRiskAdjReturn; // Higher risk-adjusted return first
      });
      
      // Allocate based on risk preference
      let allocation;
      if (riskPreference === 'low') {
        // Conservative allocation - more diversified, favor lower risk
        allocation = this._generateConservativeAllocation(filteredOpportunities, allocationAmount);
      } else if (riskPreference === 'medium') {
        // Balanced allocation - mix of risk and reward
        allocation = this._generateBalancedAllocation(filteredOpportunities, allocationAmount);
      } else {
        // Aggressive allocation - concentrate in highest return opportunities
        allocation = this._generateAggressiveAllocation(filteredOpportunities, allocationAmount);
      }
      
      return {
        status: 'success',
        userRiskPreference: riskPreference,
        totalAmount: allocationAmount,
        allocation,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Error generating risk-based allocation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate conservative allocation strategy (low risk)
   * - More diversified (up to 8 opportunities)
   * - Favor lower risk opportunities
   * - More even distribution
   * @param {Array} opportunities - Filtered opportunities with risk scores
   * @param {Number} totalAmount - Total amount to allocate
   * @returns {Array} Allocation recommendations
   */
  _generateConservativeAllocation(opportunities, totalAmount) {
    // Take top 8 opportunities max for diversification
    const topOpportunities = opportunities.slice(0, 8);
    
    // Ensure we have at least some opportunities
    if (topOpportunities.length === 0) {
      return [];
    }
    
    // Calculate risk-weighted allocation
    // Lower risk gets higher allocation
    const riskWeights = topOpportunities.map(o => 1 / (o.riskScore.overallScore || 1));
    const totalWeight = riskWeights.reduce((sum, weight) => sum + weight, 0);
    
    // Calculate allocation percentages
    const percentages = riskWeights.map(weight => weight / totalWeight);
    
    // Generate allocation with minimum thresholds
    return topOpportunities.map((opportunity, index) => {
      const basePercentage = percentages[index];
      // Ensure minimum 5% allocation for diversification
      const adjustedPercentage = Math.max(basePercentage, 0.05);
      const amount = Math.round(totalAmount * adjustedPercentage * 100) / 100;
      
      return {
        opportunity: opportunity._id,
        name: opportunity.name,
        protocol: opportunity.protocol,
        protocolName: opportunity.protocolName || '',
        riskLevel: opportunity.riskScore.riskLevel,
        riskScore: opportunity.riskScore.overallScore,
        percentage: Math.round(adjustedPercentage * 10000) / 100, // Round to 2 decimal places
        amount,
        projectedYield: (opportunity.metrics?.apy || 0) * amount / 100
      };
    }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
  }

  /**
   * Generate balanced allocation strategy (medium risk)
   * - Moderately diversified (up to 5 opportunities)
   * - Balance between risk and reward
   * @param {Array} opportunities - Filtered opportunities with risk scores
   * @param {Number} totalAmount - Total amount to allocate
   * @returns {Array} Allocation recommendations
   */
  _generateBalancedAllocation(opportunities, totalAmount) {
    // Take top 5 opportunities max
    const topOpportunities = opportunities.slice(0, 5);
    
    // Ensure we have at least some opportunities
    if (topOpportunities.length === 0) {
      return [];
    }
    
    // Calculate risk-adjusted return weights
    const weights = topOpportunities.map(o => {
      const apy = o.metrics?.apy || 0;
      const risk = o.riskScore.overallScore || 1;
      return (apy / risk) * 10; // Scale factor to make weights more meaningful
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Calculate allocation percentages
    const percentages = weights.map(weight => weight / totalWeight);
    
    // Generate allocation with minimum thresholds
    return topOpportunities.map((opportunity, index) => {
      const basePercentage = percentages[index];
      // Ensure minimum 10% allocation
      const adjustedPercentage = Math.max(basePercentage, 0.1);
      const amount = Math.round(totalAmount * adjustedPercentage * 100) / 100;
      
      return {
        opportunity: opportunity._id,
        name: opportunity.name,
        protocol: opportunity.protocol,
        protocolName: opportunity.protocolName || '',
        riskLevel: opportunity.riskScore.riskLevel,
        riskScore: opportunity.riskScore.overallScore,
        percentage: Math.round(adjustedPercentage * 10000) / 100,
        amount,
        projectedYield: (opportunity.metrics?.apy || 0) * amount / 100
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Generate aggressive allocation strategy (high risk)
   * - Concentrated (up to 3 opportunities)
   * - Focus on highest risk-adjusted returns
   * @param {Array} opportunities - Filtered opportunities with risk scores
   * @param {Number} totalAmount - Total amount to allocate
   * @returns {Array} Allocation recommendations
   */
  _generateAggressiveAllocation(opportunities, totalAmount) {
    // Take top 3 opportunities max for concentration
    const topOpportunities = opportunities.slice(0, 3);
    
    // Ensure we have at least some opportunities
    if (topOpportunities.length === 0) {
      return [];
    }
    
    // For aggressive, we weight heavily toward the top opportunity
    const percentages = [];
    
    if (topOpportunities.length === 1) {
      percentages.push(1.0); // 100% in single opportunity
    } else if (topOpportunities.length === 2) {
      percentages.push(0.7, 0.3); // 70/30 split
    } else {
      percentages.push(0.6, 0.25, 0.15); // 60/25/15 split
    }
    
    // Generate allocation
    return topOpportunities.map((opportunity, index) => {
      const percentage = percentages[index] || 0;
      const amount = Math.round(totalAmount * percentage * 100) / 100;
      
      return {
        opportunity: opportunity._id,
        name: opportunity.name,
        protocol: opportunity.protocol,
        protocolName: opportunity.protocolName || '',
        riskLevel: opportunity.riskScore.riskLevel,
        riskScore: opportunity.riskScore.overallScore,
        percentage: Math.round(percentage * 10000) / 100,
        amount,
        projectedYield: (opportunity.metrics?.apy || 0) * amount / 100
      };
    });
  }
  
  /**
   * Monitor and detect risk level changes for protocols and opportunities
   * @returns {Promise<Array>} Array of detected risk changes
   */
  async monitorRiskChanges() {
    try {
      const changes = [];
      
      // Get all active protocols
      const protocols = await Protocol.find({ status: 'active' });
      
      // Check each protocol for risk changes
      for (const protocol of protocols) {
        const currentScore = await this.calculateProtocolRiskScore(protocol);
        
        // Compare with previous risk score if available
        const previousScoreData = await this._getPreviousRiskScore(protocol._id, 'protocol');
        
        if (previousScoreData && previousScoreData.riskLevel !== currentScore.riskLevel) {
          // Risk level has changed, create a change notification
          const change = {
            type: 'protocol',
            id: protocol._id,
            name: protocol.name,
            previousLevel: previousScoreData.riskLevel,
            currentLevel: currentScore.riskLevel,
            previousScore: previousScoreData.overallScore,
            currentScore: currentScore.overallScore,
            changeDirection: currentScore.overallScore > previousScoreData.overallScore ? 'increased' : 'decreased',
            timestamp: Date.now()
          };
          
          changes.push(change);
          
          // Create a notification in the system
          await this._createRiskChangeNotification(change);
        }
        
        // Save current score as historical record
        await this._saveRiskScoreHistory(protocol._id, 'protocol', currentScore);
      }
      
      // Similar process for opportunities
      const opportunities = await YieldOpportunity.find({ active: true });
      
      for (const opportunity of opportunities) {
        const currentScore = await this.calculateOpportunityRiskScore(opportunity);
        const previousScoreData = await this._getPreviousRiskScore(opportunity._id, 'opportunity');
        
        if (previousScoreData && previousScoreData.riskLevel !== currentScore.riskLevel) {
          const change = {
            type: 'opportunity',
            id: opportunity._id,
            name: opportunity.name,
            protocol: opportunity.protocol,
            previousLevel: previousScoreData.riskLevel,
            currentLevel: currentScore.riskLevel,
            previousScore: previousScoreData.overallScore,
            currentScore: currentScore.overallScore,
            changeDirection: currentScore.overallScore > previousScoreData.overallScore ? 'increased' : 'decreased',
            timestamp: Date.now()
          };
          
          changes.push(change);
          await this._createRiskChangeNotification(change);
        }
        
        await this._saveRiskScoreHistory(opportunity._id, 'opportunity', currentScore);
      }
      
      return changes;
    } catch (error) {
      logger.error(`Error monitoring risk changes: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get previous risk score for entity
   * @param {String} entityId - ID of protocol or opportunity
   * @param {String} type - Type of entity (protocol or opportunity)
   * @returns {Promise<Object>} Previous risk score data
   */
  async _getPreviousRiskScore(entityId, type) {
    try {
      // This would typically query a database collection storing historical risk scores
      // For now, we'll check our in-memory cache as a simple implementation
      const cacheMap = type === 'protocol' ? this.riskMetrics.protocols : this.riskMetrics.opportunities;
      return cacheMap.get(entityId.toString());
    } catch (error) {
      logger.error(`Error getting previous risk score: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Save risk score history for future reference
   * @param {String} entityId - ID of protocol or opportunity
   * @param {String} type - Type of entity (protocol or opportunity)
   * @param {Object} scoreData - Risk score data to save
   */
  async _saveRiskScoreHistory(entityId, type, scoreData) {
    try {
      // In a real implementation, this would save to a database
      // For now, just update our cache
      const cacheMap = type === 'protocol' ? this.riskMetrics.protocols : this.riskMetrics.opportunities;
      cacheMap.set(entityId.toString(), { ...scoreData });
      
      // TODO: Implement actual database persistence for historical tracking
    } catch (error) {
      logger.error(`Error saving risk score history: ${error.message}`);
    }
  }
  
  /**
   * Create a notification for risk level changes
   * @param {Object} changeData - Risk change data
   */
  async _createRiskChangeNotification(changeData) {
    try {
      // Get users who have this protocol/opportunity in their portfolios or watchlists
      // This is simplified - in a real implementation you would query user portfolios
      const affectedUsers = await this._getAffectedUsers(changeData);
      
      // Create notifications for affected users
      for (const userId of affectedUsers) {
        const notificationData = {
          user: userId,
          type: 'risk_change',
          title: `Risk Level ${changeData.changeDirection === 'increased' ? 'Increased' : 'Decreased'}`,
          message: `The risk level for ${changeData.name} has ${changeData.changeDirection} from ${changeData.previousLevel} to ${changeData.currentLevel}.`,
          data: {
            entityType: changeData.type,
            entityId: changeData.id,
            previousLevel: changeData.previousLevel,
            currentLevel: changeData.currentLevel,
            changeDirection: changeData.changeDirection
          },
          read: false,
          createdAt: new Date()
        };
        
        await Notification.create(notificationData);
      }
    } catch (error) {
      logger.error(`Error creating risk change notification: ${error.message}`);
    }
  }
  
  /**
   * Get users affected by a risk change
   * @param {Object} changeData - Risk change data
   * @returns {Promise<Array>} Array of user IDs
   */
  async _getAffectedUsers(changeData) {
    try {
      // In a real implementation, this would query user portfolios or watchlists
      // For this example, we'll return an empty array
      // TODO: Implement actual user portfolio/watchlist query
      return [];
    } catch (error) {
      logger.error(`Error getting affected users: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Generate risk visualization data for dashboards and reports
   * @param {String} entityId - Protocol or opportunity ID (optional)
   * @param {String} type - Entity type (protocol, opportunity, all)
   * @returns {Promise<Object>} Visualization data
   */
  async generateRiskVisualizationData(entityId = null, type = 'all') {
    try {
      const visualizationData = {
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0,
          very_high: 0
        },
        riskFactors: {},
        historicalTrend: [],
        topRisksByCategory: {},
        riskComparison: []
      };
      
      // Generate different visualizations based on type
      if (type === 'protocol' && entityId) {
        // Single protocol visualization
        const protocol = await Protocol.findById(entityId);
        if (!protocol) {
          throw new Error(`Protocol not found: ${entityId}`);
        }
        
        const riskScore = await this.calculateProtocolRiskScore(protocol);
        visualizationData.riskFactors = riskScore.breakdown;
        visualizationData.riskLevel = riskScore.riskLevel;
        
        // TODO: Add historical trend data from database
        
      } else if (type === 'opportunity' && entityId) {
        // Single opportunity visualization
        const opportunity = await YieldOpportunity.findById(entityId);
        if (!opportunity) {
          throw new Error(`Opportunity not found: ${entityId}`);
        }
        
        const riskScore = await this.calculateOpportunityRiskScore(opportunity);
        visualizationData.riskFactors = riskScore.breakdown;
        visualizationData.riskLevel = riskScore.riskLevel;
        
        // Include protocol information for context
        const protocol = await Protocol.findById(opportunity.protocol);
        if (protocol) {
          visualizationData.protocol = {
            name: protocol.name,
            riskLevel: protocol.riskLevel
          };
        }
        
      } else {
        // Overall platform risk visualization
        // Get distribution of risk levels across protocols
        const protocols = await Protocol.find({ active: true });
        
        for (const protocol of protocols) {
          const riskScore = await this.calculateProtocolRiskScore(protocol);
          visualizationData.riskDistribution[riskScore.riskLevel]++;
          
          // Group by category for top risks by category
          if (!visualizationData.topRisksByCategory[protocol.category]) {
            visualizationData.topRisksByCategory[protocol.category] = [];
          }
          
          visualizationData.topRisksByCategory[protocol.category].push({
            id: protocol._id,
            name: protocol.name,
            riskScore: riskScore.overallScore,
            riskLevel: riskScore.riskLevel
          });
        }
        
        // Sort and limit top risks by category
        Object.keys(visualizationData.topRisksByCategory).forEach(category => {
          visualizationData.topRisksByCategory[category].sort((a, b) => b.riskScore - a.riskScore);
          visualizationData.topRisksByCategory[category] = visualizationData.topRisksByCategory[category].slice(0, 5);
        });
        
        // Add comparative risk data
        visualizationData.riskComparison = protocols.map(protocol => ({
          id: protocol._id,
          name: protocol.name,
          category: protocol.category,
          tvl: protocol.tvlUsd,
          riskScore: this.riskMetrics.protocols.get(protocol._id.toString())?.overallScore || 50
        })).sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);
      }
      
      return visualizationData;
    } catch (error) {
      logger.error(`Error generating risk visualization data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update user risk preferences
   * @param {String} userId - User ID
   * @param {Object} preferences - Risk preferences object
   * @returns {Promise<Object>} Updated user preferences
   */
  async updateUserRiskPreferences(userId, preferences) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Validate risk level
      if (preferences.riskLevel && !['low', 'medium', 'high'].includes(preferences.riskLevel)) {
        throw new Error(`Invalid risk level: ${preferences.riskLevel}`);
      }
      
      // Update user preferences
      user.preferences = {
        ...user.preferences,
        riskLevel: preferences.riskLevel || user.preferences?.riskLevel || 'medium',
        riskAlerts: preferences.riskAlerts !== undefined ? preferences.riskAlerts : user.preferences?.riskAlerts !== undefined ? user.preferences.riskAlerts : true,
        riskThreshold: preferences.riskThreshold || user.preferences?.riskThreshold || 70
      };
      
      await user.save();
      
      // Return updated preferences
      return user.preferences;
    } catch (error) {
      logger.error(`Error updating user risk preferences: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get risk management dashboard data for admins
   * @returns {Promise<Object>} Dashboard data
   */
  async getRiskDashboardData() {
    try {
      const dashboardData = {
        summary: {
          totalProtocols: 0,
          protocolsByRisk: {
            low: 0,
            medium: 0,
            high: 0,
            very_high: 0
          },
          averageProtocolRisk: 0,
          riskChangeLastWeek: 0
        },
        alerts: [],
        riskHotspots: [],
        recommendations: []
      };
      
      // Get all protocols
      const protocols = await Protocol.find();
      dashboardData.summary.totalProtocols = protocols.length;
      
      let totalRiskScore = 0;
      
      // Calculate risk distributions
      for (const protocol of protocols) {
        const riskScore = await this.calculateProtocolRiskScore(protocol);
        dashboardData.summary.protocolsByRisk[riskScore.riskLevel]++;
        totalRiskScore += riskScore.overallScore;
        
        // Check for high risk protocols
        if (riskScore.overallScore > 75) {
          dashboardData.riskHotspots.push({
            id: protocol._id,
            name: protocol.name,
            category: protocol.category,
            riskScore: riskScore.overallScore,
            riskLevel: riskScore.riskLevel,
            mainFactors: this._getTopRiskFactors(riskScore.breakdown)
          });
        }
      }
      
      // Calculate average risk
      dashboardData.summary.averageProtocolRisk = protocols.length > 0 
        ? Math.round((totalRiskScore / protocols.length) * 100) / 100 
        : 0;
      
      // Get recent risk alerts (from the last 7 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      
      const recentNotifications = await Notification.find({
        type: 'risk_change',
        createdAt: { $gte: recentDate }
      }).sort({ createdAt: -1 }).limit(10);
      
      dashboardData.alerts = recentNotifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        entityType: notification.data.entityType,
        entityId: notification.data.entityId,
        changeDirection: notification.data.changeDirection,
        timestamp: notification.createdAt
      }));
      
      // Sort risk hotspots by risk score
      dashboardData.riskHotspots.sort((a, b) => b.riskScore - a.riskScore);
      
      // Generate recommendations
      dashboardData.recommendations = this._generateRiskRecommendations(dashboardData);
      
      return dashboardData;
    } catch (error) {
      logger.error(`Error getting risk dashboard data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get top risk factors from risk breakdown
   * @param {Object} breakdown - Risk factor breakdown
   * @returns {Array} Top risk factors
   */
  _getTopRiskFactors(breakdown) {
    const factors = [];
    
    for (const [factor, data] of Object.entries(breakdown)) {
      factors.push({
        name: factor,
        score: data.score,
        weight: data.weight
      });
    }
    
    // Sort by weighted score (score * weight)
    factors.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
    
    // Return top 3 factors
    return factors.slice(0, 3);
  }
  
  /**
   * Generate risk recommendations based on dashboard data
   * @param {Object} dashboardData - Risk dashboard data
   * @returns {Array} Risk recommendations
   */
  _generateRiskRecommendations(dashboardData) {
    const recommendations = [];
    
    // Check for high concentration of high-risk protocols
    const highRiskCount = dashboardData.summary.protocolsByRisk.high + dashboardData.summary.protocolsByRisk.very_high;
    const highRiskPercentage = Math.round((highRiskCount / dashboardData.summary.totalProtocols) * 100);
    
    if (highRiskPercentage > 30) {
      recommendations.push({
        type: 'risk_concentration',
        priority: 'high',
        message: `High concentration of high-risk protocols (${highRiskPercentage}%). Consider rebalancing the platform's risk profile by adding more low-risk protocols.`
      });
    }
    
    // Check for specific risk hotspots
    if (dashboardData.riskHotspots.length > 0) {
      const topHotspot = dashboardData.riskHotspots[0];
      recommendations.push({
        type: 'risk_hotspot',
        priority: 'high',
        message: `${topHotspot.name} has the highest risk score (${topHotspot.riskScore}). Consider conducting additional audits or implementing risk mitigation strategies.`,
        entityId: topHotspot.id
      });
    }
    
    // General recommendation based on average risk
    if (dashboardData.summary.averageProtocolRisk > 60) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        message: `The platform's average risk score (${dashboardData.summary.averageProtocolRisk}) is relatively high. Consider implementing more rigorous risk assessment procedures.`
      });
    }
    
    return recommendations;
  }
}

// Create and export an instance of the service
const riskManagementService = new RiskManagementService();
module.exports = riskManagementService;
