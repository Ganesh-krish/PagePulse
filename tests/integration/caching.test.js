const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/services/fetcher', () => ({
  fetchUrl: jest.fn(() =>
    Promise.resolve({
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html><head><title>Test Page</title></head><body><h1>Hello</h1></body></html>',
      url: 'https://example.com',
      responseTimeMs: 100,
    })
  ),
}));

describe('Caching Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('first audit succeeds', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'https://example.com' });
    expect(res.status).toBe(200);
  });

  it('health endpoint is not rate-limited', async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    }
  });
});
