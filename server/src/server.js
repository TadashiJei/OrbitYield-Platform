const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment variables
dotenv.config();

// Import custom modules
const connectDatabase = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/error');

// Load route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const strategyRoutes = require('./routes/strategies');
const transactionRoutes = require('./routes/transactions');
const metamaskRoutes = require('./routes/metamask');
const adminRoutes = require('./routes/admin');
const xcmRoutes = require('./routes/xcm');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const websocketAdminRoutes = require('./routes/websocketAdmin');
const rebalancingRoutes = require('./routes/rebalancingRoutes');

// Initialize Express app
const app = express();

// Connect to database
connectDatabase();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Security headers
app.use(helmet());

// Compress responses
app.use(compression());

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/metamask', metamaskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/xcm', xcmRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/websocket', websocketAdminRoutes);
app.use('/api/rebalancing', rebalancingRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'OrbitYield API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route not found: ${req.originalUrl}`
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
const websocketService = require('./utils/websocketService');
websocketService.init(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;
