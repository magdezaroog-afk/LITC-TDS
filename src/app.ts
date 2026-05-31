import express from 'express';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import rateLimit from 'express-rate-limit';

const app = express();

// Set up rate limiter: maximum of 150 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150, // Limit each IP to 150 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later. Sovereign Circuit Breaker is active.' }
});

// Set up SSE Specific limiter (stricter limit for SSE to prevent connection exhaustion)
const sseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit to 30 SSE connection attempts per IP
  message: { error: 'Too many SSE connections, please try again later.' }
});

// Apply rate limiter globally or specifically
app.use('/api/', apiLimiter);
app.use('/api/v1/notifications/stream', sseLimiter);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Global request parsing
app.use(express.json());

// Main API Router prefix
app.use('/api/v1', apiRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

export default app;
