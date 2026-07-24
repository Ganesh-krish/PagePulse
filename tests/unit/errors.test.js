const { AppError, ValidationError, NotFoundError, RateLimitError, FetchError, InternalError } = require('../../src/utils/errors');

describe('AppError', () => {
  it('sets code, message, statusCode, and isOperational', () => {
    const err = new AppError('TEST_CODE', 'test message', 418);
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(418);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ValidationError', () => {
  it('has correct defaults', () => {
    const err = new ValidationError('invalid');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
  });

  it('accepts custom details', () => {
    const err = new ValidationError('bad input', [{ field: 'url', message: 'required' }]);
    expect(err.details).toHaveLength(1);
  });
});

describe('NotFoundError', () => {
  it('has correct code and statusCode', () => {
    const err = new NotFoundError('missing');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });
});

describe('RateLimitError', () => {
  it('has correct code and statusCode', () => {
    const err = new RateLimitError('too many');
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(err.statusCode).toBe(429);
  });
});

describe('FetchError', () => {
  it('has correct code and statusCode', () => {
    const err = new FetchError('fetch failed');
    expect(err.code).toBe('FETCH_FAILED');
    expect(err.statusCode).toBe(502);
  });
});

describe('InternalError', () => {
  it('has correct code and statusCode', () => {
    const err = new InternalError('boom');
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.statusCode).toBe(500);
  });
});
