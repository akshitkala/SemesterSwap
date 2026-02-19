/**
 * Admin Panel Book CRUD Tests — V2 Schema
 *
 * Tests:
 *  - GET  /api/admin/pending       — list pending books
 *  - PUT  /api/admin/approve/:id   — approve a book
 *  - DELETE /api/admin/reject/:id  — reject (soft-delete) a book
 *
 * V2 schema: seller = ObjectId ref User, condition lowercase, isDeleted soft-delete
 *
 * NOTE: jest.mock() factories are hoisted before variable declarations,
 * so ObjectIds used in mocks must be defined as plain strings (not via mongoose).
 */

const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const mongoose = require('mongoose');

// ─── Fixed ObjectId strings (safe to use in hoisted jest.mock factories) ──────
const ADMIN_ID  = '000000000000000000000001';
const USER_ID   = '000000000000000000000002';

// ─── Auth Mock ────────────────────────────────────────────────────────────────
// x-role header: 'admin' | 'super_admin' | 'user' (default)
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const role = req.headers['x-role'] || 'user';
    const mongoose = require('mongoose');
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
  }
}));

// ─── Role Middleware Mock ─────────────────────────────────────────────────────
jest.mock('../middleware/roleMiddleware', () => ({
  requireRole: (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  }
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makePendingBook = (overrides = {}) =>
  Book.create({
    bookName:    'Test Pending Book',
    subject:     'Mathematics',
    price:       150,
    condition:   'good',
    sellerPhone: '9876543210',
    status:      'pending',
    images:      ['https://example.com/img.jpg'],
    seller:      new mongoose.Types.ObjectId(USER_ID),
    sellerEmail: 'user@test.com',
    isDeleted:   false,
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Admin Panel — Book CRUD (V2)', () => {

  // ── GET /api/admin/pending ─────────────────────────────────────────────────
  describe('GET /api/admin/pending', () => {

    it('returns 403 when called without admin role', async () => {
      const res = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'user');

      expect(res.statusCode).toBe(403);
    });

    it('returns empty list when no pending books exist', async () => {
      const res = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });

    it('returns only pending (non-deleted) books', async () => {
      await makePendingBook({ bookName: 'Pending A' });
      await makePendingBook({ bookName: 'Pending B' });
      await makePendingBook({ bookName: 'Approved Book',   status: 'approved' });
      await makePendingBook({ bookName: 'Deleted Pending', isDeleted: true });

      const res = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(2);
      const names = res.body.data.map(b => b.bookName);
      expect(names).toContain('Pending A');
      expect(names).toContain('Pending B');
      expect(names).not.toContain('Approved Book');
      expect(names).not.toContain('Deleted Pending');
    });

    it('super_admin can also access pending books', async () => {
      await makePendingBook();
      const res = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'super_admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
    });
  });

  // ── PUT /api/admin/approve/:id ─────────────────────────────────────────────
  describe('PUT /api/admin/approve/:id', () => {

    it('approves a pending book and sets status to approved', async () => {
      const book = await makePendingBook();

      const res = await request(app)
        .put(`/api/admin/approve/${book._id}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');

      const updated = await Book.findById(book._id);
      expect(updated.status).toBe('approved');
    });

    it('returns 404 for a non-existent book ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/admin/approve/${fakeId}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(404);
    });

    it('returns 403 when called without admin role', async () => {
      const book = await makePendingBook();
      const res = await request(app)
        .put(`/api/admin/approve/${book._id}`)
        .set('x-role', 'user');

      expect(res.statusCode).toBe(403);
      const unchanged = await Book.findById(book._id);
      expect(unchanged.status).toBe('pending');
    });

    it('can approve an already-approved book (idempotent)', async () => {
      const book = await makePendingBook({ status: 'approved' });
      const res = await request(app)
        .put(`/api/admin/approve/${book._id}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });
  });

  // ── DELETE /api/admin/reject/:id ───────────────────────────────────────────
  describe('DELETE /api/admin/reject/:id', () => {

    it('rejects a book: sets status=rejected and isDeleted=true (soft delete)', async () => {
      const book = await makePendingBook();

      const res = await request(app)
        .delete(`/api/admin/reject/${book._id}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // V2: soft delete — document still exists in DB
      const found = await Book.findById(book._id);
      expect(found).not.toBeNull();
      expect(found.isDeleted).toBe(true);
      expect(found.status).toBe('rejected');
    });

    it('returns 404 for a non-existent book ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/admin/reject/${fakeId}`)
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(404);
    });

    it('returns 403 when called without admin role', async () => {
      const book = await makePendingBook();
      const res = await request(app)
        .delete(`/api/admin/reject/${book._id}`)
        .set('x-role', 'user');

      expect(res.statusCode).toBe(403);
      const unchanged = await Book.findById(book._id);
      expect(unchanged.isDeleted).toBe(false);
    });

    it('rejected book no longer appears in pending list', async () => {
      const book = await makePendingBook();

      await request(app)
        .delete(`/api/admin/reject/${book._id}`)
        .set('x-role', 'admin');

      const res = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'admin');

      expect(res.body.count).toBe(0);
    });
  });

  // ── Full CRUD flow ─────────────────────────────────────────────────────────
  describe('Full admin moderation flow', () => {

    it('pending → approved: no longer in pending queue, DB status=approved', async () => {
      const book = await makePendingBook({ bookName: 'Flow Test Book' });

      const pendingRes = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'admin');
      expect(pendingRes.body.count).toBe(1);

      await request(app)
        .put(`/api/admin/approve/${book._id}`)
        .set('x-role', 'admin');

      const afterApprove = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'admin');
      expect(afterApprove.body.count).toBe(0);

      const updated = await Book.findById(book._id);
      expect(updated.status).toBe('approved');
      expect(updated.isDeleted).toBe(false);
    });

    it('pending → rejected: soft-deleted, not in pending queue', async () => {
      const book = await makePendingBook({ bookName: 'Reject Flow Book' });

      await request(app)
        .delete(`/api/admin/reject/${book._id}`)
        .set('x-role', 'admin');

      const pendingRes = await request(app)
        .get('/api/admin/pending')
        .set('x-role', 'admin');
      expect(pendingRes.body.count).toBe(0);

      const found = await Book.findById(book._id);
      expect(found.isDeleted).toBe(true);
      expect(found.status).toBe('rejected');
    });
  });
});
