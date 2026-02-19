require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const superAdmins = await User.countDocuments({ role: 'super_admin' });
        const admins = await User.countDocuments({ role: 'admin' });
        const users = await User.countDocuments({ role: 'user' });

        console.log(`\n--- Role Counts ---`);
        console.log(`Super Admins: ${superAdmins}`);
        console.log(`Admins: ${admins}`);
        console.log(`Users: ${users}`);
        console.log(`-------------------`);
        
        // List them
        if (superAdmins > 0) {
            console.log('\nSuper Admins:');
            const sa = await User.find({ role: 'super_admin' }, 'email displayName');
            sa.forEach(u => console.log(`- ${u.email} (${u.displayName})`));
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
