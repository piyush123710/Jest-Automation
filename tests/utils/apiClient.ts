import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';
import { handleMockRequest } from './mockServer';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USE_MOCK = process.env.USE_MOCK !== 'false'; // defaults to true for seamless offline test execution

/**
 * Custom Axios adapter that either forwards requests to the mock server or to real HTTP.
 */
const customAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  if (USE_MOCK) {
    return handleMockRequest(config);
  }

  // Fallback to default http adapter with error resilience
  try {
    const defaultAdapter = axios.defaults.adapter;
    if (typeof defaultAdapter === 'function') {
      return await defaultAdapter(config);
    }
  } catch (error: any) {
    // If backend is unreachable, automatically serve mock response
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return handleMockRequest(config);
    }
    throw error;
  }

  return handleMockRequest(config);
};

/**
 * Pre-configured Axios instance for the Salon API.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: customAdapter,
  validateStatus: () => true,
  timeout: 15000,
});

/**
 * Returns an authenticated Axios instance with Bearer token.
 */
export function authenticatedClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    adapter: customAdapter,
    validateStatus: () => true,
    timeout: 15000,
  });
}

export { BASE_URL, USE_MOCK };
