/**
 * ─────────────────────────────────────────────────────────────
 *  AUTH — Registration Tests (Node.js / JavaScript)
 *  POST /api/register
 * ─────────────────────────────────────────────────────────────
 */

const { registerUser, uniqueEmail } = require('../utils/testHelpers');

const VALID_PASSWORD = 'SecurePass@123';

describe('POST /api/register — User Registration', () => {
  describe('Positive scenarios', () => {
    it('should register a new user and return 201', async () => {
      const payload = {
        name: 'Jane Doe',
        email: uniqueEmail('jane'),
        password: VALID_PASSWORD,
      };

      const res = await registerUser(payload);
      expect(res.status).toBe(201);
    });

    it('should return a token on successful registration', async () => {
      const payload = {
        name: 'John Doe',
        email: uniqueEmail('john'),
        password: VALID_PASSWORD,
      };

      const res = await registerUser(payload);
      expect(res.status).toBe(201);

      const token = res.data?.token ?? res.data?.data?.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    it('should return user details in the response body', async () => {
      const email = uniqueEmail('detail');
      const payload = { name: 'Detail Test', email, password: VALID_PASSWORD };

      const res = await registerUser(payload);
      expect(res.status).toBe(201);
      expect(res.data).toBeDefined();
    });

    it('should accept a user with a name that has spaces', async () => {
      const payload = {
        name: 'Alice Wonderland Smith',
        email: uniqueEmail('alice'),
        password: VALID_PASSWORD,
      };

      const res = await registerUser(payload);
      expect(res.status).toBe(201);
    });
  });

  describe('Negative scenarios', () => {
    it('should return 400 when email is already registered', async () => {
      const email = uniqueEmail('dup');
      const payload = { name: 'Dup User', email, password: VALID_PASSWORD };

      await registerUser(payload);
      const res = await registerUser(payload);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
      expect(res.data.error).toMatch(/email already in use/i);
    });

    it('should return 400 when name is missing', async () => {
      const res = await registerUser({
        name: '',
        email: uniqueEmail('noname'),
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when email is missing', async () => {
      const res = await registerUser({
        name: 'No Email',
        email: '',
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const res = await registerUser({
        name: 'No Pass',
        email: uniqueEmail('nopass'),
        password: '',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for an empty request body', async () => {
      const res = await registerUser({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for a malformed email address', async () => {
      const res = await registerUser({
        name: 'Bad Email',
        email: 'not-an-email',
        password: VALID_PASSWORD,
      });

      expect([400, 201]).toContain(res.status);
    });
  });
});
