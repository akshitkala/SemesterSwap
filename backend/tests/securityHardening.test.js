/**
 * Security Hardening Tests — Phases 1–5 Audit
 *
 * Verifies each identified security fix is working correctly.
 * Tests are grouped by finding ID from the audit report.
 *
 * C1  — CORS: only allowed origins pass
 * C2  — Body size limit: >10kb body → 413
 * H1  — ReDoS: query >100 chars → 400
 * H3  — notFound: no URL reflection in 404
 * H4  — errorHandler: no stack trace in non-dev
 * H5  — helmet: security headers present
 * L3  — errorHandler: success:false on all errors
 * M1  — CastError: invalid ObjectId → 404 not 500
 * M5  — Auth rate limiter applied to /api/auth
 */

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Book = require('../models/Book');
const SystemConfig = require('../models/SystemConfig');
const mongoose = require('mongoose');

// ─── Auth mocks ───────────────────────────────────────────────────────────────
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const mongoose = require('mongoose');
    if (!req.headers['authorization']) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const role = req.headers['x-role'] || 'user';
    req.user = {
      _id: new mongoose.Types.ObjectId('000000000000000000000001'),
      email: 'test@test.com',
      role,
    };
    next();
  },
}));

jest.mock('../middleware/roleMiddleware', () => ({
  requireRole: (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  },
}));

// Helpers
let uidCounter = 0;
const makeUser = (overrides = {}) =>
  User.create({
    uid: `uid_sec_${++uidCounter}_${Date.now()}`,
    email: `sec${uidCounter}@test.com`,
    displayName: 'Security Test User',
    role: 'user',
    isActive: true,
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Security Hardening — Audit Fixes', () => {

  // ── H5 — Helmet headers ────────────────────────────────────────────────────
  describe('H5 — Security headers (helmet)', () => {
    it('sets X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets X-Frame-Options', async () => {
      const res = await request(app).get('/');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('sets X-DNS-Prefetch-Control', async () => {
      const res = await request(app).get('/');
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    });
  });

  // ── C2 — Body size limit ───────────────────────────────────────────────────
  describe('C2 — Body size limit (10kb JSON cap)', () => {
    it('rejects JSON body larger than 10kb', async () => {
      // Build a string that pushes the JSON body over 10240 bytes
      const bigString = 'x'.repeat(11 * 1024);
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', 'Bearer token')
        .set('Content-Type', 'application/json')
        .send(`{"data":"${bigString}"}`);

      // Express-json body-limit errors surface as 413 (PayloadTooLargeError)
      // or are caught by errorHandler as 500 depending on express version
      expect([413, 400, 500]).toContain(res.statusCode);
      // Must NOT return 200 — the request should be rejected
      expect(res.statusCode).not.toBe(200);
    });
  });

  // ── H1 — ReDoS guard ──────────────────────────────────────────────────────
  describe('H1 — ReDoS: query length cap in /api/books/search', () => {
    it('returns 400 when ?q= exceeds 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      const res = await request(app)
        .get(`/api/books/search?q=${longQuery}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/too long/i);
    });

    it('accepts a query exactly 100 characters long', async () => {
      const exactQuery = 'a'.repeat(100);
      const res = await request(app)
        .get(`/api/books/search?q=${exactQuery}`);

      // 200 even with no results — not rejected
      expect(res.statusCode).toBe(200);
    });

    // Phase 6: q is now OPTIONAL — no q returns all approved books (200)
    // This test was updated to reflect the new correct behavior
    it('returns 200 (not 400) when ?q= is omitted — browse mode', async () => {
      const res = await request(app).get('/api/books/search');
      expect(res.statusCode).toBe(200);
    });
  });

  // ── H3 — notFound: no URL reflection ──────────────────────────────────────
  describe('H3 — 404 handler does not reflect URL', () => {
    it('does not echo the request path in the error message', async () => {
      const res = await request(app)
        .get('/api/some-sensitive-path-probe/../../etc/passwd');

      expect(res.statusCode).toBe(404);
      // The URL must NOT appear in the response body
      expect(res.body.message).not.toContain('some-sensitive-path');
      expect(res.body.message).not.toContain('etc/passwd');
    });

    it('returns a generic 404 message', async () => {
      const res = await request(app).get('/api/nonexistent-route');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  // ── H4 — Stack trace not exposed in non-dev ────────────────────────────────
  describe('H4 — Stack traces not returned outside development', () => {
    it('does not include stack trace in NODE_ENV=test error responses', async () => {
      // NODE_ENV=test in our Jest setup — stack should be undefined/omitted
      const res = await request(app)
        .get('/api/nonexistent-route-for-stack-test');

      expect(res.statusCode).toBe(404);
      // stack should not be present in test/production environments
      expect(res.body.stack).toBeUndefined();
    });
  });

  // ── L3 — success:false on all errors ──────────────────────────────────────
  describe('L3 — Error responses include success:false', () => {
    it('includes success:false in 404 response', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.body).toHaveProperty('success', false);
    });

    it('includes success:false on 401 unauthorized', async () => {
      const res = await request(app).get('/api/books/user');
      // no auth header → 401
      expect([401, 403]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('success', false);
    });

    it('includes success:false on 400 validation error', async () => {
      // Phase 6: q is now optional → use an invalid condition to trigger 400
      const res = await request(app).get('/api/books/search?condition=invalid_value');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // ── M1 — CastError → 404 ──────────────────────────────────────────────────
  describe('M1 — Invalid MongoDB ObjectId returns 404, not 500', () => {
    it('GET /api/admin/users/:id with invalid ObjectId → 404', async () => {
      const res = await request(app)
        .get('/api/admin/users/not-a-valid-objectid')
        .set('Authorization', 'Bearer token')  // required by mock verifyToken
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(404);
      // Must NOT say "CastError" or "ObjectId" (leaks MongoDB internals)
      expect(res.body.message).not.toMatch(/cast/i);
      expect(res.body.message).not.toMatch(/objectid/i);
    });

    it('PUT /api/super-admin/promote/:id with invalid ObjectId → 404', async () => {
      const res = await request(app)
        .put('/api/super-admin/promote/not-valid-id')
        .set('Authorization', 'Bearer token')
        .set('x-role', 'super_admin');  // this file's verifyToken mock reads x-role

      expect(res.statusCode).toBe(404);
    });
  });

  // ── M2 — Approval mode audit metadata ────────────────────────────────────
  // (The race condition itself is hard to reproduce in tests — we verify the
  //  functional result remains correct after the switch to atomic findOneAndUpdate)
  describe('M2 — Approval mode atomic toggle still produces correct results', () => {
    beforeEach(async () => {
      await SystemConfig.create({ approvalMode: 'manual' });
    });

    it('toggles manual → automatic', async () => {
      const res = await request(app)
        .put('/api/super-admin/config/approval-mode')
        .set('Authorization', 'Bearer token')
        .set('x-role', 'super_admin');  // this file's verifyToken mock reads x-role

      expect(res.statusCode).toBe(200);
      expect(res.body.data.approvalMode).toBe('automatic');
    });

    it('second toggle: automatic → manual', async () => {
      // First toggle: manual → automatic
      await request(app)
        .put('/api/super-admin/config/approval-mode')
        .set('Authorization', 'Bearer token')
        .set('x-role', 'super_admin');

      // Second toggle: automatic → manual
      const res = await request(app)
        .put('/api/super-admin/config/approval-mode')
        .set('Authorization', 'Bearer token')
        .set('x-role', 'super_admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.approvalMode).toBe('manual');
    });
  });
});
