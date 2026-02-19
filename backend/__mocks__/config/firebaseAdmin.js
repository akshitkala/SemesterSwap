/**
 * Jest manual mock for config/firebaseAdmin
 * Prevents real Firebase Admin SDK from initializing during tests.
 * Place this at __mocks__/config/firebaseAdmin.js
 * Jest will automatically use this when jest.mock('../config/firebaseAdmin') is called.
 */

const adminMock = {
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'mock-firebase-uid',
      email: 'mock@test.com',
    }),
    revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn().mockResolvedValue({ uid: 'mock-firebase-uid' }),
  }),
  apps: ['mock-app'], // Prevents re-initialization
};

module.exports = adminMock;
