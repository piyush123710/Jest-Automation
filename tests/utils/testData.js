const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_SALON_ID = process.env.TEST_SALON_ID || '000000000000000000000001';
const TEST_STYLIST_ID = process.env.TEST_STYLIST_ID || '000000000000000000000002';
const TEST_SERVICE_ID = process.env.TEST_SERVICE_ID || '000000000000000000000003';

function validUserPayload(emailPrefix = 'user') {
  return {
    name: 'Test User',
    email: `${emailPrefix}_${Date.now()}@automation.test`,
    password: 'SecurePass@123',
  };
}

function validBookingPayload(overrides = {}) {
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

module.exports = {
  BASE_URL,
  TEST_SALON_ID,
  TEST_STYLIST_ID,
  TEST_SERVICE_ID,
  validUserPayload,
  validBookingPayload,
};
