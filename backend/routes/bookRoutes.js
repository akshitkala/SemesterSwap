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

const { verifyToken } = require('../middleware/authMiddleware');

// Order matters! 
// /search must be before /:slug to prevent "search" being treated as a slug
router.get('/search', searchBooks);
router.get('/user', verifyToken, getSellerBooks); // Must be before /:slug
router.route('/').get(getAllApprovedBooks).post(verifyToken, upload.array('images', 3), createBook);
router.route('/:slug').get(getBookBySlug);
router.delete('/id/:id', verifyToken, deleteBook); // Changed from /:id to /id/:id to avoid conflict with /:slug

module.exports = router;
