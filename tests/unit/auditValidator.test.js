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

describe('Audit Validator', () => {
  it('rejects missing url field', async () => {
    const res = await request(app).post('/api/audit').send({ options: { timeout: 10000 } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'url')).toBe(true);
  });

  it('rejects empty url', async () => {
    const res = await request(app).post('/api/audit').send({ url: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-http(s) url', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'ftp://example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects url exceeding 2048 chars', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2050);
    const res = await request(app).post('/api/audit').send({ url: longUrl });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects private IP url', async () => {
    const res = await request(app).post('/api/audit').send({ url: 'http://127.0.0.1/test' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects timeout outside 1000-30000', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com', options: { timeout: 500 } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects maxRedirects outside 0-10', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com', options: { maxRedirects: 20 } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
