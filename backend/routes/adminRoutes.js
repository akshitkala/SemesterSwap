const express = require('express');
const router = express.Router();
const {
  getPendingBooks,
  approveBook,
  rejectBook,
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/adminMiddleware');

// All routes here are protected by verifyToken AND adminAuth
router.use(verifyToken, adminAuth);

router.get('/pending', getPendingBooks);
router.put('/approve/:id', approveBook);
router.delete('/reject/:id', rejectBook);

module.exports = router;
