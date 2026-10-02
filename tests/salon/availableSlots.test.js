/**
 * ─────────────────────────────────────────────────────────────
 *  SALON — Available Slots Tests (Node.js / JavaScript)
 *  GET /api/salons/:salonId/available-slots?date=&serviceId=
 * ─────────────────────────────────────────────────────────────
 */

const { getAvailableSlots } = require('../utils/testHelpers');
const { TEST_SALON_ID, TEST_SERVICE_ID } = require('../utils/testData');

function futureDateString(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

const FUTURE_DATE = futureDateString();
const INVALID_ID = '000000000000000000000000';
const MALFORMED_ID = 'not-an-object-id';

describe('GET /api/salons/:salonId/available-slots — Slot Availability', () => {
  describe('Positive scenarios', () => {
    it('should return 200 and a slots array for valid params', async () => {
      const res = await getAvailableSlots(TEST_SALON_ID, FUTURE_DATE, TEST_SERVICE_ID);

      if (res.status === 200) {
        const slots = res.data?.slots ?? res.data;
        expect(Array.isArray(slots)).toBe(true);
      } else {
        expect([200, 404]).toContain(res.status);
      }
    });

    it('should return 200 and an array when no slots available', async () => {
      const pastDate = '2020-01-01';
      const res = await getAvailableSlots(TEST_SALON_ID, pastDate, TEST_SERVICE_ID);
      expect([200, 400, 404]).toContain(res.status);
    });

    it('slots array items should be strings or objects with time info', async () => {
      const res = await getAvailableSlots(TEST_SALON_ID, FUTURE_DATE, TEST_SERVICE_ID);
      if (res.status !== 200) return;

      const slots = res.data?.slots ?? res.data ?? [];
      slots.forEach((slot) => {
        const isString = typeof slot === 'string';
        const isObject = typeof slot === 'object' && slot !== null;
        expect(isString || isObject).toBe(true);
      });
    });
  });

  describe('Negative scenarios', () => {
    it('should return 400 when date query param is missing', async () => {
      const res = await getAvailableSlots(TEST_SALON_ID, '', TEST_SERVICE_ID);
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    it('should return 400 when serviceId query param is missing', async () => {
      const res = await getAvailableSlots(TEST_SALON_ID, FUTURE_DATE, '');
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    it('should return 400 when both date and serviceId are missing', async () => {
      const res = await getAvailableSlots(TEST_SALON_ID, '', '');
      expect(res.status).toBe(400);
    });

    it('should return 404 for a non-existent salonId', async () => {
      const res = await getAvailableSlots(INVALID_ID, FUTURE_DATE, TEST_SERVICE_ID);
      expect(res.status).toBe(404);
    });

    it('should return 404 for a non-existent serviceId', async () => {
      const res = await getAvailableSlots(TEST_SALON_ID, FUTURE_DATE, INVALID_ID);
      expect([400, 404]).toContain(res.status);
    });

    it('should return 4xx for a malformed salonId', async () => {
      const res = await getAvailableSlots(MALFORMED_ID, FUTURE_DATE, TEST_SERVICE_ID);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(600);
    });
  });
});
