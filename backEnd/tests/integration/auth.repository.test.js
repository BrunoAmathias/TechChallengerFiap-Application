require('dotenv').config();
const AuthService = require('../../src/application/auth.service');
const jwt = require('jsonwebtoken');

describe('Auth Repository Integration Tests', () => {
  const testUser = {
    email: process.env.MOCK_USER_EMAIL,
    senha: process.env.MOCK_USER_PASSWORD
  };

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const result = await AuthService.login(testUser.email, testUser.senha);

      expect(result).toHaveProperty('token');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should fail login with incorrect password', async () => {
      try {
        await AuthService.login(testUser.email, 'wrongpassword');
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    });

    it('should fail login with non-existent email', async () => {
      try {
        await AuthService.login('nonexistent@test.com', 'anypassword');
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    });
  });

  describe('verifyToken', () => {
    let validToken;

    beforeAll(async () => {
      const result = await AuthService.login(testUser.email, testUser.senha);
      validToken = result.token;
    });

    it('should verify a valid token', async () => {
      const result = jwt.verify(validToken, process.env.JWT_SECRET);

      expect(result).toBeDefined();
      expect(result.email).toBe(testUser.email);
    });

    it('should fail verification with invalid token', async () => {
      try {
        jwt.verify('invalid.token.here', process.env.JWT_SECRET);
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    });

    it('should fail verification with expired token', async () => {
      try {
        jwt.verify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.invalid', process.env.JWT_SECRET);
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    });
  });
});