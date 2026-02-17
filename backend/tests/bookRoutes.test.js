const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');

// Mock upload middleware
jest.mock('../middleware/uploadMiddleware', () => {
  return {
    array: () => (req, res, next) => {
      const countHeader = req.headers['x-mock-images-count'];
      const count = countHeader ? parseInt(countHeader) : 2;
      
      req.files = Array.from({ length: count }, (_, i) => ({
        path: `http://mock-url.com/image${i + 1}.jpg`
      }));
      next();
    }
  };
});

describe('Book Routes', () => {
  describe('GET /api/books', () => {
    it('should return all approved books', async () => {
      // Create test data
      await Book.create([
        {
          bookName: 'Approved Book 1',
          subject: 'Math',
          price: 100,
          condition: 'New',
          sellerPhone: '1234567890',
          status: 'approved',
          images: ['url1']
        },
        {
          bookName: 'Pending Book',
          subject: 'Science',
          price: 50,
          condition: 'Used',
          sellerPhone: '1234567890',
          status: 'pending',
          images: ['url2']
        }
      ]);

      const res = await request(app).get('/api/books');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].bookName).toBe('Approved Book 1');
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book with valid data', async () => {
      const newBook = {
        bookName: 'New Physics Book',
        subject: 'Physics',
        price: 200,
        condition: 'Good',
        sellerPhone: '9876543210'
      };

      const res = await request(app)
        .post('/api/books')
        .send(newBook);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookName).toBe(newBook.bookName);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.slug).toBeDefined();
    });


    it('should return 400 if more than 3 images are uploaded', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('x-mock-images-count', '4')
        .send({
          bookName: 'Overloaded Book',
          subject: 'Physics',
          price: 200,
          condition: 'Good',
          sellerPhone: '9876543210'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({
          bookName: 'Incomplete Book'
        });

      expect(res.statusCode).toBe(400);
    });


    it('should return 400 for invalid phone number', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({
          bookName: 'Book with bad phone',
          subject: 'Math',
          price: 100,
          condition: 'New',
          sellerPhone: '123'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/books/search', () => {
    it('should return books matching query', async () => {
      await Book.create({
        bookName: 'Chemistry 101',
        subject: 'Science',
        price: 150,
        condition: 'Good',
        sellerPhone: '1234567890',
        status: 'approved'
      });

      const res = await request(app).get('/api/books/search?q=Chemistry');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].bookName).toBe('Chemistry 101');
    });

    it('should return 400 if no query provided', async () => {
      const res = await request(app).get('/api/books/search');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/books/:slug', () => {
    it('should return book by slug', async () => {
      const book = await Book.create({
        bookName: 'Unique Book',
        subject: 'Art',
        price: 300,
        condition: 'New',
        sellerPhone: '1234567890',
        status: 'approved'
      });

      const res = await request(app).get(`/api/books/${book.slug}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bookName).toBe('Unique Book');
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/books/non-existent-slug');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/books/id/:id', () => {
    it('should delete book if phone matches', async () => {
      const book = await Book.create({
        bookName: 'To Delete',
        subject: 'History',
        price: 50,
        condition: 'Used',
        sellerPhone: '5555555555',
        status: 'approved'
      });

      const res = await request(app)
        .delete(`/api/books/id/${book._id}`)
        .send({ phone: '5555555555' });

      expect(res.statusCode).toBe(200);
      
      const found = await Book.findById(book._id);
      expect(found).toBeNull();
    });

    it('should return 401 if phone does not match', async () => {
      const book = await Book.create({
        bookName: 'Secure Book',
        subject: 'Math',
        price: 50,
        condition: 'Used',
        sellerPhone: '5555555555',
        status: 'approved'
      });

      const res = await request(app)
        .delete(`/api/books/id/${book._id}`)
        .send({ phone: '1111111111' });

      expect(res.statusCode).toBe(401);
    });
  });
});
