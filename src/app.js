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