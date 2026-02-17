const Book = require('../models/Book');

// @desc    Create a new book listing
// @route   POST /api/books
// @access  Public (for now, will be protected later)
const createBook = async (req, res, next) => {
  try {
    const { bookName, subject, price, condition, sellerPhone } = req.body;
    
    // Validate Phone Number (10-15 digits)
    const phoneRegex = /^\d{10,15}$/;
    if (!sellerPhone || !phoneRegex.test(sellerPhone)) {
        res.status(400);
        throw new Error('Please provide a valid phone number (10-15 digits)');
    }

    // Handle file uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path); // Cloudinary URL
    }

    if (images.length > 3) {
      res.status(400);
      throw new Error('You can upload a maximum of 3 images');
    }

    const book = await Book.create({
      bookName,
      subject,
      price,
      condition,
      images,
      sellerPhone,
      status: 'approved', // Auto-approve for MVP/dev
    });

    res.status(201).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all approved books
// @route   GET /api/books
// @access  Public
const getAllApprovedBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ status: 'approved' }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book by slug
// @route   GET /api/books/:slug
// @access  Public
const getBookBySlug = async (req, res, next) => {
  try {
    const book = await Book.findOne({ slug: req.params.slug });

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Optionally check if approved, or allow viewing pending if owner (later)
    if (book.status !== 'approved') {
       // For MVP public view, maybe hide pending? 
       // Start with strict approved check for public routes.
       res.status(404);
       throw new Error('Book not found or pending approval');
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search books by name
// @route   GET /api/books/search?q=...
// @access  Public
const searchBooks = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      res.status(400);
      throw new Error('Please provide a search query');
    }

    // Case-insensitive regex search on bookName OR subject
    // Filter by status: 'approved'
    const keyword = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
    const books = await Book.find({
      $or: [
        { bookName: { $regex: keyword, $options: 'i' } },
        { subject: { $regex: keyword, $options: 'i' } },
      ],
      status: 'approved',
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Get books by seller phone
// @route   GET /api/books/user?phone=...
// @access  Public (Self-Verification)
const getSellerBooks = async (req, res, next) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      res.status(400);
      throw new Error('Please provide a phone number');
    }

    // Return all statuses (pending/approved) for the seller
    const books = await Book.find({ sellerPhone: phone }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a book (Verify Phone)
// @route   DELETE /api/books/:id
// @access  Public (Self-Verification)
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phone } = req.body; // Phone passed in body to confirm ownership

    const book = await Book.findById(id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    if (!phone || book.sellerPhone !== phone) {
      res.status(401);
      throw new Error('Unauthorized: Phone number does not match seller');
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createBook,
  getAllApprovedBooks,
  getBookBySlug,
  searchBooks,
  getSellerBooks,
  deleteBook,
};
