beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.restoreAllMocks();
});
