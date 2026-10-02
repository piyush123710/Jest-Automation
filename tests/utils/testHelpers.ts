import { apiClient, authenticatedClient } from './apiClient';
import { AxiosResponse } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface BookingPayload {
  salonId: string;
  stylistId: string;
  serviceId: string;
  slotTime: string; // "HH:mm"
  date: string;     // "YYYY-MM-DD"
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * POST /api/register
 */
export async function registerUser(payload: RegisterPayload): Promise<AxiosResponse> {
  return apiClient.post('/api/register', payload);
}

/**
 * POST /api/login
 */
export async function loginUser(payload: LoginPayload): Promise<AxiosResponse> {
  return apiClient.post('/api/login', payload);
}

// ─── Salon Helpers ────────────────────────────────────────────────────────────

/**
 * GET /api/salons/:salonId/available-slots?date=&serviceId=
 */
export async function getAvailableSlots(
  salonId: string,
  date: string,
  serviceId: string,
): Promise<AxiosResponse> {
  return apiClient.get(`/api/salons/${salonId}/available-slots`, {
    params: { date, serviceId },
  });
}

// ─── Booking Helpers ──────────────────────────────────────────────────────────

/**
 * POST /api/bookings  (requires auth)
 */
export async function createBooking(
  token: string,
  payload: BookingPayload,
): Promise<AxiosResponse> {
  return authenticatedClient(token).post('/api/bookings', payload);
}

/**
 * DELETE /api/bookings/:id  (requires auth)
 */
export async function cancelBooking(
  token: string,
  bookingId: string,
): Promise<AxiosResponse> {
  return authenticatedClient(token).delete(`/api/bookings/${bookingId}`);
}

// ─── Composite workflow helpers ───────────────────────────────────────────────

/**
 * Registers a new user and immediately logs in,
 * returning the JWT token.  Throws if either step fails.
 */
export async function registerAndLogin(payload: RegisterPayload): Promise<string> {
  const regRes = await registerUser(payload);
  if (regRes.status !== 201) {
    throw new Error(
      `Registration failed [${regRes.status}]: ${JSON.stringify(regRes.data)}`,
    );
  }

  const loginRes = await loginUser({
    email: payload.email,
    password: payload.password,
  });

  if (loginRes.status !== 200) {
    throw new Error(
      `Login failed [${loginRes.status}]: ${JSON.stringify(loginRes.data)}`,
    );
  }

  const token: string = loginRes.data?.token;
  if (!token) throw new Error('No token returned from /api/login');
  return token;
}

/**
 * Generates a unique email address so tests don't clash.
 */
export function uniqueEmail(prefix = 'testuser'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9999)}@test.com`;
}

/**
 * Returns tomorrow's date as "YYYY-MM-DD" (safe test date).
 */
export function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
