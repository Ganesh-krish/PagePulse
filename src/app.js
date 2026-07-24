const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./config/logger');
const requestId = require('./middleware/requestId');
const httpLogger = require('./middleware/requestLogger');
const errorHandlerModule = require('./middleware/errorHandler');
const errorHandler = errorHandlerModule.errorHandler;
const cacheRoutes = require('./routes/cache');
const auditRoutes = require('./routes/audit');
const { auditLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(httpLogger);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PagePulse - URL Audit Service</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .footer a { color: #2563eb; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>PagePulse</h1>
      <p>Production-grade URL audit service with caching, rate limiting, and structured logging.</p>
      <h2>API Endpoints</h2>
      <ul>
        <li><code>POST /api/audit</code> — Audit a URL</li>
        <li><code>GET /health</code> — Health check</li>
        <li><code>GET /api/cache/stats</code> — Cache statistics</li>
      </ul>
      <div class="footer">
        Built for <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">Digital Heroes Training Task</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api/cache', cacheRoutes);
app.use('/api/audit', auditLimiter, auditRoutes);

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.statusCode = 404;
  error.name = 'NotFoundError';
  next(error);
});

app.use(errorHandler);

module.exports = app;