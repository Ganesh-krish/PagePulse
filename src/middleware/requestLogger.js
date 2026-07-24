const pinoHttp = require('pino-http');
const logger = require('../config/logger').logger;

const baseLogger = pinoHttp({
  logger,
  customAttributeKeys: {
    reqId: 'requestId',
  },
  customSuccessMessage: (_req, _res) => 'request completed',
  customErrorMessage: (_req, _res, _error) => 'request completed with error',
});

function requestLogger(req, res, next) {
  if (req.method === 'GET' && req.url === '/health') {
    return next();
  }
  baseLogger(req, res, next);
}

module.exports = requestLogger;