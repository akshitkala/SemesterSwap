/**
 * Book Routes Tests — V2 Schema
 *
 * V2 schema: seller = ObjectId ref User, condition lowercase, isDeleted soft-delete
 *
 * NOTE: jest.mock() factories are hoisted before variable declarations.
 * ObjectIds used inside mock factories must be created via require() inside the factory.
 */

const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const mongoose = require('mongoose');

// ─── Fixed ObjectId strings ───────────────────────────────────────────────────
const SELLER_ID = '000000000000000000000010';
const OTHER_ID  = '000000000000000000000011';

// ─── Auth Mock ────────────────────────────────────────────────────────────────
// x-user header: 'seller' (default) | 'other'
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const mongoose = require('mongoose');
    const who = req.headers['x-user'] || 'seller';
    if (who === 'other') {
      req.user = {
        _id: new mongoose.Types.ObjectId('000000000000000000000011'),
        email: 'other@test.com',
        role: 'user',
      };
    } else {
      req.user = {
        _id: new mongoose.Types.ObjectId('000000000000000000000010'),
        email: 'seller@test.com',
        role: 'user',
      };
    }
    next();
  }
}));

// ─── Cloudinary / Upload Mocks ────────────────────────────────────────────────
jest.mock('../utils/imageCompression', () => ({
  compressImage: jest.fn().mockResolvedValue(Buffer.from('mockCompressedImage')),
}));

jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((options, callback) => ({
      end: () => callback(null, { secure_url: 'https://mock-cdn.com/image.jpg' }),
    })),
  },
}));

jest.mock('../middleware/uploadMiddleware', () => ({
  array: () => (req, res, next) => {
    const count = parseInt(req.headers['x-mock-images-count'] || '1');
    req.files = Array.from({ length: count }, (_, i) => ({
      buffer: Buffer.from('mockImageBuffer'),
      originalname: `image${i + 1}.jpg`,
    }));
    next();
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeBook = (overrides = {}) =>
  Book.create({
    bookName:    'Default Book',
    subject:     'Mathematics',
    price:       200,
    condition:   'good',
    sellerPhone: '9876543210',
    status:      'approved',
    images:      ['https://example.com/img.jpg'],
    seller:      new mongoose.Types.ObjectId(SELLER_ID),
    sellerEmail: 'seller@test.com',
    isDeleted:   false,
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Book Routes (V2)', () => {

  // ── GET /api/books ─────────────────────────────────────────────────────────
  describe('GET /api/books — public approved listing', () => {

    it('returns only approved, non-deleted books', async () => {
      await makeBook({ bookName: 'Approved A' });
      await makeBook({ bookName: 'Approved B' });
      await makeBook({ bookName: 'Pending Book',  status: 'pending' });
      await makeBook({ bookName: 'Soft-Deleted',  isDeleted: true });

      const res = await request(app).get('/api/books');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      const names = res.body.data.map(b => b.bookName);
      expect(names).toContain('Approved A');
      expect(names).toContain('Approved B');
    });

    it('returns empty array when no approved books exist', async () => {
      const res = await request(app).get('/api/books');
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  // ── POST /api/books ────────────────────────────────────────────────────────
  describe('POST /api/books — create listing', () => {

    it('creates a book with status=pending and correct seller ObjectId', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('x-mock-images-count', '1')
        .send({
          bookName:    'New Physics Book',
          subject:     'Physics',
          price:       300,
          condition:   'new',
          sellerPhone: '9876543210',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookName).toBe('New Physics Book');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.isDeleted).toBe(false);

      const sellerId = res.body.data.seller?._id || res.body.data.seller;
      expect(sellerId.toString()).toBe(SELLER_ID);
    });

    it('normalizes condition to lowercase', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('x-mock-images-count', '1')
        .send({
          bookName:    'Condition Test',
          subject:     'Art',
          price:       100,
          condition:   'Good',
          sellerPhone: '9876543210',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.condition).toBe('good');
    });

    it('returns 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ bookName: 'Incomplete' });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid phone number (too short)', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({
          bookName:    'Bad Phone Book',
          subject:     'Math',
          price:       100,
          condition:   'used',
          sellerPhone: '123',
        });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when more than 3 images are uploaded', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('x-mock-images-count', '4')
        .send({
          bookName:    'Too Many Images',
          subject:     'Science',
          price:       200,
          condition:   'good',
          sellerPhone: '9876543210',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── GET /api/books/search ──────────────────────────────────────────────────
  describe('GET /api/books/search', () => {

    it('returns books matching the query (approved only)', async () => {
      await makeBook({ bookName: 'Chemistry 101', subject: 'Science' });
      await makeBook({ bookName: 'Physics 101',   subject: 'Science' });
      await makeBook({ bookName: 'Chemistry Pending', subject: 'Science', status: 'pending' });

      const res = await request(app).get('/api/books/search?q=Chemistry');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].bookName).toBe('Chemistry 101');
    });

    it('returns 200 if no query param provided (browse mode)', async () => {
      const res = await request(app).get('/api/books/search');
      expect(res.statusCode).toBe(200);
    });
  });

  // ── GET /api/books/:slug ───────────────────────────────────────────────────
  describe('GET /api/books/:slug', () => {

    it('returns a book by slug', async () => {
      const book = await makeBook({ bookName: 'Slug Test Book' });
      const res = await request(app).get(`/api/books/${book.slug}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bookName).toBe('Slug Test Book');
    });

    it('returns 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/books/does-not-exist-slug');
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /api/books/user ────────────────────────────────────────────────────
  describe("GET /api/books/user — seller's own books", () => {

    it('returns only books belonging to the authenticated seller', async () => {
      await makeBook({ bookName: 'My Book 1', seller: new mongoose.Types.ObjectId(SELLER_ID) });
      await makeBook({ bookName: 'My Book 2', seller: new mongoose.Types.ObjectId(SELLER_ID) });
      await makeBook({ bookName: 'Other Book', seller: new mongoose.Types.ObjectId(OTHER_ID) });

      const res = await request(app)
        .get('/api/books/user')
        .set('x-user', 'seller');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(2);
      const names = res.body.data.map(b => b.bookName);
      expect(names).toContain('My Book 1');
      expect(names).toContain('My Book 2');
      expect(names).not.toContain('Other Book');
    });

    it('excludes soft-deleted books from seller view', async () => {
      await makeBook({ bookName: 'Active Book',  seller: new mongoose.Types.ObjectId(SELLER_ID) });
      await makeBook({ bookName: 'Deleted Book', seller: new mongoose.Types.ObjectId(SELLER_ID), isDeleted: true });

      const res = await request(app)
        .get('/api/books/user')
        .set('x-user', 'seller');

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].bookName).toBe('Active Book');
    });
  });

  // ── PUT /api/books/:id — update ────────────────────────────────────────────
  describe('PUT /api/books/:id — update listing', () => {

    it('allows owner to update their book (resets to pending)', async () => {
      const book = await makeBook({
        bookName: 'Old Name',
        seller: new mongoose.Types.ObjectId(SELLER_ID),
      });

      const res = await request(app)
        .put(`/api/books/${book._id}`)
        .set('x-user', 'seller')
        .set('x-mock-images-count', '0')
        .send({ 
          bookName: 'Updated Name', 
          subject: 'History', 
          price: 250, 
          condition: 'used', 
          sellerPhone: '9876543210',
          existingImages: ['https://example.com/img.jpg'] 
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bookName).toBe('Updated Name');
      expect(res.body.data.condition).toBe('used');
    });

    it('returns 403 when non-owner tries to update', async () => {
      const book = await makeBook({
        bookName: 'Protected Book',
        seller: new mongoose.Types.ObjectId(SELLER_ID),
      });

      const res = await request(app)
        .put(`/api/books/${book._id}`)
        .set('x-user', 'other')
        .set('x-mock-images-count', '0')
        .send({ 
          bookName: 'Hacked Name', 
          subject: 'Math', 
          price: 100, 
          condition: 'good', 
          sellerPhone: '9876543210',
          existingImages: ['https://example.com/img.jpg'] 
        });

      expect(res.statusCode).toBe(403);
      const unchanged = await Book.findById(book._id);
      expect(unchanged.bookName).toBe('Protected Book');
    });
  });

  // ── DELETE /api/books/id/:id — soft delete ─────────────────────────────────
  describe('DELETE /api/books/id/:id — soft delete', () => {

    it('owner can soft-delete their book (isDeleted=true, document remains in DB)', async () => {
      const book = await makeBook({ seller: new mongoose.Types.ObjectId(SELLER_ID) });

      const res = await request(app)
        .delete(`/api/books/id/${book._id}`)
        .set('x-user', 'seller');

      expect(res.statusCode).toBe(200);

      const found = await Book.findById(book._id);
      expect(found).not.toBeNull();
      expect(found.isDeleted).toBe(true);
    });

    it('returns 403 when non-owner tries to delete', async () => {
      const book = await makeBook({ seller: new mongoose.Types.ObjectId(SELLER_ID) });

      const res = await request(app)
        .delete(`/api/books/id/${book._id}`)
        .set('x-user', 'other');

      expect(res.statusCode).toBe(403);
      const found = await Book.findById(book._id);
      expect(found.isDeleted).toBe(false);
    });

    it('returns 404 for non-existent book', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/books/id/${fakeId}`)
        .set('x-user', 'seller');

      expect(res.statusCode).toBe(404);
    });

    it('soft-deleted book no longer appears in public listing', async () => {
      const book = await makeBook({ seller: new mongoose.Types.ObjectId(SELLER_ID) });

      await request(app)
        .delete(`/api/books/id/${book._id}`)
        .set('x-user', 'seller');

      const res = await request(app).get('/api/books');
      expect(res.body.count).toBe(0);
    });
  });
});
