const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    const error = new Error('Not authorized, no token provided');
    return next(error);
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user to request object
    // decodedToken contains: uid, phone_number, etc.
    req.user = decodedToken;
    
    if (!req.user.phone_number) {
        // Enforce phone number presence for this app
        res.status(403);
        throw new Error('Authentication verified, but no phone number linked.');
    }

    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    res.status(401);
    
    if (error.code === 'auth/id-token-expired') {
      return next(new Error('Token expired, please login again'));
    }
    
    return next(new Error('Not authorized, token failed'));
  }
};

module.exports = { verifyToken };
