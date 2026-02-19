require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Total users: ${users.length}`);

    // Group by email
    const emailMap = {};
    users.forEach(u => {
      if (!emailMap[u.email]) emailMap[u.email] = [];
      emailMap[u.email].push(u);
    });

    console.log('\n--- Duplicate Emails ---');
    let found = false;
    for (const [email, list] of Object.entries(emailMap)) {
      if (list.length > 1) {
        found = true;
        console.log(`Email: ${email}`);
        list.forEach(u => console.log(`  - ID: ${u._id}, Role: ${u.role}, UID: ${u.uid}, Name: ${u.displayName}`));
      }
    }
    if (!found) console.log('None found.');

    // List all Admins and SuperAdmins
    console.log('\n--- Privileged Users ---');
    users.filter(u => u.role !== 'user').forEach(u => {
      console.log(`- [${u.role}] ${u.displayName} (${u.email}) ID: ${u._id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  }
};

checkDuplicates();
