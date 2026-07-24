const { fetchUrl } = require('./fetcher');
const { parseHtml } = require('./parser');
const cache = require('./cache');
const { FetchError } = require('../utils/errors');
const config = require('../config/index');

class Semaphore {
  constructor(max) {
    this.max = max;
    this.active = 0;
    this.queue = [];
  }

  acquire() {
    return new Promise((resolve) => {
      if (this.active < this.max) {
        this.active++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.active--;
    if (this.queue.length > 0 && this.active < this.max) {
      const next = this.queue.shift();
      this.active++;
      next();
    }
  }
}

const semaphore = new Semaphore(config.maxConcurrentFetches);

async function auditUrl(url, options = {}, requestId) {
  const cached = cache.get(url);
  if (cached) {
    return {
      url,
      auditedAt: new Date().toISOString(),
      cached: true,
      fetchStatus: 'cached',
      data: cached.data.data,
    };
  }

  const semaphorePromise = semaphore.acquire();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new FetchError('Audit timeout')), config.fetchTimeoutMs);
  });

  let acquired = false;
  try {
    await Promise.race([semaphorePromise, timeoutPromise]);
    acquired = true;

    const startTime = Date.now();
    const fetchResult = await fetchUrl(url, options, requestId);
    const responseTimeMs = Date.now() - startTime;

    const parsed = parseHtml(fetchResult.body, responseTimeMs);

    const result = {
      url,
      auditedAt: new Date().toISOString(),
      cached: false,
      fetchStatus: 'success',
      fetchStatusCode: fetchResult.status,
      fetchResponseTimeMs: responseTimeMs,
      data: parsed,
    };

    cache.set(url, result);
    return result;
  } catch (err) {
    if (err.name !== 'FetchError') {
      err = new FetchError(err.message || 'Audit failed');
    }
    return {
      url,
      auditedAt: new Date().toISOString(),
      cached: false,
      fetchStatus: 'error',
      fetchStatusCode: null,
      fetchResponseTimeMs: null,
      error: err.message,
      data: null,
    };
  } finally {
    if (acquired) {
      semaphore.release();
    }
  }
}

module.exports = { auditUrl };
