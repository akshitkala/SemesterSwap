const express = require('express');
const router = express.Router();
const {
  getPendingBooks,
  approveBook,
  rejectBook,
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All routes here are protected: must be authenticated AND have admin or super_admin role
router.use(verifyToken);
router.use(requireRole(['admin', 'super_admin']));

// ── Moderation (Phase 3) ──────────────────────────────────────────────────────
router.get('/pending',          getPendingBooks);
router.put('/approve/:id',      approveBook);
router.delete('/reject/:id',    rejectBook);

// ── Stats (Phase 4) ───────────────────────────────────────────────────────────
router.get('/stats',            getAdminStats);

// ── User Viewer — read-only (Phase 4) ─────────────────────────────────────────
// Note: uid (firebaseUid) is excluded at the controller level
router.get('/users',            getAdminUsers);
router.get('/users/:id',        getAdminUserById);

module.exports = router;
