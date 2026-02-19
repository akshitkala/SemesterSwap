// Mock Auth Middleware for Audit
// TRUSTS the 'x-test-user' header to identify the user
// Format of x-test-user: JSON stringified user object { uid, email, role, etc. }

const mockVerifyToken = async (req, res, next) => {
  const testUserHeader = req.headers['x-test-user'];
  
  if (testUserHeader) {
    try {
      const user = JSON.parse(testUserHeader);
      // Populate req.user just like verifyToken would (Fetching from DB usually happens here too?)
      // In real verifyToken, we decode token -> get uid -> User.findOne({ uid }).
      // Here we assume the header provides the DB _id if needed, or we simulate DB lookup.
      
      // For deeper realism, let's look up the user in DB by email provided in header
      const User = require('../../models/User');
      const dbUser = await User.findOne({ email: user.email });
      
      if (dbUser) {
        req.user = dbUser;
        req.user.uid = user.uid; // Ensure uid matches
        next();
        return;
      }
      
      // If user not in DB, create/return mock?
      // For audit, we will pre-seed users or let endpoints handle "User not found".
      // Let's pass the raw object if not found (for registration flow?)
      req.user = user;
      next();
    } catch (e) {
      console.error('Mock Auth Error:', e);
      res.status(401).json({ message: 'Invalid Test User Header' });
    }
  } else {
    res.status(401).json({ message: 'No credentials provided (Mock)' });
  }
};

module.exports = { verifyToken: mockVerifyToken };
