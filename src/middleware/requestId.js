const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger').logger;

function requestId(req, res, next) {
  const id = uuidv4();
  res.locals.requestId = id;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  logger.info({ requestId: id, method: req.method, url: req.url }, 'request started');
  next();
}

module.exports = requestId;