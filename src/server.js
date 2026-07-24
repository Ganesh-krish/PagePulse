const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./config/logger').logger;

const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server started');
});

const shutdown = () => {
  logger.info('Shutdown signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;