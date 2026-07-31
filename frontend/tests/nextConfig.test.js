const nextConfig = require('../next.config');

describe('production frontend configuration', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  test('uses standalone output without framework disclosure', () => {
    expect(nextConfig.output).toBe('standalone');
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  test('proxies API requests to the configured backend in Docker', async () => {
    process.env.DOCKER_ENV = 'true';
    process.env.INTERNAL_BACKEND_URL = 'http://backend:4000';

    await expect(nextConfig.rewrites()).resolves.toEqual([
      {
        source: '/api/:path*',
        destination: 'http://backend:4000/api/:path*',
      },
    ]);
  });
});
