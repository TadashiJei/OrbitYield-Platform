const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Schema for analytics events
 */
const AnalyticsEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  anonymousId: {
    type: String,
    required: false
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'strategy_view',
      'transaction_initiated',
      'transaction_completed',
      'metamask_connected',
      'metamask_disconnected',
      'search',
      'filter_applied',
      'user_preference_changed',
      'error'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  sessionId: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  }
});

// Create the model
const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

/**
 * Analytics service for tracking user behavior
 */
class AnalyticsService {
  /**
   * Track a user event
   * @param {Object} eventData - Event data to track
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackEvent({
    userId,
    anonymousId,
    eventType,
    properties = {},
    source = 'web',
    sessionId,
    userAgent,
    ipAddress
  }) {
    try {
      // Ensure we have either userId or anonymousId
      if (!userId && !anonymousId) {
        throw new Error('Either userId or anonymousId is required');
      }

      // Create the event
      const event = await AnalyticsEvent.create({
        userId,
        anonymousId,
        eventType,
        properties,
        source,
        sessionId,
        userAgent,
        ipAddress,
        timestamp: new Date()
      });

      logger.debug(`Analytics event tracked: ${eventType} for ${userId || anonymousId}`);
      return event;
    } catch (error) {
      logger.error(`Error tracking analytics event: ${error.message}`);
      // Don't throw to prevent API failures
      return null;
    }
  }

  /**
   * Track a page view
   * @param {Object} data - Page view data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackPageView({
    userId,
    anonymousId,
    page,
    referrer,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      anonymousId,
      eventType: 'page_view',
      properties: {
        page,
        referrer
      },
      ...rest
    });
  }

  /**
   * Track a strategy view
   * @param {Object} data - Strategy view data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackStrategyView({
    userId,
    anonymousId,
    strategyId,
    strategyName,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      anonymousId,
      eventType: 'strategy_view',
      properties: {
        strategyId,
        strategyName
      },
      ...rest
    });
  }

  /**
   * Track a transaction initiated event
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackTransactionInitiated({
    userId,
    transactionId,
    type,
    amount,
    asset,
    strategyId,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      eventType: 'transaction_initiated',
      properties: {
        transactionId,
        type,
        amount,
        asset,
        strategyId
      },
      ...rest
    });
  }

  /**
   * Track a transaction completed event
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackTransactionCompleted({
    userId,
    transactionId,
    type,
    amount,
    asset,
    strategyId,
    status,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      eventType: 'transaction_completed',
      properties: {
        transactionId,
        type,
        amount,
        asset,
        strategyId,
        status
      },
      ...rest
    });
  }

  /**
   * Track a MetaMask connected event
   * @param {Object} data - Connection data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackMetaMaskConnected({
    userId,
    walletAddress,
    chainId,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      eventType: 'metamask_connected',
      properties: {
        walletAddress,
        chainId
      },
      ...rest
    });
  }

  /**
   * Track a MetaMask disconnected event
   * @param {Object} data - Connection data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackMetaMaskDisconnected({
    userId,
    walletAddress,
    reason,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      eventType: 'metamask_disconnected',
      properties: {
        walletAddress,
        reason
      },
      ...rest
    });
  }

  /**
   * Track a search event
   * @param {Object} data - Search data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackSearch({
    userId,
    anonymousId,
    query,
    resultsCount,
    filters = {},
    ...rest
  }) {
    return this.trackEvent({
      userId,
      anonymousId,
      eventType: 'search',
      properties: {
        query,
        resultsCount,
        filters
      },
      ...rest
    });
  }

  /**
   * Track a filter applied event
   * @param {Object} data - Filter data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackFilterApplied({
    userId,
    anonymousId,
    filterType,
    filterValue,
    page,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      anonymousId,
      eventType: 'filter_applied',
      properties: {
        filterType,
        filterValue,
        page
      },
      ...rest
    });
  }

  /**
   * Track a user preference changed event
   * @param {Object} data - Preference data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackUserPreferenceChanged({
    userId,
    preferenceType,
    oldValue,
    newValue,
    ...rest
  }) {
    return this.trackEvent({
      userId,
      eventType: 'user_preference_changed',
      properties: {
        preferenceType,
        oldValue,
        newValue
      },
      ...rest
    });
  }

  /**
   * Track an error event
   * @param {Object} data - Error data
   * @returns {Promise<Object>} - Tracked event
   */
  static async trackError({
    userId,
    anonymousId,
    errorMessage,
    errorCode,
    stack,
    context = {},
    ...rest
  }) {
    return this.trackEvent({
      userId,
      anonymousId,
      eventType: 'error',
      properties: {
        errorMessage,
        errorCode,
        stack,
        context
      },
      ...rest
    });
  }

  /**
   * Get user activity timeline
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - User events
   */
  static async getUserActivityTimeline(userId, { limit = 50, skip = 0, startDate, endDate } = {}) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      // Build query
      const query = { userId };
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Get user events
      const events = await AnalyticsEvent.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      return events;
    } catch (error) {
      logger.error(`Error getting user activity timeline: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get most viewed strategies
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Most viewed strategies
   */
  static async getMostViewedStrategies({ limit = 10, startDate, endDate } = {}) {
    try {
      // Build time range
      const timeQuery = {};
      if (startDate || endDate) {
        if (startDate) timeQuery.$gte = new Date(startDate);
        if (endDate) timeQuery.$lte = new Date(endDate);
      }

      // Aggregate pipeline
      const pipeline = [
        {
          $match: {
            eventType: 'strategy_view',
            ...(Object.keys(timeQuery).length > 0 ? { timestamp: timeQuery } : {})
          }
        },
        {
          $group: {
            _id: '$properties.strategyId',
            strategyName: { $first: '$properties.strategyName' },
            viewCount: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            strategyId: '$_id',
            strategyName: 1,
            viewCount: 1,
            uniqueUserCount: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { viewCount: -1 } },
        { $limit: limit }
      ];

      // Execute aggregation
      const results = await AnalyticsEvent.aggregate(pipeline);
      return results;
    } catch (error) {
      logger.error(`Error getting most viewed strategies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get conversion rates for strategies
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Strategy conversion rates
   */
  static async getStrategyConversionRates({ limit = 10, startDate, endDate } = {}) {
    try {
      // Build time range
      const timeQuery = {};
      if (startDate || endDate) {
        if (startDate) timeQuery.$gte = new Date(startDate);
        if (endDate) timeQuery.$lte = new Date(endDate);
      }
      
      // Get strategy views
      const viewsQuery = {
        eventType: 'strategy_view',
        ...(Object.keys(timeQuery).length > 0 ? { timestamp: timeQuery } : {})
      };
      
      const views = await AnalyticsEvent.aggregate([
        { $match: viewsQuery },
        { 
          $group: {
            _id: '$properties.strategyId',
            strategyName: { $first: '$properties.strategyName' },
            viewCount: { $sum: 1 },
            uniqueViewers: { $addToSet: '$userId' }
          }
        }
      ]);
      
      // Get transaction initiations for those strategies
      const transactionsQuery = {
        eventType: 'transaction_initiated',
        'properties.type': 'deposit',
        ...(Object.keys(timeQuery).length > 0 ? { timestamp: timeQuery } : {})
      };
      
      const transactions = await AnalyticsEvent.aggregate([
        { $match: transactionsQuery },
        { 
          $group: {
            _id: '$properties.strategyId',
            transactionCount: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ]);
      
      // Combine and calculate conversion rates
      const strategyMap = new Map();
      
      // Initialize with views data
      views.forEach(view => {
        strategyMap.set(view._id?.toString(), {
          strategyId: view._id,
          strategyName: view.strategyName,
          viewCount: view.viewCount,
          uniqueViewers: view.uniqueViewers?.length || 0,
          transactionCount: 0,
          uniqueInvestors: 0,
          conversionRate: 0
        });
      });
      
      // Add transaction data
      transactions.forEach(tx => {
        const strategyId = tx._id?.toString();
        if (strategyMap.has(strategyId)) {
          const data = strategyMap.get(strategyId);
          data.transactionCount = tx.transactionCount;
          data.uniqueInvestors = tx.uniqueUsers?.length || 0;
          data.conversionRate = data.uniqueViewers > 0 
            ? (data.uniqueInvestors / data.uniqueViewers) * 100 
            : 0;
        }
      });
      
      // Convert to array, sort by conversion rate, and limit
      const results = Array.from(strategyMap.values())
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, limit);
        
      return results;
    } catch (error) {
      logger.error(`Error getting strategy conversion rates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user retention data - users who returned after initial visit
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Retention data
   */
  static async getUserRetentionData({ period = 'week', limit = 10 } = {}) {
    try {
      // Define period in days
      let periodDays;
      switch (period) {
        case 'day': periodDays = 1; break;
        case 'week': periodDays = 7; break;
        case 'month': periodDays = 30; break;
        default: periodDays = 7;
      }
      
      // Get first-time users in each period
      const now = new Date();
      const periods = [];
      
      for (let i = 0; i < limit; i++) {
        const endDate = new Date(now.getTime() - (i * periodDays * 24 * 60 * 60 * 1000));
        const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
        
        periods.push({
          period: i,
          startDate,
          endDate
        });
      }
      
      const retentionData = [];
      
      // For each period, find new users and then check retention in subsequent periods
      for (const period of periods) {
        // Find first-time users in this period
        const firstTimeUserEvents = await AnalyticsEvent.aggregate([
          {
            $match: {
              timestamp: { $gte: period.startDate, $lt: period.endDate },
              userId: { $exists: true, $ne: null }
            }
          },
          {
            $group: {
              _id: '$userId',
              firstSeen: { $min: '$timestamp' }
            }
          },
          {
            $lookup: {
              from: AnalyticsEvent.collection.name,
              let: { user_id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                        { $eq: ['$userId', '$$user_id'] },
                        { $lt: ['$timestamp', period.startDate] }
                      ]
                    }
                  }
                },
                { $limit: 1 }
              ],
              as: 'previousEvents'
            }
          },
          {
            $match: {
              previousEvents: { $size: 0 } // No previous events
            }
          },
          {
            $project: {
              userId: '$_id',
              firstSeen: 1
            }
          }
        ]);
        
        const newUserIds = firstTimeUserEvents.map(e => e.userId);
        const totalNewUsers = newUserIds.length;
        
        // Calculate retention for this cohort in subsequent periods
        const retentionByPeriod = {};
        
        for (let i = 1; i <= Math.min(limit - period.period - 1, 8); i++) {
          const retentionPeriodStart = new Date(period.endDate.getTime());
          const retentionPeriodEnd = new Date(period.endDate.getTime() + (i * periodDays * 24 * 60 * 60 * 1000));
          
          const returnedUsers = await AnalyticsEvent.distinct('userId', {
            userId: { $in: newUserIds },
            timestamp: { $gte: retentionPeriodStart, $lt: retentionPeriodEnd }
          });
          
          retentionByPeriod[`period_${i}`] = {
            count: returnedUsers.length,
            rate: totalNewUsers > 0 ? (returnedUsers.length / totalNewUsers) * 100 : 0
          };
        }
        
        retentionData.push({
          periodStart: period.startDate,
          periodEnd: period.endDate,
          newUsers: totalNewUsers,
          retention: retentionByPeriod
        });
      }
      
      return retentionData;
    } catch (error) {
      logger.error(`Error getting user retention data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  AnalyticsService,
  AnalyticsEvent
};
