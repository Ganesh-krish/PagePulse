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

describe('Audit Integration', () => {
  it('returns 200 with audit data for valid URL', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'https://example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('cached is false on first request', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'https://example.com' });
    expect(res.body.data.data.cached).toBe(false);
  });

  it('includes requestId and timestamp', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'https://example.com' });
    expect(res.body.requestId).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 400 for missing url', async () => {
    const res = await request(app).post('/api/audit').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid url', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});
