module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.[jt]sx?$': '<rootDir>/src/test/jest-transformer.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library|react-native|@react-native|@expo)/)',
  ],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@testing-library/react-native$': '<rootDir>/src/test/test-utils.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
