const express = require('express');
const router = express.Router();
const {
  createBook,
  getAllApprovedBooks,
  getBookBySlug,
  searchBooks,
} = require('../controllers/bookController');

const upload = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

// Order matters! 
// /search must be before /:slug to prevent "search" being treated as a slug
router.get('/search', searchBooks);
router.route('/').get(getAllApprovedBooks).post(verifyToken, upload.array('images', 3), createBook);
router.route('/:slug').get(getBookBySlug);

module.exports = router;
