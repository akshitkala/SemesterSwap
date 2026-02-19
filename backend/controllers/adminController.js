const Book = require('../models/Book');
const User = require('../models/User');
const AdminActivity = require('../models/AdminActivity');

// V2 helper: log admin actions using the V2 AdminActivity schema
const logActivity = async ({ actor, actorType, target, targetModel, action, metadata = {} }) => {
  try {
    await AdminActivity.create({ actor, actorType, target, targetModel, action, metadata });
  } catch (error) {
    console.error('[logActivity] Failed to log activity:', error);
  }
};

// @desc    Get all pending books for moderation
// @route   GET /api/admin/pending
// @access  Admin+
const getPendingBooks = async (req, res, next) => {
  try {
    const pendingBooks = await Book.find({ status: 'pending', isDeleted: false })
      .populate('seller', 'displayName email')
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({ success: true, count: pendingBooks.length, data: pendingBooks });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a book listing
// @route   PUT /api/admin/approve/:id
// @access  Admin+
const approveBook = async (req, res, next) => {
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

    res.status(200).json({ success: true, message: 'Book approved successfully', data: book });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a book listing (soft delete + mark rejected)
// @route   DELETE /api/admin/reject/:id
// @access  Admin+
const rejectBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) { res.status(404); throw new Error('Book not found'); }

    book.status = 'rejected';
    book.isDeleted = true;
    await book.save();

    await logActivity({
      actor: req.user._id,
      actorType: 'user',
      target: book._id,
      targetModel: 'Book',
      action: 'LISTING_REJECTED',
    });

    res.status(200).json({ success: true, message: 'Book rejected and removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform statistics for the admin dashboard
// @route   GET /api/admin/stats
// @access  Admin+
const getAdminStats = async (req, res, next) => {
  try {
    // Run all counts in parallel for performance
    const [
      totalUsers,
      totalListings,
      pendingListings,
      approvedListings,
      rejectedListings,
    ] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments({ isDeleted: false }),
      Book.countDocuments({ status: 'pending',  isDeleted: false }),
      Book.countDocuments({ status: 'approved', isDeleted: false }),
      // Rejected books are soft-deleted; count all with status=rejected regardless of isDeleted
      Book.countDocuments({ status: 'rejected' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalListings,
        pendingListings,
        approvedListings,
        rejectedListings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (read-only viewer for admins)
// @route   GET /api/admin/users
// @access  Admin+
// Security: uid (firebaseUid) is NEVER included in the response
const getAdminUsers = async (req, res, next) => {
  try {
    // Explicitly exclude uid and __v — never expose firebaseUid
    const users = await User.find()
      .select('-uid -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single user by ID (read-only viewer for admins)
// @route   GET /api/admin/users/:id
// @access  Admin+
// Security: uid (firebaseUid) is NEVER included in the response
const getAdminUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-uid -__v');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingBooks,
  approveBook,
  rejectBook,
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
};
