import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { initializeDatabase } from './config/database';
import { realTimeDataService } from './services/realTimeDataService';
import logger from './utils/logger';

// Import routes
import disasterRoutes from './routes/disasters';
import reportRoutes from './routes/reports';
import resourceRoutes from './routes/resources';
import socialMediaRoutes from './routes/socialMedia';
import officialUpdatesRoutes from './routes/officialUpdates';
import geocodingRoutes from './routes/geocoding';
import verificationRoutes from './routes/verification';
import authRoutes from './routes/auth';
import realtimeRoutes from './routes/realtime';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Disaster Response API',
    version: '1.0.0',
    features: {
      realtime: true,
      twitter: !!process.env.TWITTER_API_KEY,
      weather: true,
      emergency: true
    }
  });
});

// API routes
app.use('/api/disasters', disasterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/official-updates', officialUpdatesRoutes);
app.use('/api/geocode', geocodingRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/realtime', realtimeRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('join-disaster', (disasterId: string) => {
    socket.join(`disaster-${disasterId}`);
    logger.info('Client joined disaster room', { socketId: socket.id, disasterId });
  });

  socket.on('leave-disaster', (disasterId: string) => {
    socket.leave(`disaster-${disasterId}`);
    logger.info('Client left disaster room', { socketId: socket.id, disasterId });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start real-time data polling
    realTimeDataService.startRealTimePolling(io, 30000); // Poll every 30 seconds
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Disaster Response API server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 Socket.IO server ready for real-time updates`);
      logger.info(`⚡ Real-time data polling enabled (30s interval)`);
      logger.info(`🐦 Twitter integration: ${process.env.TWITTER_API_KEY ? 'Enabled' : 'Disabled'}`);
      logger.info(`🌤️  Weather alerts: Enabled (National Weather Service)`);
      logger.info(`🚨 Emergency alerts: Enabled (FEMA API)`);
      logger.info(`🏥 Resource data: Enabled (Red Cross API)`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

startServer(); 