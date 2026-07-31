const jwtUtil = require('../dist/utils/jwt');

const originalSecret = process.env.JWT_SECRET;
const tenantId = '123e4567-e89b-42d3-a456-426614174000';

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

test('rejects signing when JWT_SECRET is missing or weak', () => {
  delete process.env.JWT_SECRET;
  expect(() => jwtUtil.sign({
    userId: 'user-id',
    tenantId,
    role: 'admin',
  })).toThrow('JWT_SECRET must be configured with at least 32 characters');

  process.env.JWT_SECRET = 'too-short';
  expect(() => jwtUtil.sign({
    userId: 'user-id',
    tenantId,
    role: 'admin',
  })).toThrow('JWT_SECRET must be configured with at least 32 characters');
});

test('signs and verifies a constrained tenant token', () => {
  process.env.JWT_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
  const payload = {
    userId: 'user-id',
    tenantId,
    role: 'admin',
  };

  const token = jwtUtil.sign(payload);
  expect(jwtUtil.verify(token)).toEqual(payload);
});

test('rejects tenant roles without a valid tenant UUID', () => {
  process.env.JWT_SECRET = 'a-secure-test-secret-with-at-least-32-characters';
  const token = jwtUtil.sign({
    userId: 'user-id',
    tenantId: 'not-a-uuid',
    role: 'admin',
  });

  expect(() => jwtUtil.verify(token)).toThrow('Invalid token payload');
});
