const supertest = require('supertest');
const app = require('../../src/app');

function setupServer() {
  return { app, request: supertest(app) };
}

function teardownServer() {
  return Promise.resolve();
}

function mockFetcher(html, status = 200) {
  jest.doMock('../../src/services/fetcher', () => ({
    fetchUrl: jest.fn(() =>
      Promise.resolve({
        status,
        data: html,
        headers: { 'content-type': 'text/html' },
        request: { res: { responseUrl: 'http://example.com' } },
        config: { url: 'http://example.com' },
      })
    ),
  }));
}

function mockCache(hitValue) {
  if (hitValue) {
    jest.doMock('../../src/services/cache', () => ({
      get: jest.fn(() => ({ cached: true, data: hitValue })),
      set: jest.fn(),
      del: jest.fn(() => 0),
      clear: jest.fn(),
      stats: jest.fn(() => ({ hits: 1, misses: 0, keys: 1, ksize: 1, vsize: 100 })),
    }));
  } else {
    jest.doMock('../../src/services/cache', () => ({
      get: jest.fn(() => undefined),
      set: jest.fn(),
      del: jest.fn(() => 0),
      clear: jest.fn(),
      stats: jest.fn(() => ({ hits: 0, misses: 1, keys: 0, ksize: 0, vsize: 0 })),
    }));
  }
}

function generateValidUrl() {
  return 'https://example.com';
}

function generateInvalidUrl() {
  return 'not-a-url';
}

module.exports = {
  setupServer,
  teardownServer,
  mockFetcher,
  mockCache,
  generateValidUrl,
  generateInvalidUrl,
};
