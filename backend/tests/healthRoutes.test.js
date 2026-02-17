const request = require('supertest');
const app = require('../app');

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return 200 and success status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is running');
    });

  });
});
