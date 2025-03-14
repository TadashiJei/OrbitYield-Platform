const { AnalyticsService, AnalyticsEvent } = require('../utils/analyticsService');
const logger = require('../config/logger');

/**
 * @desc    Track client-side event
 * @route   POST /api/analytics/events
 * @access  Public/Private
 */
exports.trackEvent = async (req, res, next) => {
  try {
    const { eventType, properties, source, sessionId } = req.body;
    
    // Use authenticated user ID if available
    const userId = req.user ? req.user.id : null;
    const anonymousId = !userId ? (req.body.anonymousId || req.cookies.anonymousId) : null;
    
    // Get IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!eventType) {
      return res.status(400).json({
        status: 'fail',
        message: 'Event type is required'
      });
    }

    // Track the event
    const event = await AnalyticsService.trackEvent({
      userId,
      anonymousId,
      eventType,
      properties,
      source,
      sessionId,
      userAgent,
      ipAddress
    });

    // Send minimal response to client
    res.status(200).json({
      status: 'success',
      data: {
        eventId: event ? event._id : null
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user activity timeline
 * @route   GET /api/analytics/users/:userId/activity
 * @access  Private (Admin or User)
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1, startDate, endDate } = req.query;
    
    // Check if user is authorized (admin or self)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to view this user\'s activity'
      });
    }

    // Get activity timeline
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const events = await AnalyticsService.getUserActivityTimeline(userId, {
      limit: parseInt(limit),
      skip,
      startDate,
      endDate
    });

    // Get total count for pagination
    const total = await AnalyticsEvent.countDocuments({
      userId,
      ...(startDate || endDate ? {
        timestamp: {
          ...(startDate ? { $gte: new Date(startDate) } : {}),
          ...(endDate ? { $lte: new Date(endDate) } : {})
        }
      } : {})
    });

    // Pagination result
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    };

    res.status(200).json({
      status: 'success',
      pagination,
      data: {
        activity: events
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get most viewed strategies
 * @route   GET /api/analytics/strategies/most-viewed
 * @access  Private (Admin)
 */
exports.getMostViewedStrategies = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    const strategies = await AnalyticsService.getMostViewedStrategies({
      limit: parseInt(limit),
      startDate,
      endDate
    });

    res.status(200).json({
      status: 'success',
      data: {
        strategies
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get strategy conversion rates
 * @route   GET /api/analytics/strategies/conversion-rates
 * @access  Private (Admin)
 */
exports.getStrategyConversionRates = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    const conversionRates = await AnalyticsService.getStrategyConversionRates({
      limit: parseInt(limit),
      startDate,
      endDate
    });

    res.status(200).json({
      status: 'success',
      data: {
        conversionRates
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user retention data
 * @route   GET /api/analytics/users/retention
 * @access  Private (Admin)
 */
exports.getUserRetentionData = async (req, res, next) => {
  try {
    const { period = 'week', limit = 10 } = req.query;
    
    const retentionData = await AnalyticsService.getUserRetentionData({
      period,
      limit: parseInt(limit)
    });

    res.status(200).json({
      status: 'success',
      data: {
        retentionData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get analytics dashboard data
 * @route   GET /api/analytics/dashboard
 * @access  Private (Admin)
 */
exports.getAnalyticsDashboard = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '7days':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get total event counts
    const totalEvents = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    const totalUsers = await AnalyticsEvent.distinct('userId', {
      userId: { $exists: true, $ne: null },
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    // Get event counts by type
    const eventsByType = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Get most viewed strategies
    const mostViewedStrategies = await AnalyticsService.getMostViewedStrategies({
      limit: 5,
      startDate,
      endDate
    });
    
    // Get strategy conversion rates
    const strategyConversionRates = await AnalyticsService.getStrategyConversionRates({
      limit: 5,
      startDate,
      endDate
    });
    
    // Get daily activity
    const dailyActivity = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    // Get event sources breakdown
    const eventsBySource = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          source: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        period,
        overview: {
          totalEvents,
          uniqueUsers: totalUsers.length,
          startDate,
          endDate
        },
        eventsByType,
        dailyActivity,
        eventsBySource,
        mostViewedStrategies,
        strategyConversionRates
      }
    });
  } catch (err) {
    next(err);
  }
};
