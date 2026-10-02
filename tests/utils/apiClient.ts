import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Pre-configured Axios instance for the Salon API.
 * All test helpers use this single instance so the base URL
 * only needs to be set in one place (.env / BASE_URL).
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't throw on non-2xx so we can assert error responses in tests
  validateStatus: () => true,
  timeout: 15000,
});

/**
 * Returns a clone of the shared client with an Authorization header
 * set to `Bearer <token>`.
 */
export function authenticatedClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
    timeout: 15000,
  });
}

export { BASE_URL };
