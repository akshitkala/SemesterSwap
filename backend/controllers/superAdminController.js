const User = require('../models/User');
const Book = require('../models/Book');
const AdminActivity = require('../models/AdminActivity');
const SystemConfig = require('../models/SystemConfig');
const admin = require('../config/firebaseAdmin');

// V2 helper: log admin actions using the V2 AdminActivity schema
// actor = req.user._id (ObjectId), actorType = 'user'|'system'
// target = ObjectId, targetModel = 'User'|'Book'
// action = uppercase string e.g. USER_PROMOTED, LISTING_APPROVED
const logActivity = async ({ actor, actorType, target, targetModel, action, metadata = {} }) => {
  try {
    await AdminActivity.create({ actor, actorType, target, targetModel, action, metadata });
  } catch (error) {
    console.error('[logActivity] Failed to log activity:', error);
  }
};

// @desc    Get all users with role and listing stats
// @route   GET /api/super-admin/users
// @access  Super Admin
const getAllUsers = async (req, res, next) => {
  try {
    // V2: exclude uid (firebaseUid) from response
    const users = await User.find().select('-uid -__v').sort({ createdAt: -1 });

    // Aggregate listing counts using V2 seller field (ObjectId)
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const listingCount = await Book.countDocuments({ seller: user._id, isDeleted: false });
      return { ...user.toObject(), listingCount };
    }));

    res.status(200).json({ success: true, data: usersWithStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Promote user to admin
// @route   PUT /api/super-admin/promote/:id
// @access  Super Admin
const promoteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) { res.status(404); throw new Error('User not found'); }

    // Cannot promote self
    if (user._id.equals(req.user._id)) {
      res.status(400); throw new Error('Cannot promote yourself');
    }

    // Cannot change role of another super_admin
    if (user.role === 'super_admin') {
      res.status(400); throw new Error('Cannot change role of super_admin');
    }

    // Already an admin — return 400 per roadmap spec
    if (user.role === 'admin') {
      res.status(400); throw new Error('User is already an admin');
    }

    const oldRole = user.role;
    user.role = 'admin';
    await user.save();

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: user._id,
      targetModel: 'User',
      action: 'USER_PROMOTED',
      metadata: { oldRole, newRole: 'admin' },
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Demote admin to user
// @route   PUT /api/super-admin/demote/:id
// @access  Super Admin
const demoteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) { res.status(404); throw new Error('User not found'); }

    // Cannot demote self
    if (user._id.equals(req.user._id)) {
      res.status(400); throw new Error('Cannot demote yourself');
    }

    // Cannot demote super_admin
    if (user.role === 'super_admin') {
      res.status(400); throw new Error('Cannot demote super_admin');
    }

    // Not an admin — nothing to demote
    if (user.role !== 'admin') {
      res.status(400); throw new Error('User is not an admin');
    }

    const oldRole = user.role;
    user.role = 'user';
    await user.save();

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: user._id,
      targetModel: 'User',
      action: 'USER_DEMOTED',
      metadata: { oldRole, newRole: 'user' },
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all listings (for super admin moderation)
// @route   GET /api/super-admin/listings
// @access  Super Admin
const getAllListings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { isDeleted: false };

    if (status && status !== 'all') query.status = status;
    if (search) query.bookName = { $regex: search, $options: 'i' };

    const listings = await Book.find(query)
      .populate('seller', 'displayName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete any listing
// @route   DELETE /api/super-admin/listing/:id
// @access  Super Admin
const deleteListing = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) { res.status(404); throw new Error('Book not found'); }

    book.isDeleted = true;
    await book.save();

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: book._id,
      targetModel: 'Book',
      action: 'LISTING_DELETED',
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/super-admin/stats
// @access  Super Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, disabledUsers, adminCount,
      totalListings, pendingListings, approvedListings, rejectedListings,
      config,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: 'admin' }),
      Book.countDocuments({ isDeleted: false }),
      Book.countDocuments({ status: 'pending', isDeleted: false }),
      Book.countDocuments({ status: 'approved', isDeleted: false }),
      Book.countDocuments({ status: 'rejected', isDeleted: false }),
      SystemConfig.findOne(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, disabled: disabledUsers, adminCount },
        listings: { total: totalListings, pending: pendingListings, approved: approvedListings, rejected: rejectedListings },
        currentApprovalMode: config ? config.approvalMode : 'manual',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (ban/unban) — two-layer enforcement
// @route   PUT /api/super-admin/toggle-status/:id
// @access  Super Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) { res.status(404); throw new Error('User not found'); }

    // Cannot ban self
    if (user._id.equals(req.user._id)) {
      res.status(400); throw new Error('Cannot disable yourself');
    }

    // Cannot ban another super_admin
    if (user.role === 'super_admin') {
      res.status(400); throw new Error('Cannot disable super_admin');
    }

    // Capture intent BEFORE any mutations so audit action is unambiguous
    const isBanning = user.isActive; // true = currently active → about to be banned

    // Layer 1: flip isActive in DB
    user.isActive = !user.isActive;
    await user.save();

    // Layer 2: revoke Firebase refresh tokens immediately (invalidates active sessions)
    // Only needed when banning — unbanning doesn't require token action
    if (isBanning) {
      try {
        await admin.auth().revokeRefreshTokens(user.uid);
      } catch (firebaseError) {
        // Log but don't fail — DB ban already applied; user will be blocked on next token check
        console.error('[toggleUserStatus] Firebase token revocation failed:', firebaseError.message);
      }
    }

    const action = isBanning ? 'USER_BANNED' : 'USER_UNBANNED';
    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: user._id,
      targetModel: 'User',
      action,
      metadata: { previousStatus: isBanning, newIsActive: user.isActive },
    });

    // Return user without uid (firebaseUid must never be exposed)
    const safeUser = user.toObject();
    delete safeUser.uid;
    res.status(200).json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve listing
// @route   PUT /api/super-admin/approve-listing/:id
// @access  Super Admin
const approveListing = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) { res.status(404); throw new Error('Book not found'); }

    book.status = 'approved';
    await book.save();

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: book._id,
      targetModel: 'Book',
      action: 'LISTING_APPROVED',
    });

    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject listing
// @route   PUT /api/super-admin/reject-listing/:id
// @access  Super Admin
const rejectListing = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) { res.status(404); throw new Error('Book not found'); }

    book.status = 'rejected';
    await book.save();

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: book._id,
      targetModel: 'Book',
      action: 'LISTING_REJECTED',
    });

    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle approval mode (manual <-> automatic)
// @route   PUT /api/super-admin/config/approval-mode
// @access  Super Admin
const toggleApprovalMode = async (req, res, next) => {
  try {
    // M2: Use atomic aggregation pipeline update to eliminate the read-modify-write
    // race condition. Two concurrent requests can no longer both compute the same
    // newMode and overwrite each other — MongoDB handles the toggle atomically.
    const config = await SystemConfig.findOneAndUpdate(
      {},
      [{
        $set: {
          approvalMode: {
            $cond: [{ $eq: ['$approvalMode', 'manual'] }, 'automatic', 'manual'],
          },
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      }],
      { new: true }
    );

    if (!config) {
      res.status(500);
      throw new Error('SystemConfig not found — run migration script');
    }

    // Derive the old mode from the new mode (since we only have the post-update doc)
    const newMode = config.approvalMode;
    const oldMode = newMode === 'manual' ? 'automatic' : 'manual';

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: config._id,
      targetModel: 'User',
      action: 'APPROVAL_MODE_CHANGED',
      metadata: { oldMode, newMode },
    });

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit activity logs (paginated + filtered)
// @route   GET /api/super-admin/activity
// @access  Super Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, actorType, actor, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (action)    filter.action    = action;
    if (actorType) filter.actorType = actorType;
    if (actor)     filter.actor     = actor;
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo)   filter.timestamp.$lte = new Date(dateTo);
    }

    const activities = await AdminActivity.find(filter)
      .populate({ path: 'actor', select: 'displayName email', match: { _id: { $exists: true } } })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AdminActivity.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
