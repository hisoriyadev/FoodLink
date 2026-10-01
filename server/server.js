import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import mapsRoutes from './routes/mapsRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { initSocket } from './utils/socketService.js';

import helmet from 'helmet';
import compression from 'compression';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

import { corsOptions } from './config/cors.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Trust reverse proxy (Render, Heroku, etc.) for secure cookies & accurate client IP
app.set('trust proxy', 1);

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Security & Production Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Apply General Rate Limiter to all /api routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'FoodLink Production API',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
