/**
 * Admin Stats + User Viewer Tests — Phase 4, V2 Schema
 *
 * Tests:
 *  - GET /api/admin/stats        — platform counts
 *  - GET /api/admin/users        — read-only user list (no uid)
 *  - GET /api/admin/users/:id    — single user (no uid)
 *
 * Auth mock: x-role header ('admin' | 'super_admin' | 'user')
 * V2: req.user._id is ObjectId, uid (firebaseUid) is NEVER in responses
 */

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');

// ─── Fixed ObjectId strings (safe inside hoisted jest.mock factories) ──────────
const ADMIN_ID = '000000000000000000000001';
const USER_A_ID = '000000000000000000000002';
const USER_B_ID = '000000000000000000000003';

// ─── Auth Mock ────────────────────────────────────────────────────────────────
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const mongoose = require('mongoose');
    const role = req.headers['x-role'] || 'user';
    if (role === 'admin' || role === 'super_admin') {
      req.user = {
        _id: new mongoose.Types.ObjectId('000000000000000000000001'),
        email: 'admin@test.com',
        role,
      };
    } else {
      req.user = {
        _id: new mongoose.Types.ObjectId('000000000000000000000002'),
        email: 'user@test.com',
        role: 'user',
      };
    }
    next();
  },
}));

// ─── Role Middleware Mock ─────────────────────────────────────────────────────
jest.mock('../middleware/roleMiddleware', () => ({
  requireRole: (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a user with a unique uid to satisfy the required+unique constraint */
const makeUser = (overrides = {}) =>
  User.create({
    uid: new mongoose.Types.ObjectId().toString(), // unique per call
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    displayName: 'Test User',
    role: 'user',
    isActive: true,
    ...overrides,
  });

const makeBook = (sellerId, overrides = {}) =>
  Book.create({
    bookName: 'Test Book',
    subject: 'Science',
    price: 100,
    condition: 'good',
    sellerPhone: '9876543210',
    status: 'approved',
    images: ['https://example.com/img.jpg'],
    seller: sellerId,
    sellerEmail: 'seller@test.com',
    isDeleted: false,
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Admin Stats + User Viewer — Phase 4 (V2)', () => {

  // ── GET /api/admin/stats ───────────────────────────────────────────────────
  describe('GET /api/admin/stats', () => {

    it('returns 403 for regular users', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-role', 'user');
      expect(res.statusCode).toBe(403);
    });

    it('returns correct zero counts when DB is empty', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBe(0);
      expect(res.body.data.totalListings).toBe(0);
      expect(res.body.data.pendingListings).toBe(0);
      expect(res.body.data.approvedListings).toBe(0);
      expect(res.body.data.rejectedListings).toBe(0);
    });

    it('returns accurate counts matching seeded data', async () => {
      const userA = await makeUser();
      const userB = await makeUser();

      // 2 approved, 1 pending, 1 rejected
      await makeBook(userA._id, { status: 'approved' });
      await makeBook(userA._id, { status: 'approved' });
      await makeBook(userB._id, { status: 'pending' });
      await makeBook(userB._id, { status: 'rejected', isDeleted: true });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalUsers).toBe(2);
      expect(res.body.data.totalListings).toBe(3);   // approved(2) + pending(1) — rejected is isDeleted:true
      expect(res.body.data.pendingListings).toBe(1);
      expect(res.body.data.approvedListings).toBe(2);
      expect(res.body.data.rejectedListings).toBe(1);
    });

    it('super_admin can also access stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-role', 'super_admin');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns all required stat fields', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-role', 'admin');

      const data = res.body.data;
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('totalListings');
      expect(data).toHaveProperty('pendingListings');
      expect(data).toHaveProperty('approvedListings');
      expect(data).toHaveProperty('rejectedListings');
    });
  });

  // ── GET /api/admin/users ───────────────────────────────────────────────────
  describe('GET /api/admin/users', () => {

    it('returns 403 for regular users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('x-role', 'user');
      expect(res.statusCode).toBe(403);
    });

    it('returns empty list when no users exist', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });

    it('returns all users with correct fields', async () => {
      await makeUser({ displayName: 'Alice', role: 'user' });
      await makeUser({ displayName: 'Bob',   role: 'admin' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(2);

      const names = res.body.data.map(u => u.displayName);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
    });

    it('SECURITY: uid (firebaseUid) must NOT appear in any user object', async () => {
      await makeUser({ uid: 'firebase-uid-secret-do-not-expose' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(user => {
        expect(user).not.toHaveProperty('uid');
      });
    });

    it('response includes all expected safe fields', async () => {
      await makeUser({ displayName: 'Test', role: 'user', isActive: true });

      const res = await request(app)
        .get('/api/admin/users')
        .set('x-role', 'admin');

      const user = res.body.data[0];
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('uid');
      expect(user).not.toHaveProperty('__v');
    });

    it('super_admin can also view users', async () => {
      await makeUser();
      const res = await request(app)
        .get('/api/admin/users')
        .set('x-role', 'super_admin');
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
    });
  });

  // ── GET /api/admin/users/:id ───────────────────────────────────────────────
  describe('GET /api/admin/users/:id', () => {

    it('returns 403 for regular users', async () => {
      const user = await makeUser();
      const res = await request(app)
        .get(`/api/admin/users/${user._id}`)
        .set('x-role', 'user');
      expect(res.statusCode).toBe(403);
    });

    it('returns a single user by ID', async () => {
      const user = await makeUser({ displayName: 'Charlie', role: 'user' });

      const res = await request(app)
        .get(`/api/admin/users/${user._id}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Charlie');
      expect(res.body.data._id.toString()).toBe(user._id.toString());
    });

    it('returns 404 for a non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('x-role', 'admin');
      expect(res.statusCode).toBe(404);
    });

    it('SECURITY: uid must NOT appear in single user response', async () => {
      const user = await makeUser({ uid: 'super-secret-firebase-uid' });

      const res = await request(app)
        .get(`/api/admin/users/${user._id}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).not.toHaveProperty('uid');
    });

    it('read-only: no POST/PUT/DELETE on /api/admin/users/:id', async () => {
      const user = await makeUser();

      // Attempt mutation — should be 404 (route doesn't exist) or 405
      const putRes = await request(app)
        .put(`/api/admin/users/${user._id}`)
        .set('x-role', 'admin')
        .send({ role: 'super_admin' });

      // Route is not defined, so Express returns 404 — mutation is blocked
      expect(putRes.statusCode).not.toBe(200);
    });
  });

  // ── Phase 4 Security Checkpoint ───────────────────────────────────────────
  describe('Phase 4 Security Checkpoint', () => {

    it('admin token on GET /api/admin/stats → 200', async () => {
      const res = await request(app).get('/api/admin/stats').set('x-role', 'admin');
      expect(res.statusCode).toBe(200);
    });

    it('user token on GET /api/admin/stats → 403', async () => {
      const res = await request(app).get('/api/admin/stats').set('x-role', 'user');
      expect(res.statusCode).toBe(403);
    });

    it('user token on GET /api/admin/users → 403', async () => {
      const res = await request(app).get('/api/admin/users').set('x-role', 'user');
      expect(res.statusCode).toBe(403);
    });

    it('stats counts match seeded data exactly', async () => {
      const u1 = await makeUser();
      const u2 = await makeUser();
      await makeBook(u1._id, { status: 'pending' });
      await makeBook(u2._id, { status: 'approved' });

      const res = await request(app).get('/api/admin/stats').set('x-role', 'admin');

      expect(res.body.data.totalUsers).toBe(2);
      expect(res.body.data.pendingListings).toBe(1);
      expect(res.body.data.approvedListings).toBe(1);
    });
  });
});
