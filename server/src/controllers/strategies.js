const Strategy = require('../models/Strategy');
const logger = require('../config/logger');

/**
 * @desc    Get all yield strategies
 * @route   GET /api/strategies
 * @access  Public (with optional filtering for authenticated users)
 */
exports.getStrategies = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      asset, 
      protocol, 
      chainId, 
      riskLevel, 
      minApy, 
      maxApy, 
      sortBy, 
      limit = 50, 
      page = 1 
    } = req.query;

    // Build query
    const queryObj = { isActive: true };
    
    if (asset) queryObj.asset = asset;
    if (protocol) queryObj.protocol = protocol;
    if (chainId) queryObj.chainId = chainId;
    if (riskLevel) queryObj.riskLevel = riskLevel;
    if (minApy) queryObj['apy.current'] = { $gte: parseFloat(minApy) };
    if (maxApy) {
      queryObj['apy.current'] = queryObj['apy.current'] || {};
      queryObj['apy.current'].$lte = parseFloat(maxApy);
    }

    // Build sort object
    let sortOptions = {};
    if (sortBy) {
      const sortParams = sortBy.split(',');
      sortParams.forEach(param => {
        // If prefixed with '-', sort in descending order
        if (param.startsWith('-')) {
          sortOptions[param.substring(1)] = -1;
        } else {
          sortOptions[param] = 1;
        }
      });
    } else {
      // Default sort by APY descending
      sortOptions = { 'apy.current': -1 };
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = parseInt(page) * parseInt(limit);
    const total = await Strategy.countDocuments(queryObj);

    // User-specific risk preferences (if authenticated)
    if (req.user && req.user.preferences && req.user.preferences.riskLevel) {
      const userRiskPreference = req.user.preferences.riskLevel;
      
      // Adjust query based on user risk preference
      if (userRiskPreference === 'low') {
        queryObj.riskLevel = userRiskPreference;
      } else if (userRiskPreference === 'medium') {
        queryObj.riskLevel = { $in: ['low', 'medium'] };
      }
      // If high risk preference, show all
    }

    // Execute query
    const strategies = await Strategy.find(queryObj)
      .sort(sortOptions)
      .skip(startIndex)
      .limit(parseInt(limit));

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: parseInt(page) + 1,
        limit: parseInt(limit)
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: parseInt(page) - 1,
        limit: parseInt(limit)
      };
    }

    res.status(200).json({
      status: 'success',
      count: strategies.length,
      pagination,
      total,
      data: {
        strategies
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single strategy
 * @route   GET /api/strategies/:id
 * @access  Public
 */
exports.getStrategy = async (req, res, next) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    // Add risk assessment result if user is authenticated
    let riskAssessment = null;
    if (req.user && req.user.preferences) {
      const userRiskPreference = req.user.preferences.riskLevel;
      const strategyRiskLevel = strategy.riskLevel;
      
      // Simple risk assessment
      riskAssessment = {
        compatible: 
          (userRiskPreference === 'high') || 
          (userRiskPreference === 'medium' && strategyRiskLevel !== 'high') ||
          (userRiskPreference === 'low' && strategyRiskLevel === 'low'),
        userPreference: userRiskPreference,
        strategyRisk: strategyRiskLevel,
        riskScore: strategy.calculateRiskScore()
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        strategy,
        riskAssessment
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new strategy
 * @route   POST /api/strategies
 * @access  Admin
 */
exports.createStrategy = async (req, res, next) => {
  try {
    // Add current user as creator
    req.body.createdBy = req.user.id;

    const strategy = await Strategy.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        strategy
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update strategy
 * @route   PUT /api/strategies/:id
 * @access  Admin
 */
exports.updateStrategy = async (req, res, next) => {
  try {
    const strategy = await Strategy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        strategy
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete strategy
 * @route   DELETE /api/strategies/:id
 * @access  Admin
 */
exports.deleteStrategy = async (req, res, next) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    // Instead of deleting, mark as inactive
    strategy.isActive = false;
    await strategy.save();

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get strategy analytics
 * @route   GET /api/strategies/:id/analytics
 * @access  Public
 */
exports.getStrategyAnalytics = async (req, res, next) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    // Get historical APY data
    const apyHistory = strategy.apy.historical;

    // Calculate average APY
    let avgApy = 0;
    if (apyHistory.length > 0) {
      avgApy = apyHistory.reduce((sum, item) => sum + item.value, 0) / apyHistory.length;
    }

    // Calculate min and max APY
    let minApy = strategy.apy.current;
    let maxApy = strategy.apy.current;
    if (apyHistory.length > 0) {
      minApy = Math.min(...apyHistory.map(item => item.value), strategy.apy.current);
      maxApy = Math.max(...apyHistory.map(item => item.value), strategy.apy.current);
    }

    res.status(200).json({
      status: 'success',
      data: {
        strategy: {
          id: strategy._id,
          name: strategy.name,
          currentApy: strategy.apy.current
        },
        analytics: {
          apyHistory,
          avgApy,
          minApy,
          maxApy,
          riskFactors: strategy.riskFactors,
          riskScore: strategy.calculateRiskScore()
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Pause or unpause a strategy
 * @route   PUT /api/strategies/:id/toggle-pause
 * @access  Admin
 */
exports.togglePauseStrategy = async (req, res, next) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    // Toggle pause status
    strategy.isPaused = !strategy.isPaused;
    await strategy.save();

    res.status(200).json({
      status: 'success',
      data: {
        strategy
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update strategy APY
 * @route   PUT /api/strategies/:id/update-apy
 * @access  Admin
 */
exports.updateStrategyAPY = async (req, res, next) => {
  try {
    const { newApy } = req.body;
    
    if (!newApy || isNaN(parseFloat(newApy))) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid APY value'
      });
    }

    const strategy = await Strategy.findById(req.params.id);

    if (!strategy) {
      return res.status(404).json({
        status: 'fail',
        message: 'Strategy not found'
      });
    }

    // Update APY
    await strategy.updateAPY(parseFloat(newApy));

    res.status(200).json({
      status: 'success',
      data: {
        strategy
      }
    });
  } catch (err) {
    next(err);
  }
};
