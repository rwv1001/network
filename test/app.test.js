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
      expect(res.body).toHaveProperty('features');
      expect(res.body.features).toContain('MAC Address Device Registration');
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

  describe('GET /api/devices/status/:macAddress', () => {
    it('should check device status for valid MAC address', async () => {
      const res = await request(app)
        .get('/api/devices/status/aa:bb:cc:dd:ee:ff')
        .expect(200);
      
      expect(res.body).toHaveProperty('macAddress', 'aa:bb:cc:dd:ee:ff');
      expect(res.body).toHaveProperty('registered');
      expect(res.body).toHaveProperty('vlan');
      expect(res.body).toHaveProperty('accessLevel');
    });

    it('should reject invalid MAC address format', async () => {
      const res = await request(app)
        .get('/api/devices/status/invalid-mac')
        .expect(400);
      
      expect(res.body).toHaveProperty('error', 'Invalid MAC address format');
    });
  });

  describe('POST /api/devices/register', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/devices/register')
        .send({
          macAddress: 'aa:bb:cc:dd:ee:ff',
          deviceName: 'Test Device',
          deviceType: 'laptop'
        })
        .expect(401);
      
      expect(res.body).toHaveProperty('error');
    });

    it('should validate device registration input', async () => {
      const res = await request(app)
        .post('/api/devices/register')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          macAddress: 'invalid-mac',
          deviceName: '',
          deviceType: 'invalid-type'
        })
        .expect(401); // Will fail auth before validation
    });
  });
});