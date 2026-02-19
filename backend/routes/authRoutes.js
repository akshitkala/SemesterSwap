const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Helper: return safe user shape — uid (firebaseUid) is NEVER exposed
const safeUser = (user) => {
  const obj = user.toObject();
  delete obj.uid;       // FIX 2: firebaseUid must never be returned in any API response
  delete obj.__v;
  return obj;
};

// @desc    Login / register via Firebase token
// @route   POST /api/auth/login
// @access  Public (token in Authorization header or body)
// Runs through verifyToken which auto-creates the user if first login.
// Returns: { _id, email, displayName, role, isActive, createdAt } — no uid.
router.post('/login', verifyToken, async (req, res, next) => {
  try {
    // verifyToken has already verified the Firebase token, found/created the
    // MongoDB user, checked isActive, and attached _id + role to req.user.
    // Re-fetch the clean Mongo document to return the full safe shape.
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found in database');
    }

    res.status(200).json({
      success: true,
      data: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found in database');
    }

    // FIX 2: Exclude uid from response
    res.status(200).json({
      success: true,
      data: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
