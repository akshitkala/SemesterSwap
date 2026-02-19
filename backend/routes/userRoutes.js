const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require login
router.use(verifyToken);

router.get('/:id', getUserProfile);

module.exports = router;
