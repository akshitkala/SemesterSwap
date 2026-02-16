const admin = require('firebase-admin');

// Ensure valid service account path is set in .env
// Example: FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  console.error(
    'Error: FIREBASE_SERVICE_ACCOUNT_PATH is not defined in .env. Firebase Admin SDK not initialized.'
  );
  // We don't exit process here strictly to allow server to start, 
  // but auth routes will fail. Fail-fast might be better for production.
} else {
  try {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
  }
}

module.exports = admin;
