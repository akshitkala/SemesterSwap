
const admin = require('../config/firebaseAdmin');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken; // Attach decoded user (uid, email, etc.) to request
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyToken };
