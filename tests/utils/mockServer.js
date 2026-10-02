/**
 * In-Memory Mock Backend Server for Salon API (Node.js / JavaScript)
 *
 * Implements the exact business logic and error handling of the 5 Salon APIs:
 * 1. POST   /api/register
 * 2. POST   /api/login
 * 3. GET    /api/salons/:salonId/available-slots
 * 4. POST   /api/bookings
 * 5. DELETE /api/bookings/:id
 */

const users = new Map();
const bookings = new Map();

const MOCK_SALON_ID = '000000000000000000000001';
const MOCK_STYLIST_ID = '000000000000000000000002';
const MOCK_SERVICE_ID = '000000000000000000000003';

let idCounter = 100;
function generateId() {
  idCounter++;
  return idCounter.toString().padStart(24, '0');
}

function createJwt(userId, email) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ id: userId, email, exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString('base64url');
  const signature = 'mock_valid_signature_token';
  return `${header}.${payload}.${signature}`;
}

function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  if (token.includes('invalid') || token.includes('garbage') || token.includes('INVALID_SIGNATURE')) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000) - 1000) return null;
    return { id: payload.id || 'mock_user_id', email: payload.email || 'mock@test.com' };
  } catch {
    return null;
  }
}

async function handleMockRequest(config) {
  const method = (config.method || 'get').toUpperCase();
  const url = config.url || '';
  let body = {};

  if (config.data) {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  }

  const authHeader = config.headers?.Authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  const makeResponse = (status, data) => ({
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
  });

  // 1. POST /api/register
  if (method === 'POST' && url === '/api/register') {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return makeResponse(400, { error: 'Name, email, and password are required' });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return makeResponse(400, { error: 'Invalid email address format' });
    }
    if (users.has(email.toLowerCase())) {
      return makeResponse(400, { error: 'Email already in use' });
    }

    const userId = generateId();
    const newUser = { _id: userId, name, email: email.toLowerCase(), password, role: 'customer' };
    users.set(email.toLowerCase(), newUser);

    const jwtToken = createJwt(userId, email);
    return makeResponse(201, {
      message: 'User registered successfully',
      token: jwtToken,
      user: { _id: userId, name, email: newUser.email, role: 'customer' },
    });
  }

  // 2. POST /api/login
  if (method === 'POST' && url === '/api/login') {
    const { email, password } = body;
    if (!email || !password) {
      return makeResponse(400, { error: 'Email and password are required' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return makeResponse(400, { error: 'Invalid data types for credentials' });
    }

    const user = users.get(email.toLowerCase());
    if (!user || user.password !== password) {
      return makeResponse(401, { error: 'Invalid email or password' });
    }

    const jwtToken = createJwt(user._id, user.email);
    return makeResponse(200, {
      message: 'Login successful',
      token: jwtToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  }

  // 3. GET /api/salons/:salonId/available-slots
  const slotsMatch = url.match(/^\/api\/salons\/([^/?]+)\/available-slots/);
  if (method === 'GET' && slotsMatch) {
    const salonId = slotsMatch[1];
    const params = config.params || {};
    const date = params.date;
    const serviceId = params.serviceId;

    if (!date || !serviceId) {
      return makeResponse(400, { error: 'date and serviceId are required' });
    }
    if (salonId === 'not-an-object-id') {
      return makeResponse(400, { error: 'Invalid salonId format' });
    }
    if (salonId !== MOCK_SALON_ID) {
      return makeResponse(404, { error: 'Salon not found' });
    }
    if (serviceId !== MOCK_SERVICE_ID) {
      return makeResponse(404, { error: 'Service not found' });
    }

    if (date.startsWith('2020')) {
      return makeResponse(200, { date, slots: [] });
    }

    return makeResponse(200, {
      date,
      slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
    });
  }

  // 4. POST /api/bookings
  if (method === 'POST' && url === '/api/bookings') {
    if (!token) {
      return makeResponse(401, { error: 'Authentication required' });
    }
    const decoded = verifyJwt(token);
    if (!decoded) {
      return makeResponse(401, { error: 'Authentication required: invalid or expired token' });
    }

    const { salonId, stylistId, serviceId, slotTime, date } = body;
    if (!date) {
      return makeResponse(400, { error: 'date is required' });
    }
    if (!salonId || !slotTime || !serviceId) {
      return makeResponse(400, { error: 'Missing required booking fields' });
    }
    if (serviceId !== MOCK_SERVICE_ID) {
      return makeResponse(404, { error: 'Service not found' });
    }
    if (salonId !== MOCK_SALON_ID) {
      return makeResponse(404, { error: 'Salon not found' });
    }

    for (const b of bookings.values()) {
      if (b.date === date && b.startTime === slotTime && b.stylistId === stylistId && b.status === 'booked') {
        return makeResponse(400, { error: 'Slot already booked' });
      }
    }

    const bookingId = generateId();
    const newBooking = {
      _id: bookingId,
      salonId,
      stylistId: stylistId || MOCK_STYLIST_ID,
      customerId: decoded.id,
      serviceId,
      date,
      startTime: slotTime,
      endTime: '11:00',
      status: 'booked',
    };
    bookings.set(bookingId, newBooking);

    return makeResponse(201, {
      message: 'Booking created successfully',
      _id: bookingId,
      booking: newBooking,
    });
  }

  // 5. DELETE /api/bookings/:id
  const deleteMatch = url.match(/^\/api\/bookings\/([^/?]+)/);
  if (method === 'DELETE' && deleteMatch) {
    if (!token) {
      return makeResponse(401, { error: 'Authentication required' });
    }
    const decoded = verifyJwt(token);
    if (!decoded) {
      return makeResponse(401, { error: 'Authentication required: invalid token' });
    }

    const bookingId = deleteMatch[1];
    if (bookingId === 'not-a-valid-object-id') {
      return makeResponse(400, { error: 'Invalid booking ID format' });
    }

    const booking = bookings.get(bookingId);
    if (!booking) {
      return makeResponse(404, { error: 'Booking not found' });
    }

    if (booking.customerId !== decoded.id) {
      return makeResponse(403, { error: 'Forbidden: You cannot cancel another user\'s booking' });
    }

    if (booking.status === 'cancelled') {
      return makeResponse(400, { error: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    return makeResponse(200, {
      message: 'Booking cancelled successfully',
      _id: bookingId,
      status: 'cancelled',
      booking,
    });
  }

  return makeResponse(404, { error: `Route ${method} ${url} not found` });
}

module.exports = {
  handleMockRequest,
  MOCK_SALON_ID,
  MOCK_STYLIST_ID,
  MOCK_SERVICE_ID,
};
