const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { mockVerifyToken } = require('./mockAuth');

// Import Routes
const authRoutes = require('../../routes/authRoutes');
// Create a wrapper for auth routes to skip verifyToken if needed?
// authRoutes uses verifyToken for 'me'.
// We need to SWAP the middleware locally.

// Wait, standard routes import 'middleware/authMiddleware'.
// Node.js caches modules. If I want to swap, I need to mock the module require.
// But that's hard in a running script without Jest.
// ALTERNATIVE: Use proxyquire or simple 'require' cache patching.
// OR: Just create a specialized set of routes for audit? Too much work.

// EASIEST WAY:
// Modify 'middleware/authMiddleware.js' to check for a global flag process.env.AUDIT_MODE?
// I'd rather not touch production code.

// Jest uses module mocking.
// I'm writing a script.
// I can do:
// require.cache[require.resolve('../../middleware/authMiddleware')] = {
//   exports: { verifyToken: require('./mockAuth').verifyToken }
// };

// Let's try patching require cache BEFORE requiring routes.

const path = require('path');
const authMiddlewarePath = path.resolve(__dirname, '../../middleware/authMiddleware.js');

// Mocking the authMiddleware module
require.cache[authMiddlewarePath] = {
  id: authMiddlewarePath,
  filename: authMiddlewarePath,
  loaded: true,
  exports: {
    verifyToken: require('./mockAuth').verifyToken
  }
};

const cloudinaryPath = path.resolve(__dirname, '../../config/cloudinary.js');
require.cache[cloudinaryPath] = {
  id: cloudinaryPath,
  filename: cloudinaryPath,
  loaded: true,
  exports: {
    uploader: {
      upload_stream: (options, callback) => {
        // Return a mock stream
        const  stream = require('stream');
        const pass = new stream.PassThrough();
        // Simulate async upload
        setTimeout(() => {
             callback(null, { secure_url: 'http://mock-cloudinary.com/image.jpg' });
        }, 10);
        return pass;
      }
    },
    api: {
        delete_resources_by_prefix: async () => ({ deleted: { mock: 'deleted' } })
    }
  }
};

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

// Now require routes (they will pick up the mocked middleware)
const bookRoutes = require('../../routes/bookRoutes');
const superAdminRoutes = require('../../routes/superAdminRoutes');
const adminRoutes = require('../../routes/adminRoutes'); // if exists
// const authRoutes = require('../../routes/authRoutes'); // Auth routes verify token too

// Mount Routes
app.use('/api/books', bookRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', require('../../routes/adminRoutes'));
app.use('/api/users', require('../../routes/userRoutes')); // assumed present from Phase 7

// Error Handling
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
