const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Book = require('../models/Book');

// Mock auth middleware to simulate roles
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    const role = req.headers['x-mock-role'];
    if (!role) {
      // No token behavior
      res.status(401);
      throw new Error('Not authorized, no token');
    }
    
    req.user = { 
      uid: 'mock_uid', 
      email: 'mock@test.com', 
      role: role 
    };
    next();
  }
}));

// Mock requiresRole to rely on req.user.role set above
jest.mock('../middleware/roleMiddleware', () => ({
  requireRole: (roles) => (req, res, next) => {
    // console.log('Checking role:', req.user.role, 'Allowed:', roles);
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403);
      // throw new Error('Forbidden'); // Don't throw, just send status to avoid hanging if error handler not hit correctly
      res.end();
    }
  }
}));


describe('Super Admin Routes', () => {
  let user, admin, superAdmin;

  beforeEach(async () => {
    // Create users with different roles
    user = await User.create({
      uid: 'user1',
      email: 'user@test.com',
      role: 'user'
    });

    admin = await User.create({
      uid: 'admin1',
      email: 'admin@test.com',
      role: 'admin'
    });

    superAdmin = await User.create({
      uid: 'super1',
      email: 'super@test.com',
      role: 'super_admin'
    });
  });

  describe('GET /api/super-admin/users', () => {
    it('should return all users for super_admin', async () => {
      const res = await request(app)
        .get('/api/super-admin/users')
        .set('x-mock-role', 'super_admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should forbid admin access', async () => {
      const res = await request(app)
        .get('/api/super-admin/users')
        .set('x-mock-role', 'admin');

      expect(res.statusCode).toBe(403);
    });

    it('should forbid user access', async () => {
      const res = await request(app)
        .get('/api/super-admin/users')
        .set('x-mock-role', 'user');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/super-admin/promote/:id', () => {
    it('should promote user to admin', async () => {
      const res = await request(app)
        .put(`/api/super-admin/promote/${user._id}`)
        .set('x-mock-role', 'super_admin');

      expect(res.statusCode).toBe(200);
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('admin');
    });

    it('should ensure admin cannot promote', async () => {
        const res = await request(app)
          .put(`/api/super-admin/promote/${user._id}`)
          .set('x-mock-role', 'admin');
  
        expect(res.statusCode).toBe(403);
      });
  });

  describe('PUT /api/super-admin/demote/:id', () => {
    it('should demote admin to user', async () => {
      const res = await request(app)
        .put(`/api/super-admin/demote/${admin._id}`)
        .set('x-mock-role', 'super_admin');

      expect(res.statusCode).toBe(200);
      
      const updatedAdmin = await User.findById(admin._id);
      expect(updatedAdmin.role).toBe('user');
    });
  });

  describe('GET /api/super-admin/stats', () => {
      it('should return correct stats', async () => {
        const res = await request(app)
            .get('/api/super-admin/stats')
            .set('x-mock-role', 'super_admin');
        
        expect(res.statusCode).toBe(200);
        // getDashboardStats returns nested shape: data.users.total, data.users.adminCount
        expect(res.body.data.users.total).toBe(3);
        expect(res.body.data.users.adminCount).toBe(1);
      });
  });


});
