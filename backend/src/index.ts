import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import marketRoutes from './api/markets';
import positionRoutes from './api/positions';
import userRoutes from './api/users';
import analyticsRoutes from './api/analytics';

// Import services
import { RootstockService } from './services/rootstock';
import { TheGraphService } from './services/thegraph';
import { MarketService } from './services/market';
import { PositionService } from './services/position';
import { SupabaseService } from './services/supabaseService';
import { supabase } from './config/supabase';

// Import utilities
import { logger } from './utils/logger';
import { errorHandler } from './utils/errorHandler';
import { rateLimiter } from './utils/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Logging middleware
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(rateLimiter);

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================
app.get('/health', async (req, res) => {
  try {
    // Check Supabase connectivity
    const supabaseHealth = await supabase.healthCheck();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: supabaseHealth ? 'healthy' : 'unhealthy',
        rootstock: process.env.ROOTSTOCK_RPC_URL ? 'configured' : 'not_configured',
        thegraph: process.env.THE_GRAPH_SUBGRAPH_URL ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// =============================================================================
// API ROUTES
// =============================================================================
app.use('/api/markets', marketRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// =============================================================================
// WEBSOCKET CONFIGURATION
// =============================================================================
wss.on('connection', (ws, req) => {
  logger.info('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      logger.info('WebSocket message received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          // Handle subscription logic
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel,
            timestamp: new Date().toISOString()
          }));
          break;
        case 'unsubscribe':
          // Handle unsubscription logic
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel: data.channel,
            timestamp: new Date().toISOString()
          }));
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      logger.error('WebSocket message parsing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================
app.use(errorHandler);

// =============================================================================
// 404 HANDLER
// =============================================================================
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================
const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);
const HOST = process.env.BACKEND_HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logger.info(`🚀 Pulse-08 Backend Server started`);
  logger.info(`📍 Server running on http://${HOST}:${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Rootstock Network: ${process.env.ROOTSTOCK_NETWORK || 'testnet'}`);
  logger.info(`📊 The Graph Network: ${process.env.THE_GRAPH_NETWORK || 'testnet'}`);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
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

export default app;
