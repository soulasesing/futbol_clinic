/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/out/'],
};
