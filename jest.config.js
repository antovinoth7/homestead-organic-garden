/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(webp|png|jpe?g|gif)$': '<rootDir>/src/__tests__/mocks/fileMock.js',
  },
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/config/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*Styles.ts',
    '!src/types/**',
    '!src/__tests__/**',
    '!src/config/*.gen.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
};
