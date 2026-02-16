const Book = require('../models/Book');

// @desc    Get all pending books for moderation
// @route   GET /api/admin/pending
// @access  Private (Admin Only)
const getPendingBooks = async (req, res, next) => {
  try {
    const pendingBooks = await Book.find({ status: 'pending' }).sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      success: true,
      count: pendingBooks.length,
      data: pendingBooks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a book listing
// @route   PUT /api/admin/approve/:id
// @access  Private (Admin Only)
const approveBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    book.status = 'approved';
    await book.save();

    console.log(`[Admin] Book approved: ${book._id}`);

    res.status(200).json({
      success: true,
      message: 'Book approved successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject (Delete) a book listing
// @route   DELETE /api/admin/reject/:id
// @access  Private (Admin Only)
const rejectBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Permanently delete the listing to keep DB clean (Liquidity focus)
    await book.deleteOne();

    console.log(`[Admin] Book rejected/deleted: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Book rejected and removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingBooks,
  approveBook,
  rejectBook,
};
