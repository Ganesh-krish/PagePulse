const request = require('supertest');
const app = require('../../src/app');

jest.mock('dns', () => ({
  lookup: jest.fn((hostname, cb) => {
    if (hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return cb(new Error('not found'));
    }
    return cb(null, { address: '93.184.216.34' });
  }),
}));

jest.mock('../../src/services/fetcher', () => ({
  fetchUrl: jest.fn(() =>
    Promise.resolve({
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>',
      url: 'https://example.com',
      responseTimeMs: 100,
    })
  ),
}));

describe('Rate Limit Integration', () => {
  it('allows requests within limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/audit').send({ url: 'https://example.com' });
      expect([200, 400]).toContain(res.status);
    }
  });

  it('returns 429 after exceeding limit', async () => {
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(request(app).post('/api/audit').send({ url: 'https://example.com' }));
    }
    const results = await Promise.all(promises);
    const has429 = results.some((r) => r.status === 429);
    expect(has429).toBe(true);
  });

  it('429 response includes retryAfter', async () => {
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(request(app).post('/api/audit').send({ url: 'https://example.com' }));
    }
    const results = await Promise.all(promises);
    const limited = results.find((r) => r.status === 429);
    if (limited) {
      expect(limited.body.error.retryAfter).toBeDefined();
    }
  });
});
