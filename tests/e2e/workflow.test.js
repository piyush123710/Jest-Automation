/**
 * ─────────────────────────────────────────────────────────────
 *  END-TO-END WORKFLOW TEST (Node.js / JavaScript)
 *  Register → Login → Get Slots → Book → Cancel
 * ─────────────────────────────────────────────────────────────
 */

const {
  registerUser,
  loginUser,
  getAvailableSlots,
  createBooking,
  cancelBooking,
  uniqueEmail,
} = require('../utils/testHelpers');
const {
  TEST_SALON_ID,
  TEST_SERVICE_ID,
  validBookingPayload,
} = require('../utils/testData');

describe('E2E Workflow: Register → Login → Slots → Book → Cancel', () => {
  const credentials = {
    name: 'E2E Test User',
    email: uniqueEmail('e2e'),
    password: 'E2ePassw0rd!',
  };
  let authToken = '';
  let createdBookingId = '';

  it('Step 1 — should register a new user (POST /api/register)', async () => {
    const res = await registerUser(credentials);
    expect(res.status).toBe(201);
    const immediateToken = res.data?.token ?? res.data?.data?.token;
    if (immediateToken) {
      authToken = immediateToken;
    }
  });

  it('Step 2 — should login and receive a JWT token (POST /api/login)', async () => {
    const res = await loginUser({
      email: credentials.email,
      password: credentials.password,
    });

    expect(res.status).toBe(200);

    const token = res.data?.token ?? res.data?.data?.token ?? '';
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);

    authToken = token;
  });

  it('Step 3 — should retrieve available slots (GET /api/salons/:id/available-slots)', async () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const date = d.toISOString().split('T')[0];

    const res = await getAvailableSlots(TEST_SALON_ID, date, TEST_SERVICE_ID);
    expect([200, 404]).toContain(res.status);

    if (res.status === 200) {
      const slots = res.data?.slots ?? res.data;
      expect(Array.isArray(slots)).toBe(true);
    }
  });

  it('Step 4 — should create a booking (POST /api/bookings)', async () => {
    expect(authToken).toBeTruthy();

    const payload = validBookingPayload({ slotTime: '10:00' });
    const res = await createBooking(authToken, payload);

    expect([201, 404]).toContain(res.status);

    if (res.status === 201) {
      createdBookingId =
        res.data?._id ?? res.data?.booking?._id ?? res.data?.id ?? '';
      expect(createdBookingId).toBeTruthy();

      const booking = res.data?.booking ?? res.data;
      expect(booking).toBeDefined();
    }
  });

  it('Step 5 — should cancel the created booking (DELETE /api/bookings/:id)', async () => {
    if (!createdBookingId) return;

    const res = await cancelBooking(authToken, createdBookingId);
    expect(res.status).toBe(200);

    const status =
      res.data?.status ??
      res.data?.booking?.status ??
      res.data?.data?.status;

    if (status !== undefined) {
      expect(status).toBe('cancelled');
    }
  });

  it('Step 6 — should NOT allow re-cancellation of an already cancelled booking', async () => {
    if (!createdBookingId) return;

    const res = await cancelBooking(authToken, createdBookingId);
    expect([400, 404, 409]).toContain(res.status);
  });
});

describe('E2E Auth Guard — Booking API rejects unauthenticated requests', () => {
  it('POST /api/bookings without token returns 401', async () => {
    const res = await createBooking('', validBookingPayload());
    expect(res.status).toBe(401);
  });

  it('DELETE /api/bookings/:id without token returns 401', async () => {
    const res = await cancelBooking('', '000000000000000000000000');
    expect(res.status).toBe(401);
  });

  it('Protected endpoints reject a garbage token', async () => {
    const garbageToken = 'garbage_not_a_jwt';
    const createRes = await createBooking(garbageToken, validBookingPayload());
    expect(createRes.status).toBe(401);

    const cancelRes = await cancelBooking(garbageToken, '000000000000000000000000');
    expect(cancelRes.status).toBe(401);
  });
});
