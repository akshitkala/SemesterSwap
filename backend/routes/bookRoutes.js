const express = require('express');
const router = express.Router();
const {
  createBook,
  getAllApprovedBooks,
  getBookBySlug,
  searchBooks,
  getSellerBooks,
  deleteBook,
  updateBook,
  getBookById,
} = require('../controllers/bookController');

const upload = require('../middleware/uploadMiddleware');

const { verifyToken } = require('../middleware/authMiddleware');

// Order matters! 
// /search must be before /:slug to prevent "search" being treated as a slug
router.get('/search', searchBooks);
router.get('/user', verifyToken, getSellerBooks); // Must be before /:slug
router.route('/').get(getAllApprovedBooks).post(verifyToken, upload.array('images', 3), createBook);
router.route('/:slug').get(getBookBySlug);
router.put('/:id', verifyToken, upload.array('images', 3), updateBook);
router.route('/id/:id').get(verifyToken, getBookById).delete(verifyToken, deleteBook);

module.exports = router;
