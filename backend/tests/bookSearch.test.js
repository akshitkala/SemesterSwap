/**
 * Phase 6 — Search & Filters (bookSearch.test.js)
 *
 * Tests all searchBooks query params:
 *  - ?q=           text search (optional)
 *  - ?condition=   new|good|used with validation
 *  - ?minPrice=    ?maxPrice= with validation
 *  - ?subject=     subject filter
 *  - ?sort=        newest|price_asc|price_desc with validation
 *  - ?page=        ?limit= pagination with validation
 *  - combined      multi-param queries
 *  - security      only approved, non-deleted books returned
 */

const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const User = require('../models/User');
const mongoose = require('mongoose');

// No auth needed — search endpoint is public

// ─── Helpers ──────────────────────────────────────────────────────────────────
let uidCounter = 0;
let slugCounter = 0;

const makeSeller = () =>
  User.create({
    uid: `uid_search_${++uidCounter}_${Date.now()}`,
    email: `seller${uidCounter}@test.com`,
    displayName: 'Search Seller',
    role: 'user',
    isActive: true,
  });

const makeBook = (sellerId, overrides = {}) =>
  Book.create({
    bookName:    `Book ${++slugCounter}`,
    subject:     'General',
    price:       100,
    condition:   'good',
    sellerPhone: '9876543210',
    sellerEmail: 'seller@test.com',
    seller:      sellerId,
    status:      'approved',
    isDeleted:   false,
    images:      ['https://example.com/img.jpg'],
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Phase 6 — Search & Filters', () => {
  let seller;
  beforeEach(async () => {
    seller = await makeSeller();
  });

  // ── Basic search ────────────────────────────────────────────────────────────
  describe('Basic ?q= text search', () => {

    it('returns matching books by bookName (case-insensitive)', async () => {
      await makeBook(seller._id, { bookName: 'Calculus Advanced', subject: 'Math' });
      await makeBook(seller._id, { bookName: 'History of Rome',   subject: 'History' });

      const res = await request(app).get('/api/books/search?q=calculus');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].bookName).toMatch(/calculus/i);
    });

    it('returns matching books by subject', async () => {
      await makeBook(seller._id, { bookName: 'Book A', subject: 'Physics' });
      await makeBook(seller._id, { bookName: 'Book B', subject: 'Chemistry' });

      const res = await request(app).get('/api/books/search?q=physics');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('returns empty array when no match', async () => {
      await makeBook(seller._id, { bookName: 'Math Book' });

      const res = await request(app).get('/api/books/search?q=zzznomatch');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('returns all approved books when ?q= is omitted (browse mode)', async () => {
      await makeBook(seller._id, { bookName: 'Alpha' });
      await makeBook(seller._id, { bookName: 'Beta' });

      const res = await request(app).get('/api/books/search');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('returns 400 when ?q= exceeds 100 characters', async () => {
      const res = await request(app).get(`/api/books/search?q=${'a'.repeat(101)}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/too long/i);
    });

    it('includes pagination metadata in response', async () => {
      await makeBook(seller._id);

      const res = await request(app).get('/api/books/search');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('pages');
      expect(res.body.pagination).toHaveProperty('limit');
    });
  });

  // ── Condition filter ────────────────────────────────────────────────────────
  describe('?condition= filter', () => {

    it('filters by condition=new', async () => {
      await makeBook(seller._id, { condition: 'new' });
      await makeBook(seller._id, { condition: 'used' });

      const res = await request(app).get('/api/books/search?condition=new');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.condition).toBe('new'));
    });

    it('filters by condition=used', async () => {
      await makeBook(seller._id, { condition: 'new' });
      await makeBook(seller._id, { condition: 'used' });

      const res = await request(app).get('/api/books/search?condition=used');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.condition).toBe('used'));
    });

    it('returns 400 for invalid condition', async () => {
      const res = await request(app).get('/api/books/search?condition=excellent');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/condition must be one of/i);
    });

    it('combined: condition=good + q=math', async () => {
      await makeBook(seller._id, { bookName: 'Math 101', condition: 'good' });
      await makeBook(seller._id, { bookName: 'Math 102', condition: 'used' });

      const res = await request(app).get('/api/books/search?q=math&condition=good');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].condition).toBe('good');
    });
  });

  // ── Price filters ───────────────────────────────────────────────────────────
  describe('?minPrice= / ?maxPrice= filters', () => {

    it('filters by minPrice', async () => {
      await makeBook(seller._id, { price: 50 });
      await makeBook(seller._id, { price: 200 });

      const res = await request(app).get('/api/books/search?minPrice=100');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.price).toBeGreaterThanOrEqual(100));
    });

    it('filters by maxPrice', async () => {
      await makeBook(seller._id, { price: 50 });
      await makeBook(seller._id, { price: 500 });

      const res = await request(app).get('/api/books/search?maxPrice=100');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.price).toBeLessThanOrEqual(100));
    });

    it('filters by minPrice + maxPrice range', async () => {
      await makeBook(seller._id, { price: 50 });
      await makeBook(seller._id, { price: 150 });
      await makeBook(seller._id, { price: 500 });

      const res = await request(app).get('/api/books/search?minPrice=100&maxPrice=200');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => {
        expect(b.price).toBeGreaterThanOrEqual(100);
        expect(b.price).toBeLessThanOrEqual(200);
      });
    });

    it('returns 400 for non-numeric minPrice', async () => {
      const res = await request(app).get('/api/books/search?minPrice=abc');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/minPrice must be/i);
    });

    it('returns 400 for negative maxPrice', async () => {
      const res = await request(app).get('/api/books/search?maxPrice=-10');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/maxPrice must be/i);
    });

    it('returns 400 when minPrice > maxPrice', async () => {
      const res = await request(app).get('/api/books/search?minPrice=500&maxPrice=100');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/minPrice cannot be greater/i);
    });
  });

  // ── Subject filter ──────────────────────────────────────────────────────────
  describe('?subject= filter', () => {

    it('filters by subject (case-insensitive)', async () => {
      await makeBook(seller._id, { subject: 'Physics' });
      await makeBook(seller._id, { subject: 'Chemistry' });

      const res = await request(app).get('/api/books/search?subject=physics');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b =>
        expect(b.subject.toLowerCase()).toBe('physics')
      );
    });

    it('combined: subject= + condition=', async () => {
      await makeBook(seller._id, { subject: 'Math', condition: 'new' });
      await makeBook(seller._id, { subject: 'Math', condition: 'used' });

      const res = await request(app).get('/api/books/search?subject=math&condition=new');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ── Sort ────────────────────────────────────────────────────────────────────
  describe('?sort= parameter', () => {

    it('sort=newest returns most recently created first', async () => {
      await makeBook(seller._id, { price: 100 }); // older
      await new Promise(r => setTimeout(r, 10));   // ensure different createdAt
      await makeBook(seller._id, { price: 200 }); // newer

      const res = await request(app).get('/api/books/search?sort=newest');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      const dates = res.body.data.map(b => new Date(b.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('sort=price_asc returns cheapest first', async () => {
      await makeBook(seller._id, { price: 300 });
      await makeBook(seller._id, { price: 100 });
      await makeBook(seller._id, { price: 200 });

      const res = await request(app).get('/api/books/search?sort=price_asc');
      expect(res.statusCode).toBe(200);
      const prices = res.body.data.map(b => b.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i - 1]).toBeLessThanOrEqual(prices[i]);
      }
    });

    it('sort=price_desc returns most expensive first', async () => {
      await makeBook(seller._id, { price: 300 });
      await makeBook(seller._id, { price: 100 });
      await makeBook(seller._id, { price: 200 });

      const res = await request(app).get('/api/books/search?sort=price_desc');
      expect(res.statusCode).toBe(200);
      const prices = res.body.data.map(b => b.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i - 1]).toBeGreaterThanOrEqual(prices[i]);
      }
    });

    it('returns 400 for invalid ?sort=', async () => {
      const res = await request(app).get('/api/books/search?sort=alphabetical');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/sort must be one of/i);
    });

    it('defaults to sort=newest when sort is omitted', async () => {
      const res = await request(app).get('/api/books/search');
      expect(res.statusCode).toBe(200);
      // No error = default was accepted
    });
  });

  // ── Pagination ──────────────────────────────────────────────────────────────
  describe('?page= / ?limit= pagination', () => {

    it('page + limit narrows results', async () => {
      // Create 5 books
      for (let i = 0; i < 5; i++) await makeBook(seller._id);

      const res = await request(app).get('/api/books/search?page=1&limit=2');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('page=2 returns next batch', async () => {
      for (let i = 0; i < 5; i++) await makeBook(seller._id);

      const page1 = await request(app).get('/api/books/search?page=1&limit=3');
      const page2 = await request(app).get('/api/books/search?page=2&limit=3');

      expect(page1.body.data.length).toBe(3);
      expect(page2.body.data.length).toBe(2);
      expect(page1.body.pagination.total).toBe(page2.body.pagination.total);
    });

    it('pagination.pages is correct', async () => {
      for (let i = 0; i < 5; i++) await makeBook(seller._id);

      const res = await request(app).get('/api/books/search?limit=2');
      expect(res.body.pagination.pages).toBe(3); // ceil(5/2)
    });

    it('returns 400 for page=0', async () => {
      const res = await request(app).get('/api/books/search?page=0');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/page must be/i);
    });

    it('returns 400 for limit=0', async () => {
      const res = await request(app).get('/api/books/search?limit=0');
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for limit > 100', async () => {
      const res = await request(app).get('/api/books/search?limit=101');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/limit must be between/i);
    });
  });

  // ── Security / Data integrity ───────────────────────────────────────────────
  describe('Security — only correct books returned', () => {

    it('does NOT return pending (unapproved) books', async () => {
      await makeBook(seller._id, { bookName: 'Pending Book', status: 'pending' });
      await makeBook(seller._id, { bookName: 'Approved Book', status: 'approved' });

      const res = await request(app).get('/api/books/search?q=book');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.status).toBe('approved'));
    });

    it('does NOT return rejected books', async () => {
      await makeBook(seller._id, { bookName: 'Rejected Book', status: 'rejected', isDeleted: false });
      await makeBook(seller._id, { bookName: 'Approved Book', status: 'approved' });

      const res = await request(app).get('/api/books/search?q=book');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.status).toBe('approved'));
    });

    it('does NOT return soft-deleted books', async () => {
      await makeBook(seller._id, { bookName: 'Deleted Book', isDeleted: true });
      await makeBook(seller._id, { bookName: 'Live Book',    isDeleted: false });

      const res = await request(app).get('/api/books/search?q=book');
      expect(res.statusCode).toBe(200);
      res.body.data.forEach(b => expect(b.isDeleted).toBe(false));
    });

    it('all errors return success:false', async () => {
      const res = await request(app).get('/api/books/search?condition=invalid');
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
