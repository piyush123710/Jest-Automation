import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralised test data / environment variable access.
 *
 * Any test file that needs IDs or the base URL should import from here
 * instead of reading process.env directly, making it easy to swap
 * values in one place.
 */

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Seed IDs that must exist in the target MongoDB database before
 * running the booking / available-slots tests.
 *
 * Set these in .env (see .env.example for guidance).
 */
export const TEST_SALON_ID =
  process.env.TEST_SALON_ID || '000000000000000000000001';
export const TEST_STYLIST_ID =
  process.env.TEST_STYLIST_ID || '000000000000000000000002';
export const TEST_SERVICE_ID =
  process.env.TEST_SERVICE_ID || '000000000000000000000003';

/** Default valid registration payload factory (email is unique per call). */
export function validUserPayload(emailPrefix = 'user') {
  return {
    name: 'Test User',
    email: `${emailPrefix}_${Date.now()}@automation.test`,
    password: 'SecurePass@123',
  };
}

/** Booking payload factory using seed IDs. */
export function validBookingPayload(overrides: Partial<{
  salonId: string;
  stylistId: string;
  serviceId: string;
  slotTime: string;
  date: string;
}> = {}) {
  // Use a date 7 days in the future so the slot is unlikely to be taken
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const futureDate = d.toISOString().split('T')[0];

  return {
    salonId: TEST_SALON_ID,
    stylistId: TEST_STYLIST_ID,
    serviceId: TEST_SERVICE_ID,
    slotTime: '10:00',
    date: futureDate,
    ...overrides,
  };
}
