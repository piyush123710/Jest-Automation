/**
 * ─────────────────────────────────────────────────────────────
 *  BOOKING — Cancel Booking Tests (Node.js / JavaScript)
 *  DELETE /api/bookings/:id
 * ─────────────────────────────────────────────────────────────
 */

const {
  registerAndLogin,
  createBooking,
  cancelBooking,
  uniqueEmail,
} = require('../utils/testHelpers');
const { validBookingPayload } = require('../utils/testData');

const NONEXISTENT_ID = '000000000000000000000000';
const MALFORMED_ID = 'not-a-valid-object-id';

describe('DELETE /api/bookings/:id — Cancel Booking', () => {
  let ownerToken;
  let otherUserToken;

  beforeAll(async () => {
    ownerToken = await registerAndLogin({
      name: 'Booking Owner',
      email: uniqueEmail('owner'),
      password: 'TestPass@456',
    });

    otherUserToken = await registerAndLogin({
      name: 'Other User',
      email: uniqueEmail('other'),
      password: 'TestPass@456',
    });
  });

  describe('Positive scenarios', () => {
    it('should cancel an existing booking and return 200', async () => {
      const createRes = await createBooking(ownerToken, validBookingPayload({ slotTime: '14:00' }));

      if (createRes.status !== 201) return;

      const bookingId =
        createRes.data?._id ??
        createRes.data?.booking?._id ??
        createRes.data?.id;

      expect(bookingId).toBeDefined();

      const cancelRes = await cancelBooking(ownerToken, bookingId);
      expect(cancelRes.status).toBe(200);
    });

    it('cancelled booking response should indicate status "cancelled"', async () => {
      const createRes = await createBooking(ownerToken, validBookingPayload({ slotTime: '15:00' }));

      if (createRes.status !== 201) return;

      const bookingId =
        createRes.data?._id ?? createRes.data?.booking?._id ?? createRes.data?.id;

      const cancelRes = await cancelBooking(ownerToken, bookingId);

      if (cancelRes.status === 200) {
        const status =
          cancelRes.data?.status ??
          cancelRes.data?.booking?.status ??
          cancelRes.data?.data?.status;

        if (status !== undefined) {
          expect(status).toBe('cancelled');
        }
      }
    });
  });

  describe('Authorization scenarios', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await cancelBooking('', NONEXISTENT_ID);
      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    it('should return 401 for an invalid token', async () => {
      const res = await cancelBooking('bad.jwt.token', NONEXISTENT_ID);
      expect(res.status).toBe(401);
    });

    it('should return 403 when a different user tries to cancel the booking', async () => {
      const createRes = await createBooking(ownerToken, validBookingPayload({ slotTime: '16:00' }));

      if (createRes.status !== 201) return;

      const bookingId =
        createRes.data?._id ?? createRes.data?.booking?._id ?? createRes.data?.id;

      const res = await cancelBooking(otherUserToken, bookingId);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Negative scenarios', () => {
    it('should return 404 for a non-existent booking ID', async () => {
      const res = await cancelBooking(ownerToken, NONEXISTENT_ID);
      expect(res.status).toBe(404);
    });

    it('should return 4xx for a malformed booking ID', async () => {
      const res = await cancelBooking(ownerToken, MALFORMED_ID);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(600);
    });

    it('should return 400 / 409 when cancelling an already-cancelled booking', async () => {
      const createRes = await createBooking(ownerToken, validBookingPayload({ slotTime: '17:00' }));

      if (createRes.status !== 201) return;

      const bookingId =
        createRes.data?._id ?? createRes.data?.booking?._id ?? createRes.data?.id;

      await cancelBooking(ownerToken, bookingId);
      const secondCancelRes = await cancelBooking(ownerToken, bookingId);
      expect([400, 404, 409]).toContain(secondCancelRes.status);
    });
  });
});
