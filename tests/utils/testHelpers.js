const { apiClient, authenticatedClient } = require('./apiClient');

async function registerUser(payload) {
  return apiClient.post('/api/register', payload);
}

async function loginUser(payload) {
  return apiClient.post('/api/login', payload);
}

async function getAvailableSlots(salonId, date, serviceId) {
  return apiClient.get(`/api/salons/${salonId}/available-slots`, {
    params: { date, serviceId },
  });
}

async function createBooking(token, payload) {
  return authenticatedClient(token).post('/api/bookings', payload);
}

async function cancelBooking(token, bookingId) {
  return authenticatedClient(token).delete(`/api/bookings/${bookingId}`);
}

async function registerAndLogin(payload) {
  const regRes = await registerUser(payload);
  if (regRes.status !== 201) {
    throw new Error(
      `Registration failed [${regRes.status}]: ${JSON.stringify(regRes.data)}`
    );
  }

  const loginRes = await loginUser({
    email: payload.email,
    password: payload.password,
  });

  if (loginRes.status !== 200) {
    throw new Error(
      `Login failed [${loginRes.status}]: ${JSON.stringify(loginRes.data)}`
    );
  }

  const token = loginRes.data?.token;
  if (!token) throw new Error('No token returned from /api/login');
  return token;
}

function uniqueEmail(prefix = 'testuser') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9999)}@test.com`;
}

function tomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

module.exports = {
  registerUser,
  loginUser,
  getAvailableSlots,
  createBooking,
  cancelBooking,
  registerAndLogin,
  uniqueEmail,
  tomorrowDate,
};
