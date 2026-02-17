const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: [true, 'Please add a book name'],
    trim: true,
    index: true, // Index for search performance
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
    enum: ['New', 'Good', 'Used'],
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
  sellerId: {
    type: String,
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
    enum: ['pending', 'approved'],
    default: 'pending',
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

module.exports = mongoose.model('Book', bookSchema);
