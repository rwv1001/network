const request = require('supertest');
const app = require('../src/app');

describe('Network Identity Manager API', () => {
  describe('GET /', () => {
    it('should return application info', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);
      
      expect(res.body).toHaveProperty('name', 'Network Identity Manager');
      expect(res.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should validate registration input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak',
          firstName: '',
          lastName: ''
        })
        .expect(400);
      
      expect(res.body).toHaveProperty('error', 'Validation failed');
      expect(res.body).toHaveProperty('details');
    });
  });
});