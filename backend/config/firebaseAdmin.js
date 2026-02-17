
const admin = require('firebase-admin');

// Check if already initialized to prevent hot-reload errors
if (!admin.apps.length) {
  try {
    // Attempt to parse service account from environment variable
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error.message);
    // Fallback or handle appropriately in production
  }
}

module.exports = admin;
