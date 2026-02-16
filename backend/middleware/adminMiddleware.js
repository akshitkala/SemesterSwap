const adminAuth = (req, res, next) => {
  const adminSecret = req.headers['x-admin-key'];

  // Check if header is present and matches the environment variable
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
    next(); // Valid admin
  } else {
    // Log failed attempt for security auditing
    console.warn(`[Security] Unauthorized admin access attempt from ${req.ip}`);
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

module.exports = { adminAuth };
