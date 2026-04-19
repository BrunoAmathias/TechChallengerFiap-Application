const request = require('supertest');
const app = require('../../src/server');

describe('Auth Functional Tests', () => {
  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: process.env.MOCK_USER_EMAIL,
          senha: process.env.MOCK_USER_PASSWORD
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('auth', true);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'invalid@example.com',
          senha: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
    });
  });
});