const express = require('express');
const { getDashboard, getAdminDashboard } = require('../controllers/dashboard');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// User dashboard route
router.get('/', protect, getDashboard);

// Admin dashboard route
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
