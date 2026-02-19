module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 20000,
  verbose: true,
  moduleNameMapper: {
    // Redirect Firebase Admin to a no-op mock so it never initializes during tests
    '\\.\\./config/firebaseAdmin': '<rootDir>/__mocks__/config/firebaseAdmin.js',
    '\\./config/firebaseAdmin':   '<rootDir>/__mocks__/config/firebaseAdmin.js',
  },
};


