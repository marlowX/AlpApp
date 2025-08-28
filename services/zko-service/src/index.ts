import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Create logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// Database connection pool
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'alpsys',
  user: process.env.DB_USER || 'alpsys_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
db.connect((err, _client, release) => {
  if (err) {
    logger.error('Error acquiring client', err.stack);
  } else {
    logger.info('Database connected successfully');
    release();
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

// Import routes
import zkoRoutes from './routes/zko.routes';
import workflowRoutes from './routes/workflow.routes';
import palletsRoutes from './routes/pallets.routes';
import productionRoutes from './routes/production.routes';
import bufferRoutes from './routes/buffer.routes';
import databaseRoutes from './routes/database.routes';
import rozkrojeRoutes from './routes/rozkroje.routes';
import plytyRoutes from './routes/plyty.routes';

// Routes
app.use('/api/zko', zkoRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/pallets', palletsRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/buffer', bufferRoutes);
app.use('/api/rozkroje', rozkrojeRoutes);
app.use('/api/plyty', plytyRoutes);
app.use('/api', databaseRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connections
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Join ZKO room
  socket.on('join:zko', (zkoId: string) => {
    socket.join(`zko:${zkoId}`);
    logger.info(`Client ${socket.id} joined room zko:${zkoId}`);
  });
  
  // Leave ZKO room
  socket.on('leave:zko', (zkoId: string) => {
    socket.leave(`zko:${zkoId}`);
    logger.info(`Client ${socket.id} left room zko:${zkoId}`);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export function to emit events
export const emitZKOUpdate = (zkoId: number, event: string, data: any) => {
  io.to(`zko:${zkoId}`).emit(event, data);
  logger.debug(`Emitted ${event} to room zko:${zkoId}`);
};

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    db.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

export default app;