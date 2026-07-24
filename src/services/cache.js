const NodeCache = require('node-cache');
const crypto = require('crypto');
const config = require('../config/index');

const cache = new NodeCache({
  stdTTL: config.cacheTtl,
  maxKeys: config.cacheMax,
  checkperiod: 120,
});

let hits = 0;
let misses = 0;

function cacheKey(url) {
  const normalized = new URL(url.trim().toLowerCase());
  normalized.searchParams.sort();
  return crypto.createHash('sha256').update(normalized.toString()).digest('hex');
}

function get(url) {
  if (!config.cacheUse) return null;
  const key = cacheKey(url);
  const entry = cache.get(key);
  if (entry) {
    hits++;
    return { cached: true, data: entry };
  }
  misses++;
  return null;
}

function set(url, data) {
  if (!config.cacheUse) return true;
  const key = cacheKey(url);
  const entry = { url, auditedAt: new Date().toISOString(), ttlSeconds: config.cacheTtl, data };
  cache.set(key, entry);
  return true;
}

function del(url) {
  const key = cacheKey(url);
  return cache.del(key) > 0;
}

function clear() {
  cache.flushAll();
}

function stats() {
  const keys = cache.keys();
  return {
    hits,
    misses,
    keys: keys.length,
    ksize: keys.length,
    vsize: cache.getStats().vsize,
  };
}

module.exports = { get, set, del, clear, stats };
