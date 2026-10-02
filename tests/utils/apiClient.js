const axios = require('axios');
const dotenv = require('dotenv');
const { handleMockRequest } = require('./mockServer');

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USE_MOCK = process.env.USE_MOCK !== 'false';

const customAdapter = async (config) => {
  if (USE_MOCK) {
    return handleMockRequest(config);
  }

  try {
    const defaultAdapter = axios.defaults.adapter;
    if (typeof defaultAdapter === 'function') {
      return await defaultAdapter(config);
    }
  } catch (error) {
    if (error && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      return handleMockRequest(config);
    }
    throw error;
  }

  return handleMockRequest(config);
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: customAdapter,
  validateStatus: () => true,
  timeout: 15000,
});

function authenticatedClient(token) {
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

module.exports = {
  apiClient,
  authenticatedClient,
  BASE_URL,
  USE_MOCK,
};
