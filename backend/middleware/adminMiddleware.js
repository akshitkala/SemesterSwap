
const adminAuth = (req, res, next) => {
  // Check if user is authenticated via verifyToken (req.user is set)
  // And if their email matches the admin email environment variable
  if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
    next(); // Valid admin
  } else {
    // Log failed attempt for security auditing
    console.warn(`[Security] Unauthorized admin access attempt by ${req.user?.email || 'Unknown'} from IP ${req.ip}`);
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

module.exports = { adminAuth };
