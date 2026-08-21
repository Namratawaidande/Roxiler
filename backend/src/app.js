const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS) Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ];

    if (allowedOrigins.includes(origin) || env.isDevelopment) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' blocked by CORS security policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// 3. HTTP Request Logging Middleware
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Rate Limiting Middleware
app.use(apiLimiter);

// 5. Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Base API Index Endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Store Rating Platform API',
    status: 'ONLINE',
    version: '1.0.0',
    apiVersion: 'v1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      stores: '/api/v1/stores',
      ratings: '/api/v1/ratings',
      dashboard: '/api/v1/dashboard'
    },
    timestamp: new Date().toISOString()
  });
});

// 7. Mount Versioned API Routes (/api/v1)
app.use('/api/v1', routes);

// 8. 404 Route Not Found Catch-All
app.use(notFoundHandler);

// 9. Centralized Error Handling Pipeline
app.use(errorHandler);

module.exports = app;
