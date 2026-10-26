import express from 'express';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
const { RedisStore } = require('connect-redis');
import { WAFMiddleware } from './backend/security/WAFMiddleware';
import { redisManager } from './backend/infrastructure/RedisClient';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

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

// 1. Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      scriptSrc:       ["'self'", "'unsafe-inline'"],
      scriptSrcAttr:   ["'none'"],
      styleSrc:        ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc:          ["'self'", "data:", "blob:"],
      connectSrc:      ["'self'"],
      fontSrc:         ["'self'", "https://fonts.gstatic.com"],
      objectSrc:       ["'none'"],
      frameAncestors:  ["'self'"],                          // Allow same-origin micro-frontend iframing
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// 2. WAF Shield
app.use(WAFMiddleware.shield);

// 3. Decoupled CORS Configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-role-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Required for HttpOnly Cookies
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ==========================================
// 2. Distributed Session Store (Redis with Memory Fallback)
// ==========================================
if (redisManager.client) {
  app.use(session({
    store: new RedisStore({ client: redisManager.client }),
    secret: process.env.SESSION_SECRET || 'LITC_SUPER_SECRET_KEY',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }));
  console.log('[Auth] Distributed Redis Session Store Enabled.');
} else {
  // Graceful Degradation: Fallback to MemoryStore if Redis is offline
  app.use(session({
    secret: process.env.SESSION_SECRET || 'LITC_SUPER_SECRET_KEY_FALLBACK',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
  }));
  console.warn('[Auth] Memory Session Store Enabled (Fallback Mode). Distributed sessions inactive.');
}

// ==========================================
// 2.8. Satellite Universal Reverse Proxy Gateway (Single-Origin Enterprise Architecture)
// Forward traffic to local or distributed satellite services without exposing extra ports
// ==========================================
const inventoryTarget = process.env.ASSET_INVENTORY_URL || 'http://localhost:3000';

const inventoryProxy = createProxyMiddleware({
  target: inventoryTarget,
  changeOrigin: true,
  on: { proxyReq: fixRequestBody },
  ws: true
});

app.use('/satellites/proxy/asset_inventory', createProxyMiddleware({
  target: inventoryTarget,
  changeOrigin: true,
  pathRewrite: { '^/satellites/proxy/asset_inventory': '' },
  on: { proxyReq: fixRequestBody },
  ws: true
}));

// Route root endpoints called by embedded satellite scripts to the asset inventory service
app.use(['/api/devices', '/api/columns', '/api/import', '/api/logs', '/login.html'], inventoryProxy);

// ==========================================
// 3. Request Parsing
// ==========================================
app.use(express.json());
app.use(cookieParser());

// Main API Router prefix (supports both /api/v1 and /api)
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

export default app;
