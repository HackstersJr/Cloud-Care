import request from 'supertest';
import CloudCareServer from '../../src/server';

describe('Health Endpoints', () => {
  let server: CloudCareServer;
  let app: any;

  beforeAll(() => {
    server = new CloudCareServer();
    app = server.app;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('security');
      expect(response.body.system).toHaveProperty('uptime');
      expect(response.body.system).toHaveProperty('memory');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
