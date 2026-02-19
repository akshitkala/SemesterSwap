const Book = require('../models/Book');
const { compressImage } = require('../utils/imageCompression');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new book listing
// @route   POST /api/books
// @access  Private
const createBook = async (req, res, next) => {
  try {
    const { bookName, subject, price, condition, conditionDescription, sellerPhone } = req.body;

    // V2: seller is req.user._id (MongoDB ObjectId), not Firebase uid string
    const actorId = req.user._id;
    const sellerEmail = req.user.email;

    // Validate Phone Number (10-15 digits)
    const phoneRegex = /^\d{10,15}$/;
    if (!sellerPhone || !phoneRegex.test(sellerPhone)) {
      res.status(400);
      throw new Error('Please provide a valid phone number (10-15 digits)');
    }

    // Normalize condition to lowercase to match V2 enum (new|good|used)
    const normalizedCondition = condition ? condition.toLowerCase() : condition;

    // Handle file uploads
    let images = [];
    if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error('Please upload at least one image of the book');
    }

    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        res.status(400);
        throw new Error('You can upload a maximum of 3 images');
      }

      const uploadPromises = req.files.map(async (file) => {
        const compressedBuffer = await compressImage(file.buffer, file.originalname);

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'semester_swap', resource_type: 'image' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary Upload Error:', error);
                reject(new Error('Cloudinary upload failed'));
              } else {
                resolve(result.secure_url);
              }
            }
          );
          stream.end(compressedBuffer);
        });
      });

      try {
        images = await Promise.all(uploadPromises);
      } catch (error) {
        res.status(error.message === 'Cloudinary upload failed' ? 500 : 400);
        throw error;
      }
    }

    const book = await Book.create({
      bookName,
      subject,
      price,
      condition: normalizedCondition,
      conditionDescription,
      images,
      sellerPhone,
      seller: actorId,        // V2: ObjectId ref to User
      sellerEmail,
      status: 'pending',      // Secure default: always pending
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
    const books = await Book.find({ status: 'approved', isDeleted: false })
      .populate('seller', 'displayName email')
      .sort({ createdAt: -1 });

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
    const book = await Book.findOne({ slug: req.params.slug, isDeleted: false })
      .populate('seller', 'displayName email');

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    if (book.status !== 'approved') {
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

// @desc    Search/filter books
// @route   GET /api/books/search
// @access  Public
// @params  q (optional), condition, minPrice, maxPrice, subject, sort, page, limit
const searchBooks = async (req, res, next) => {
  try {
    const {
      q,
      condition,
      minPrice,
      maxPrice,
      subject,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    // ── Input validation ───────────────────────────────────────────────────────

    // H1: Cap text query length (ReDoS guard)
    if (q && q.length > 100) {
      res.status(400);
      throw new Error('Search query is too long (max 100 characters)');
    }

    const VALID_CONDITIONS = ['new', 'good', 'used'];
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      res.status(400);
      throw new Error(`condition must be one of: ${VALID_CONDITIONS.join(', ')}`);
    }

    const VALID_SORTS = ['newest', 'price_asc', 'price_desc'];
    if (!VALID_SORTS.includes(sort)) {
      res.status(400);
      throw new Error(`sort must be one of: ${VALID_SORTS.join(', ')}`);
    }

    const parsedMin = minPrice !== undefined ? Number(minPrice) : undefined;
    const parsedMax = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (parsedMin !== undefined && (isNaN(parsedMin) || parsedMin < 0)) {
      res.status(400);
      throw new Error('minPrice must be a non-negative number');
    }
    if (parsedMax !== undefined && (isNaN(parsedMax) || parsedMax < 0)) {
      res.status(400);
      throw new Error('maxPrice must be a non-negative number');
    }
    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      res.status(400);
      throw new Error('minPrice cannot be greater than maxPrice');
    }
    if (isNaN(parsedPage) || parsedPage < 1) {
      res.status(400);
      throw new Error('page must be a positive integer');
    }
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      res.status(400);
      throw new Error('limit must be between 1 and 100');
    }

    // ── Build filter ───────────────────────────────────────────────────────────

    const filter = { status: 'approved', isDeleted: false };

    // Text search (q) — optional: if absent, all approved books are eligible
    // Uses regex for substring matching (prefix/partial).
    // Note: $text search was considered but rejected because it requires full words.
    if (q) {
      const keyword = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { bookName: { $regex: keyword, $options: 'i' } },
        { subject:  { $regex: keyword, $options: 'i' } },
      ];
    }

    // Exact condition filter
    if (condition) {
      filter.condition = condition;
    }

    // Exact subject filter (separate from q — e.g. dropdown selector)
    if (subject) {
      filter.subject = { $regex: subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    // Price range
    if (parsedMin !== undefined || parsedMax !== undefined) {
      filter.price = {};
      if (parsedMin !== undefined) filter.price.$gte = parsedMin;
      if (parsedMax !== undefined) filter.price.$lte = parsedMax;
    }

    // ── Build sort ────────────────────────────────────────────────────────────

    const sortMap = {
      newest:     { createdAt: -1 },
      price_asc:  { price:  1 },
      price_desc: { price: -1 },
    };
    const sortObj = sortMap[sort];

    // ── Query ─────────────────────────────────────────────────────────────────

    const skip = (parsedPage - 1) * parsedLimit;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate('seller', 'displayName email')
        .sort(sortObj)
        .skip(skip)
        .limit(parsedLimit),
      Book.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
      pagination: {
        total,
        page:  parsedPage,
        pages: Math.ceil(total / parsedLimit),
        limit: parsedLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get books by seller (My Listings)
// @route   GET /api/books/user
// @access  Private
const getSellerBooks = async (req, res, next) => {
  try {
    // V2: query by seller ObjectId (req.user._id), not Firebase uid string
    const books = await Book.find({ seller: req.user._id, isDeleted: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private (owner only)
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bookName, subject, price, condition, sellerPhone } = req.body;

    const book = await Book.findById(id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Prevent editing if deleted
    if (book.isDeleted) {
      res.status(404);
      throw new Error('Book not found');
    }

    // V2: ownership check — compare ObjectIds via .equals()
    if (!book.seller.equals(req.user._id)) {
      res.status(403);
      throw new Error('Forbidden: You do not own this listing');
    }

    // Update allowed fields
    if (bookName)  book.bookName = bookName;
    if (subject)   book.subject  = subject;
    if (price)     book.price    = price;
    // Normalize condition to lowercase
    if (req.body.condition) book.condition = req.body.condition.toLowerCase();
    if (req.body.conditionDescription) book.conditionDescription = req.body.conditionDescription;
    if (req.body.sellerPhone) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(req.body.sellerPhone)) {
        res.status(400);
        throw new Error('Please provide a valid phone number (10-15 digits)');
      }
      book.sellerPhone = req.body.sellerPhone;
    }

    // Handle images
    let finalImages = [];
    if (req.body.existingImages) {
      finalImages = Array.isArray(req.body.existingImages)
        ? [...req.body.existingImages]
        : [req.body.existingImages];
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const compressedBuffer = await compressImage(file.buffer, file.originalname);
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'semester_swap', resource_type: 'image' },
            (error, result) => {
              if (error) reject(new Error('Cloudinary upload failed'));
              else resolve(result.secure_url);
            }
          );
          stream.end(compressedBuffer);
        });
      });

      try {
        const newImages = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...newImages];
      } catch (error) {
        res.status(error.message === 'Cloudinary upload failed' ? 500 : 400);
        throw error;
      }
    }

    if (finalImages.length > 3) {
      res.status(400);
      throw new Error('You can have a maximum of 3 images total');
    }
    if (finalImages.length === 0) {
        res.status(400);
        throw new Error('You must have at least one image of the book');
    }

    book.images = finalImages;

    // Roadmap spec: editing an approved listing resets status to pending
    book.status = 'pending';

    await book.save();

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a book (Soft Delete)
// @route   DELETE /api/books/id/:id
// @access  Private (owner only)
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // V2: ownership check via ObjectId .equals()
    if (!book.seller.equals(req.user._id)) {
      res.status(403);
      throw new Error('Forbidden: You do not own this listing');
    }

    // Soft Delete — never remove the document
    book.isDeleted = true;
    await book.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book by ID (for owner editing)
// @route   GET /api/books/id/:id
// @access  Private (owner only)
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    if (book.isDeleted) {
      res.status(404);
      throw new Error('Book not found');
    }

    // V2: ownership check via ObjectId .equals()
    if (!book.seller.equals(req.user._id)) {
      res.status(403);
      throw new Error('Forbidden: You do not own this listing');
    }

    res.status(200).json({
      success: true,
      data: book,
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
  updateBook,
  getBookById,
};
