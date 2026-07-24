const { auditUrl } = require('../services/auditService');
const cache = require('../services/cache');
const logger = require('../config/logger').logger;

async function auditController(req, res, next) {
  try {
    const { url, options = {} } = req.body;
    const requestId = req.locals?.requestId || req.requestId;

    const result = await auditUrl(url, options, requestId);

    const cacheHit = result.cached ? cache.get(url) : null;
    logger.info(
      {
        url,
        requestId,
        cacheHit: !!cacheHit,
        fetchStatus: result.fetchStatus,
      },
      'Audit completed'
    );

    res.status(200).json({
      success: true,
      data: result,
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { auditController };
