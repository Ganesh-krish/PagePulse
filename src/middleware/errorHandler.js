const logger = require('../config/logger').logger;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

class FetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FetchError';
    this.statusCode = 502;
  }
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || err.name || 'INTERNAL_SERVER_ERROR';
  const errorResponse = {
    error: {
      code,
      message: err.message || 'Something went wrong',
      requestId: res.locals.requestId || req.requestId || null,
      timestamp: new Date().toISOString(),
    },
  };

  if (err.details && err.details.length > 0) {
    errorResponse.error.details = err.details;
  }

  if (statusCode === 500 && process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  logger.error(
    {
      err,
      requestId: res.locals.requestId || req.requestId,
      statusCode,
      method: req.method,
      url: req.url,
    },
    err.message
  );

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  errorHandler,
  ValidationError,
  NotFoundError,
  RateLimitError,
  FetchError,
};