import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { sanitizeNoSQL } from './middleware/sanitize.js';

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-finance-tracker');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(sanitizeNoSQL);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Comprehensive Production Health Check
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mem = process.memoryUsage();

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    uptime: `${Math.round(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'ai-finance-tracker'
    },
    system: {
      nodeVersion: process.version,
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024)
    }
  });
});

// Centralized Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
