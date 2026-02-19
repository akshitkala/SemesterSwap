require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const restoreSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'akshitkala72@gmail.com'; // User said they deleted SuperAdmin data, likely implying the role or document was reset.
    // If they logged in again, a new User document with role: 'user' was created by auth logic.

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} not found! Log in once to create the account.`);
      return;
    }

    if (user.role === 'super_admin') {
      console.log(`User ${email} is already a Super Admin.`);
      return;
    }

    user.role = 'super_admin';
    await user.save();
    console.log(`SUCCESS: Promoted ${email} to super_admin.`);
    console.log(`New Role: ${user.role}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

restoreSuperAdmin();
