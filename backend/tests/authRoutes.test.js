/**
 * Auth Routes Tests — V2 Schema
 *
 * Tests:
 *  - GET  /api/auth/me    — return current user profile (no uid)
 *  - POST /api/auth/login — login via Firebase token (no uid in response)
 *
 * Strategy: mock authMiddleware directly (same pattern as all other V2 tests)
 * instead of re-mocking Firebase per-test, which doesn't work with moduleNameMapper.
 */

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');

// ─── Fixed ObjectId string ────────────────────────────────────────────────────
const USER_ID = '000000000000000000000099';

// ─── Auth Mock ────────────────────────────────────────────────────────────────
// x-role header controls which user is simulated
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const mongoose = require('mongoose');
    // No Authorization header → 401
    if (!req.headers['authorization']) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const role = req.headers['x-role'] || 'user';
    req.user = {
      _id: new mongoose.Types.ObjectId('000000000000000000000099'),
      email: 'test@example.com',
      role,
    };
    next();
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = (overrides = {}) =>
  User.create({
    uid: 'testuid123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
    isActive: true,
    _id: new mongoose.Types.ObjectId(USER_ID),
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Auth Routes (V2)', () => {

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {

    it('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('returns user profile with correct fields', async () => {
      await makeUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .set('x-role', 'user');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.role).toBe('user');
    });

    it('SECURITY: uid must NOT appear in /me response', async () => {
      await makeUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .set('x-role', 'user');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).not.toHaveProperty('uid');
    });

    it('reflects promoted role correctly', async () => {
      await makeUser({ role: 'super_admin' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .set('x-role', 'super_admin');

      // The route re-fetches from DB, so role comes from the DB document
      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe('super_admin');
    });

    it('returns expected safe fields (_id, email, displayName, role, isActive)', async () => {
      await makeUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .set('x-role', 'user');

      const data = res.body.data;
      expect(data).toHaveProperty('_id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('displayName');
      expect(data).toHaveProperty('role');
      expect(data).toHaveProperty('isActive');
      expect(data).not.toHaveProperty('uid');
      expect(data).not.toHaveProperty('__v');
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {

    it('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app).post('/api/auth/login');
      expect(res.statusCode).toBe(401);
    });

    it('returns user data on successful login', async () => {
      await makeUser();

      const res = await request(app)
        .post('/api/auth/login')
        .set('Authorization', 'Bearer valid-token')
        .set('x-role', 'user');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('SECURITY: uid must NOT appear in login response', async () => {
      await makeUser();

      const res = await request(app)
        .post('/api/auth/login')
        .set('Authorization', 'Bearer valid-token')
        .set('x-role', 'user');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).not.toHaveProperty('uid');
    });
  });
});
