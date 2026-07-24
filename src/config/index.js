require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  cacheTtl: parseInt(process.env.CACHE_TTL, 10) || 300,
  cacheMax: parseInt(process.env.CACHE_MAX, 10) || 100,
  cacheUse: process.env.CACHE_USE !== 'false',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 10,
  fetchTimeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS, 10) || 10000,
  maxConcurrentFetches: parseInt(process.env.MAX_CONCURRENT_FETCHES, 10) || 5,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;