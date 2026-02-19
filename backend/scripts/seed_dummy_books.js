const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Book = require('../models/Book');

console.log('API KEY Loaded:', process.env.CLOUDINARY_API_KEY ? 'YES' : 'NO');
console.log('CLOUD NAME:', process.env.CLOUDINARY_CLOUD_NAME);

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Literature', 'History', 'Engineering', 'Economics'];
const conditions = ['new', 'good', 'used'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedBooks = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'akshitkala72@gmail.com';
    const superAdmin = await User.findOne({ email: superAdminEmail });

    if (!superAdmin) {
      console.error(`Super Admin (${superAdminEmail}) not found! Please ensure account exists.`);
      process.exit(1);
    }
    console.log(`Seeding data for Super Admin: ${superAdmin.displayName} (${superAdmin._id})`);

    // 1. Upload One Image
    console.log('Uploading sample image to Cloudinary...');
    const sampleImagePath = path.resolve(__dirname, '../../frontend/public/sample/images/download.png');
    
    const uploadResult = await cloudinary.uploader.upload(sampleImagePath, {
      folder: 'semester_swap',
      resource_type: 'image'
    });
    
    const imageUrl = uploadResult.secure_url;
    console.log('Image uploaded:', imageUrl);

    // 2. Create 30 Books
    console.log('Creating 30 dummy books...');
    
    for (let i = 1; i <= 30; i++) {
       const subject = getRandomElement(subjects);
       
       const bookData = {
           bookName: `${subject} Textbook Vol ${i} - ${Math.random().toString(36).substring(7)}`, // Unique name to ensure unique slug
           subject: subject,
           price: Math.floor(Math.random() * 900) + 100, // 100-1000
           condition: getRandomElement(conditions),
           images: [imageUrl], // Use the same image
           seller: superAdmin._id,
           sellerEmail: superAdmin.email,
           sellerPhone: '9876543210',
           status: 'approved', // Auto-approve
           createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)) // Random past time
       };
       await Book.create(bookData);
       process.stdout.write('.');
    }
    console.log('\n30 Books created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedBooks();
