/**
 * ─────────────────────────────────────────────────────────────
 *  AUTH — Login Tests (Node.js / JavaScript)
 *  POST /api/login
 * ─────────────────────────────────────────────────────────────
 */

const { registerUser, loginUser, uniqueEmail } = require('../utils/testHelpers');

const VALID_PASSWORD = 'SecurePass@123';

describe('POST /api/login — User Login', () => {
  let registeredEmail;

  beforeAll(async () => {
    registeredEmail = uniqueEmail('logintest');
    const res = await registerUser({
      name: 'Login Tester',
      email: registeredEmail,
      password: VALID_PASSWORD,
    });

    if (res.status !== 201) {
      throw new Error(
        `Setup failed — could not register user [${res.status}]: ${JSON.stringify(res.data)}`
      );
    }
  });

  describe('Positive scenarios', () => {
    it('should return 200 with a JWT token for valid credentials', async () => {
      const res = await loginUser({
        email: registeredEmail,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(200);
      const token = res.data?.token ?? res.data?.data?.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('JWT token should be a 3-part dot-separated string', async () => {
      const res = await loginUser({
        email: registeredEmail,
        password: VALID_PASSWORD,
      });

      const token = res.data?.token ?? res.data?.data?.token ?? '';
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should not return the hashed password in the response', async () => {
      const res = await loginUser({
        email: registeredEmail,
        password: VALID_PASSWORD,
      });

      const bodyStr = JSON.stringify(res.data);
      expect(bodyStr).not.toMatch(/password/i);
    });
  });

  describe('Negative scenarios', () => {
    it('should return 4xx for wrong password', async () => {
      const res = await loginUser({
        email: registeredEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should return 4xx for unregistered email', async () => {
      const res = await loginUser({
        email: 'ghost_user_never_registered@test.com',
        password: VALID_PASSWORD,
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should return 400 when email is missing', async () => {
      const res = await loginUser({
        email: '',
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const res = await loginUser({
        email: registeredEmail,
        password: '',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for an empty body', async () => {
      const res = await loginUser({});
      expect(res.status).toBe(400);
    });

    it('should return 4xx for NoSQL injection attempt in email', async () => {
      const res = await loginUser({
        email: { $gt: '' },
        password: VALID_PASSWORD,
      });

      expect(res.status).not.toBe(200);
    });
  });
});
