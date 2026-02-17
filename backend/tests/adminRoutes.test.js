const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');


describe('Admin Routes', () => {
  let pendingBook;
  const adminKey = 'test-admin-secret'; 

  beforeEach(async () => {

    pendingBook = await Book.create({
      bookName: 'Pending Book',
      subject: 'Math',
      price: 100,
      condition: 'New',
      sellerPhone: '1234567890',
      status: 'pending',
      images: ['url']
    });
  });

  describe('GET /api/admin/pending', () => {
    it('should return pending books with correct admin key', async () => {
      const res = await request(app)
        .get('/api/admin/pending')
        .set('x-admin-key', adminKey);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].bookName).toBe('Pending Book');
    });

    it('should return 403 without admin key', async () => {
      const res = await request(app).get('/api/admin/pending');
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/admin/approve/:id', () => {
    it('should approve a pending book', async () => {
      const res = await request(app)
        .put(`/api/admin/approve/${pendingBook._id}`)
        .set('x-admin-key', adminKey);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');

      const updatedBook = await Book.findById(pendingBook._id);
      expect(updatedBook.status).toBe('approved');
    });

    it('should return 404 for non-existent book', async () => {
      const res = await request(app)
        .put('/api/admin/approve/507f1f77bcf86cd799439011')
        .set('x-admin-key', adminKey);
      
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/admin/reject/:id', () => {
    it('should reject (delete) a book', async () => {
      const res = await request(app)
        .delete(`/api/admin/reject/${pendingBook._id}`)
        .set('x-admin-key', adminKey);

      expect(res.statusCode).toBe(200);
      
      const book = await Book.findById(pendingBook._id);
      expect(book).toBeNull();
    });
  });
});
