const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const logger = require('../config/logger').logger;

router.get('/stats', (req, res) => {
  const stats = cache.stats();
  res.status(200).json({
    cache: stats,
    requestId: req.locals?.requestId || req.requestId,
  });
  logger.info({ requestId: req.locals?.requestId || req.requestId, stats }, 'Cache stats retrieved');
});

router.delete('/', (req, res) => {
  cache.clear();
  res.status(200).json({
    message: 'Cache cleared',
    requestId: req.locals?.requestId || req.requestId,
  });
  logger.warn({ requestId: req.locals?.requestId || req.requestId }, 'Cache cleared');
});

router.delete('/url', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'url query parameter is required',
        requestId: req.locals?.requestId || req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const deleted = cache.del(url);
  res.status(200).json({
    deleted,
    url,
    requestId: req.locals?.requestId || req.requestId,
  });
  logger.info({ requestId: req.locals?.requestId || req.requestId, url, deleted }, 'Cache entry deleted');
});

module.exports = router;
