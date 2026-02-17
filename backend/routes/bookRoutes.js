const express = require('express');
const router = express.Router();
const {
  createBook,
  getAllApprovedBooks,
  getBookBySlug,
  searchBooks,
  getSellerBooks,
  deleteBook,
} = require('../controllers/bookController');

const upload = require('../middleware/uploadMiddleware');

// Order matters! 
// /search must be before /:slug to prevent "search" being treated as a slug
router.get('/search', searchBooks);
router.get('/user', getSellerBooks); // Must be before /:slug
router.route('/').get(getAllApprovedBooks).post(upload.array('images', 3), createBook);
router.route('/:slug').get(getBookBySlug);
router.delete('/id/:id', deleteBook); // Changed from /:id to /id/:id to avoid conflict with /:slug

module.exports = router;
