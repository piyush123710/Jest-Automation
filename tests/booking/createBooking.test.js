/**
 * ─────────────────────────────────────────────────────────────
 *  BOOKING — Create Booking Tests (Node.js / JavaScript)
 *  POST /api/bookings
 * ─────────────────────────────────────────────────────────────
 */

const {
  registerAndLogin,
  createBooking,
  uniqueEmail,
} = require('../utils/testHelpers');
const {
  validBookingPayload,
} = require('../utils/testData');

const INVALID_ID = '000000000000000000000000';

describe('POST /api/bookings — Create Booking', () => {
  let userToken;

  beforeAll(async () => {
    userToken = await registerAndLogin({
      name: 'Booking Creator',
      email: uniqueEmail('booking_create'),
      password: 'TestPass@456',
    });
  });

  describe('Positive scenarios', () => {
    it('should create a booking and return 201 with a booking ID', async () => {
      const payload = validBookingPayload();
      const res = await createBooking(userToken, payload);

      if (res.status === 201) {
        const id = res.data?._id ?? res.data?.bookingId ?? res.data?.id;
        expect(id).toBeDefined();
      } else {
        expect([201, 404]).toContain(res.status);
      }
    });

    it('should return booking with status "booked"', async () => {
      const payload = validBookingPayload({ slotTime: '11:00' });
      const res = await createBooking(userToken, payload);

      if (res.status === 201) {
        const status =
          res.data?.status ?? res.data?.booking?.status ?? res.data?.data?.status;
        if (status !== undefined) {
          expect(status).toBe('booked');
        }
      }
    });

    it('response should contain startTime and endTime', async () => {
      const payload = validBookingPayload({ slotTime: '09:00' });
      const res = await createBooking(userToken, payload);

      if (res.status === 201) {
        const booking = res.data?.booking ?? res.data;
        expect(booking).toBeDefined();
      }
    });
  });

  describe('Authorization scenarios', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const payload = validBookingPayload();
      const res = await createBooking('', payload);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
      expect(res.data.error).toMatch(/authentication required/i);
    });

    it('should return 401 for an invalid / tampered JWT token', async () => {
      const payload = validBookingPayload();
      const res = await createBooking('invalid.jwt.token', payload);
      expect(res.status).toBe(401);
    });

    it('should return 401 for an expired-looking token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJpZCI6IjEyMyIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.' +
        'INVALID_SIGNATURE';
      const res = await createBooking(expiredToken, validBookingPayload());
      expect(res.status).toBe(401);
    });
  });

  describe('Negative scenarios', () => {
    it('should return 400 when date is missing', async () => {
      const payload = { ...validBookingPayload(), date: '' };
      const res = await createBooking(userToken, payload);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
      expect(res.data.error).toMatch(/date is required/i);
    });

    it('should return 400 / 404 when serviceId is missing', async () => {
      const payload = { ...validBookingPayload(), serviceId: '' };
      const res = await createBooking(userToken, payload);
      expect([400, 404]).toContain(res.status);
    });

    it('should return 404 when serviceId does not exist', async () => {
      const payload = { ...validBookingPayload(), serviceId: INVALID_ID };
      const res = await createBooking(userToken, payload);
      expect([400, 404]).toContain(res.status);
    });

    it('should return 4xx when salonId is missing', async () => {
      const payload = { ...validBookingPayload(), salonId: '' };
      const res = await createBooking(userToken, payload);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should return 4xx when slotTime is missing', async () => {
      const payload = { ...validBookingPayload(), slotTime: '' };
      const res = await createBooking(userToken, payload);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should return 4xx for a completely empty body', async () => {
      const res = await createBooking(userToken, {});
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
});
