const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  promoteUser,
  demoteUser,
  getAllListings,
  deleteListing,
  getDashboardStats,
  toggleUserStatus,
  approveListing,
  rejectListing,
  toggleApprovalMode,
  getActivityLogs,
} = require('../controllers/superAdminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const rateLimit = require('express-rate-limit');

// Rate limiter for super admin actions
const superAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes: rate-limited, verified, super_admin only
router.use(superAdminLimiter);
router.use(verifyToken);
router.use(requireRole(['super_admin']));

// ── User Management (5.1 + 5.2) ──────────────────────────────────────────────
router.get('/users',                getAllUsers);
router.put('/promote/:id',          promoteUser);
router.put('/demote/:id',           demoteUser);
router.put('/toggle-status/:id',    toggleUserStatus);

// ── Listing Management ────────────────────────────────────────────────────────
router.get('/listings',             getAllListings);
router.delete('/listing/:id',       deleteListing);
router.put('/approve-listing/:id',  approveListing);
router.put('/reject-listing/:id',   rejectListing);

// ── Platform Config (5.3) ─────────────────────────────────────────────────────
router.put('/config/approval-mode', toggleApprovalMode);

// ── Stats (5.5) ───────────────────────────────────────────────────────────────
router.get('/stats',                getDashboardStats);

// ── Audit Log Viewer (5.4) ────────────────────────────────────────────────────
router.get('/activity',             getActivityLogs);

module.exports = router;
