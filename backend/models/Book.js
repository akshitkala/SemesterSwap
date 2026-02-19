const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: [true, 'Please add a book name'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be a positive number'],
  },
  condition: {
    type: String,
    required: [true, 'Please select condition'],
    enum: ['new', 'good', 'used'],  // V2: lowercase to match TRD spec
  },
  images: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: 'You can upload a maximum of 3 images',
    },
  },
  sellerPhone: {
    type: String,
    required: [true, 'Seller phone number is required'],
  },
  // V2: seller is now a proper ObjectId ref to User (was sellerId: String in V1)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sellerEmail: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to generate slug from bookName before saving
bookSchema.pre('save', async function (next) {
  if (!this.isModified('bookName')) {
    next();
    return;
  }

  // Basic slugify: lowercase, replace spaces with hyphens, remove special chars
  let slug = this.bookName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  // Ensure uniqueness by appending 4 random chars
  // We do this almost always to avoid "math-book-1", "math-book-2" collisions
  // and efficiently guarantee unique URLs.
  const randomString = Math.random().toString(36).substring(2, 6);
  slug = `${slug}-${randomString}`;

  this.slug = slug;
  next();
});

// ── Phase 6 compound indexes for search & filter performance ──────────────────
// Supports: sort=newest (status+isDeleted covered, then sort by createdAt)
bookSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
// Supports: sort=price_asc / price_desc + minPrice/maxPrice filter
bookSchema.index({ status: 1, isDeleted: 1, price: 1 });
// Supports: condition filter
bookSchema.index({ status: 1, isDeleted: 1, condition: 1 });

// Compound index for the main listing query (approved + not deleted)
bookSchema.index({ status: 1, isDeleted: 1 });
// Compound index for the sorted listing on the home page
bookSchema.index({ createdAt: -1, status: 1, isDeleted: 1 });

module.exports = mongoose.model('Book', bookSchema);

