describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses default port 3001 when PORT not set', () => {
    delete process.env.PORT;
    const config = require('../src/config');
    expect(config.port).toBe(3001);
  });

  test('reads PORT from environment', () => {
    process.env.PORT = '4000';
    const config = require('../src/config');
    expect(config.port).toBe('4000');
  });

  test('reads FRONTEND_ORIGIN from environment', () => {
    process.env.FRONTEND_ORIGIN = 'https://radio101.com';
    const config = require('../src/config');
    expect(config.frontendOrigin).toBe('https://radio101.com');
  });

  test('reads DJ_SECRET from environment', () => {
    process.env.DJ_SECRET = 'test-secret';
    const config = require('../src/config');
    expect(config.djSecret).toBe('test-secret');
  });
});
