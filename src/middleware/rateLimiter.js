const rateLimit = require('express-rate-limit');
const config = require('../config/index');
const logger = require('../config/logger').logger;
const { RateLimitError } = require('../utils/errors');

const auditLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip;
  },
  handler: (req, res) => {
    const err = new RateLimitError('Too many requests. Please try again later.');
    err.retryAfter = new Date(req.rateLimit.resetTime).toISOString();
    logger.warn(
      {
        clientIp: req.ip,
        path: req.path,
        requestId: req.locals?.requestId || req.requestId,
        retryAfter: err.retryAfter,
      },
      'Rate limit exceeded'
    );
    res.status(429).json({
      error: {
        code: err.code,
        message: err.message,
        requestId: req.locals?.requestId || req.requestId,
        timestamp: new Date().toISOString(),
        retryAfter: err.retryAfter,
      },
    });
  },
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/cache/stats';
  },
});

module.exports = { auditLimiter };
