const axios = require('axios');
const dns = require('dns');
const { promisify } = require('util');
const { FetchError } = require('../utils/errors');
const config = require('../config/index');

const lookup = promisify(dns.lookup);

const PRIVATE_NETWORKS = [
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
  { start: '0.0.0.0', end: '0.255.255.255' },
];

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

function isPrivateIP(ip) {
  const ipNum = ipToNumber(ip);
  for (const net of PRIVATE_NETWORKS) {
    const start = ipToNumber(net.start);
    const end = ipToNumber(net.end);
    if (ipNum >= start && ipNum <= end) return true;
  }
  return false;
}

async function resolveAndCheck(hostname) {
  try {
    const { address } = await lookup(hostname, { family: 4 });
    if (isPrivateIP(address)) {
      throw new Error('Private IP detected');
    }
  } catch (err) {
    if (err.message === 'Private IP detected') {
      throw err;
    }
    throw new Error('DNS resolution failed');
  }
}

async function fetchUrl(url, options = {}, _requestId) {
  const timeout = options.timeout || config.fetchTimeoutMs;
  const maxRedirects = options.maxRedirects ?? 5;

  await resolveAndCheck(new URL(url).hostname);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await axios.get(url, {
      signal: controller.signal,
      timeout,
      maxRedirects,
      headers: {
        'User-Agent': 'PagePulse/1.0 (+https://pagepulse.example)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: (s) => s >= 200 && s < 400,
    });

    clearTimeout(timeoutId);

    if (!response.headers['content-type'] || !response.headers['content-type'].includes('text/html')) {
      throw new Error('Response is not HTML');
    }

    return {
      status: response.status,
      headers: response.headers,
      body: response.data,
      url: response.request?.res?.responseUrl || response.config?.url || url,
      responseTimeMs: response.headers['x-response-time'] ? parseInt(response.headers['x-response-time'], 10) : null,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (axios.isCancel(err)) {
      throw new FetchError('Request timed out');
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      throw new FetchError(`Fetch connection error: ${err.code}`);
    }

    if (axios.isAxiosError(err) && err.response) {
      throw new FetchError(`Fetch HTTP error: ${err.response.status}`);
    }

    if (err.message && (err.message.includes('Private IP detected') || err.message.includes('DNS resolution failed'))) {
      throw new FetchError(err.message);
    }

    if (err.message === 'Response is not HTML') {
      throw new FetchError('Invalid content type');
    }

    throw new FetchError(err.message || 'Fetch failed');
  }
}

module.exports = { fetchUrl };
