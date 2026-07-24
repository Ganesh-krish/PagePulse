const pino = require('pino');
const pinoHttp = require('pino-http');

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProduction ? 'info' : 'debug',
  formatters: {
    bindings: (bindings) => {
      const { pid: _pid, hostname: _hostname, ...rest } = bindings;
      return rest;
    },
  },
});

const httpLogger = pinoHttp({
  logger,
  customAttributeKeys: {
    reqId: 'requestId',
  },
});

module.exports = { logger, httpLogger };