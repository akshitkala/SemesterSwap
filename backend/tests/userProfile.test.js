const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const userController = require('../controllers/userController');

require('dotenv').config();

// Setup a small app just for testing the controller, bypassing auth middleware
const app = express();
app.use(express.json());
app.get('/api/users/:id', userController.getUserProfile);

describe('User Profile API (Controller Logic)', () => {
  let user;
  let book;

  // setup.js handles mongoose connection/disconnection and DB clearing
  
  beforeEach(async () => {
    // Create a temporary test user
    user = await User.create({
      uid: 'testuid-' + Date.now(),
      email: 'testprofile@example.com',
      displayName: 'Test Profile User',
      photoURL: 'http://example.com/photo.jpg',
      role: 'user'
    });

    // Create a book for this user
    book = await Book.create({
        bookName: 'Test Profile Book',
        subject: 'Testing',
        condition: 'new',
        price: 100,
        description: 'A test book',
        seller: user._id,
        sellerPhone: '1234567890',
        sellerEmail: 'testprofile@example.com',
        images: ['http://example.com/book.jpg'],
        status: 'approved'
    });
  });
  
  // afterAll handled by setup.js

  it('should return user profile and listings', async () => {
    const res = await request(app).get(`/api/users/${user._id}`);
    
    if (res.statusCode === 500) {
        console.log('500 Error Body:', res.text);
    }
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Test Profile User');
    expect(res.body.data.photoURL).toBe('http://example.com/photo.jpg');
    // Check listings
    expect(res.body.data.listings).toBeDefined();
    expect(res.body.data.listings.length).toBeGreaterThan(0);
    expect(res.body.data.listings[0].bookName).toBe('Test Profile Book');
  });

  it('should return 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/users/${fakeId}`);
    expect(res.statusCode).toEqual(404);
  });
});
