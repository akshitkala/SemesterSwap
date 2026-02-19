const admin = require('../config/firebaseAdmin');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }

    // FIX 4: Harden token extraction — handles extra whitespace and is case-insensitive
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // FIX 3: Separate auth errors from system errors
    // Only errors with code starting 'auth/' are token failures (401).
    // All other errors (DB down, schema failure, etc.) bubble up as 500.
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }

    req.user = decodedToken; // Attach decoded token (uid, email, etc.) to request

    // Sync with MongoDB User Model
    let user = await User.findOne({ uid: decodedToken.uid });

    if (!user) {
      // Create new user if not exists — all new users default to 'user' role.
      // FIX 1: Auto-promotion removed. Super Admin is seeded manually in MongoDB.
      //         Role is NEVER assigned based on email here.
      console.log(`[AuthMiddleware] Creating new user: ${decodedToken.email}, Role: user`);

      // FIX 2: Catch duplicate email DoS — return 409, not a masked 401
      try {
        user = await User.create({
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name || 'User',
          photoURL: decodedToken.picture || '',
          role: 'user'
        });
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key — email already registered under a different UID
          res.status(409);
          throw new Error('This email is already associated with another account. Please contact support.');
        }
        throw error; // Re-throw other DB errors → global handler returns 500
      }
    } else {
      // Optional: Update user details if changed in Firebase (e.g. name/photo)
      let updated = false;

      if (user.displayName !== (decodedToken.name || 'User')) {
        user.displayName = decodedToken.name || 'User';
        updated = true;
      }
      if (user.photoURL !== (decodedToken.picture || '')) {
        user.photoURL = decodedToken.picture || '';
        updated = true;
      }

      // FIX 1: Auto-promotion block REMOVED.
      // Super Admin role is set once via MongoDB seed script and managed
      // exclusively through PUT /api/super-admin/promote/:id endpoint.

      if (updated) {
        await user.save();
        console.log(`[AuthMiddleware] User ${user.email} updated`);
      }
    }

    // FIX 3: isActive check moved OUTSIDE the else block so it runs for
    // both newly created users AND existing users. Prevents any banned user
    // from slipping through on their first request after being banned.
    if (!user.isActive) {
      res.status(403);
      throw new Error('Account has been disabled. Please contact support.');
    }

    // Attach MongoDB user properties to request
    req.user.role = user.role;
    req.user._id = user._id; // MongoDB ID

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyToken };
