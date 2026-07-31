const request = require('supertest');

process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-only-secret-with-at-least-thirty-two-characters';
process.env.NODE_ENV = 'test';

const app = require('../dist/app').default;

describe('HTTP production surface', () => {
  test('exposes liveness and JSON not-found responses', async () => {
    await request(app).get('/api/health').expect(200, { status: 'ok' });
    await request(app).get('/not-a-route').expect(404, { message: 'Not found' });
  });

  test.each([
    '/api/v1/dashboard/admin',
    '/api/v1/finance/accounts',
    '/api/v1/family/portal',
    '/api/v1/domain/locations',
  ])('mounts protected route %s', async (path) => {
    const response = await request(app).get(path);
    expect(response.status).toBe(401);
  });

  test('rejects an untrusted browser origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
  });

  test('keeps global administration out of the shared tenant login', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.test',
        password: 'irrelevant',
        tenantId: 'super_admin',
      })
      .expect(400, { message: 'Faltan datos para login' });
  });
});
