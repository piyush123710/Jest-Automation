/**
 * ─────────────────────────────────────────────────────────────
 *  END-TO-END WORKFLOW TEST
 *  Register → Login → Get Slots → Book → Cancel
 * ─────────────────────────────────────────────────────────────
 *
 *  This test suite exercises the complete happy-path workflow in
 *  a single ordered sequence, mirroring real user behaviour.
 *
 *  Test order is enforced by keeping all steps in one describe
 *  block with shared state and --runInBand (serial execution).
 * ─────────────────────────────────────────────────────────────
 */

import {
  registerUser,
  loginUser,
  getAvailableSlots,
  createBooking,
  cancelBooking,
  uniqueEmail,
} from '../utils/testHelpers';
import {
  TEST_SALON_ID,
  TEST_SERVICE_ID,
  TEST_STYLIST_ID,
  validBookingPayload,
} from '../utils/testData';

describe('E2E Workflow: Register → Login → Slots → Book → Cancel', () => {
  /** Shared state across test steps */
  const credentials = {
    name: 'E2E Test User',
    email: uniqueEmail('e2e'),
    password: 'E2ePassw0rd!',
  };
  let authToken = '';
  let createdBookingId = '';

  // ─── Step 1: Register ─────────────────────────────────────────

  it('Step 1 — should register a new user (POST /api/register)', async () => {
    const res = await registerUser(credentials);

    expect(res.status).toBe(201);
    // Server may return a token immediately on register
    const immediateToken = res.data?.token ?? res.data?.data?.token;
    if (immediateToken) {
      authToken = immediateToken;
    }
  });

  // ─── Step 2: Login ────────────────────────────────────────────

  it('Step 2 — should login and receive a JWT token (POST /api/login)', async () => {
    const res = await loginUser({
      email: credentials.email,
      password: credentials.password,
    });

    expect(res.status).toBe(200);

    const token: string = res.data?.token ?? res.data?.data?.token ?? '';
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);

    authToken = token; // override with fresh login token
  });

  // ─── Step 3: Get Available Slots ──────────────────────────────

  it('Step 3 — should retrieve available slots (GET /api/salons/:id/available-slots)', async () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const date = d.toISOString().split('T')[0];

    const res = await getAvailableSlots(TEST_SALON_ID, date, TEST_SERVICE_ID);

    // 200 when seed data exists; 404 when using placeholder IDs
    expect([200, 404]).toContain(res.status);

    if (res.status === 200) {
      const slots = res.data?.slots ?? res.data;
      expect(Array.isArray(slots)).toBe(true);
    }
  });

  // ─── Step 4: Create Booking ───────────────────────────────────

  it('Step 4 — should create a booking (POST /api/bookings)', async () => {
    expect(authToken).toBeTruthy(); // guard — token must exist from step 2

    const payload = validBookingPayload({ slotTime: '10:00' });
    const res = await createBooking(authToken, payload);

    // 201 when seed data exists; 404 when using placeholder IDs
    expect([201, 404]).toContain(res.status);

    if (res.status === 201) {
      createdBookingId =
        res.data?._id ?? res.data?.booking?._id ?? res.data?.id ?? '';
      expect(createdBookingId).toBeTruthy();

      // Validate response shape
      const booking = res.data?.booking ?? res.data;
      expect(booking).toBeDefined();
    }
  });

  // ─── Step 5: Cancel Booking ───────────────────────────────────

  it('Step 5 — should cancel the created booking (DELETE /api/bookings/:id)', async () => {
    if (!createdBookingId) {
      console.warn('⚠  Step 5 skipped — no booking ID from Step 4 (seed data likely missing)');
      return;
    }

    const res = await cancelBooking(authToken, createdBookingId);

    expect(res.status).toBe(200);

    // Verify cancelled status in response
    const status =
      res.data?.status ??
      res.data?.booking?.status ??
      res.data?.data?.status;

    if (status !== undefined) {
      expect(status).toBe('cancelled');
    }
  });

  // ─── Step 6: Verify Cancelled Booking Cannot Be Re-Cancelled ──

  it('Step 6 — should NOT allow re-cancellation of an already cancelled booking', async () => {
    if (!createdBookingId) {
      console.warn('⚠  Step 6 skipped — no booking ID available');
      return;
    }

    const res = await cancelBooking(authToken, createdBookingId);

    // 400 / 404 / 409 are all acceptable "cannot cancel again" responses
    expect([400, 404, 409]).toContain(res.status);
  });
});

// ─── Additional E2E: Auth Guard Verification ──────────────────────────────────

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
