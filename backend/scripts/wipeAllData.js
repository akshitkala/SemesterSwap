const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Book = require('../models/Book');

const wipeData = async () => {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    // 2. Wipe Users (Except Super Admin)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'akshitkala72@gmail.com';
    console.log(`Deleting all users except ${superAdminEmail}...`);
    
    const userResult = await User.deleteMany({ email: { $ne: superAdminEmail } });
    console.log(`Deleted ${userResult.deletedCount} users.`);

    // 3. Wipe Books (All)
    console.log('Deleting all books...');
    const bookResult = await Book.deleteMany({});
    console.log(`Deleted ${bookResult.deletedCount} books.`);

    // 4. Wipe Cloudinary (Folder: semester_swap)
    console.log('Deleting Cloudinary resources in folder: semester_swap...');
    
    try {
        console.log('Attempting Cloudinary delete (prefix: semester_swap)...');
        const cloudinaryResult = await cloudinary.api.delete_resources_by_prefix('semester_swap', {
            resource_type: 'image',
            type: 'upload'
        });
        console.log('Cloudinary Deletion Result:', cloudinaryResult);
    } catch (cErr) {
        console.error('Cloudinary Deletion Error Object:', cErr);
        if (cErr.error) console.error('Inner Error:', cErr.error);
    }

    console.log('Data wipe complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error wiping data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  wipeData();
}

module.exports = wipeData;
