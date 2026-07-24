const crypto = require('crypto');

let get, set, del, clear, stats;
let mockInstance;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  mockInstance = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(() => 0),
    flushAll: jest.fn(),
    keys: jest.fn(() => []),
    getStats: jest.fn(() => ({ vsize: 0 })),
  };

  jest.doMock('node-cache', () => jest.fn(() => mockInstance));
  jest.doMock('../../src/config/index', () => ({
    cacheTtl: 60,
    cacheMax: 100,
    cacheUse: true,
  }));

  const cacheModule = require('../../src/services/cache');
  get = cacheModule.get;
  set = cacheModule.set;
  del = cacheModule.del;
  clear = cacheModule.clear;
  stats = cacheModule.stats;
});

describe('Cache', () => {
  it('set and get data', () => {
    mockInstance.get.mockReturnValue({ cached: true, data: { title: 'Test' } });
    set('https://example.com', { title: 'Test' });
    expect(mockInstance.set).toHaveBeenCalled();
    const result = get('https://example.com');
    expect(result).toEqual(expect.objectContaining({ cached: true }));
  });

  it('normalizes cache keys by query param order', () => {
    const normalized1 = new URL('https://example.com?a=1&b=2');
    const normalized2 = new URL('https://example.com?b=2&a=1');
    normalized1.searchParams.sort();
    normalized2.searchParams.sort();
    const key1 = crypto.createHash('sha256').update(normalized1.toString()).digest('hex');
    const key2 = crypto.createHash('sha256').update(normalized2.toString()).digest('hex');
    expect(key1).toBe(key2);
  });

  it('del removes entry', () => {
    set('https://example.com', { title: 'Test' });
    mockInstance.del.mockReturnValue(1);
    expect(del('https://example.com')).toBe(true);
  });

  it('clear flushes all', () => {
    set('https://example.com', { title: 'Test' });
    clear();
    expect(mockInstance.flushAll).toHaveBeenCalled();
  });

  it('stats tracks hits and misses', () => {
    mockInstance.get.mockReturnValueOnce(undefined).mockReturnValueOnce({ cached: true, data: {} });
    get('https://example.com');
    get('https://example.com');
    const s = stats();
    expect(s.misses).toBe(1);
    expect(s.hits).toBe(1);
  });

  it('returns null when CACHE_USE=false', () => {
    jest.resetModules();
    jest.doMock('node-cache', () => jest.fn(() => mockInstance));
    jest.doMock('../../src/config/index', () => ({
      cacheTtl: 60,
      cacheMax: 100,
      cacheUse: false,
    }));
    const disabledCache = require('../../src/services/cache');
    expect(disabledCache.get('https://example.com')).toBeNull();
    expect(disabledCache.set('https://example.com', {})).toBe(true);
  });
});
