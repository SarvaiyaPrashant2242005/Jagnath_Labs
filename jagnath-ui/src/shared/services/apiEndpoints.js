/**
 * @file apiEndpoints.js
 * @description Centralized registry of all backend API endpoint paths.
 * Import these constants wherever an API call is needed — never hardcode endpoint strings.
 *
 * Base URL is resolved from the VITE_API_BASE_URL environment variable.
 */

// ─── Base URL ───────────────────────────────────────────────────────────────────
console.log("ENV OBJECT:", import.meta.env);
console.log("API URL:", import.meta.env.VITE_API_BASE_URL);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log(API_BASE_URL);
// ─── Auth Endpoints ─────────────────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  ME: `${API_BASE_URL}/auth/me`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
};

// ─── Company Endpoints ──────────────────────────────────────────────────────────
export const COMPANY_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/company`,
  GET_MY: `${API_BASE_URL}/company`,
  UPDATE: (id) => `${API_BASE_URL}/company/${id}`,
  DELETE: (id) => `${API_BASE_URL}/company/${id}`,
};

// ─── Client Endpoints ───────────────────────────────────────────────────────────
export const CLIENT_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/client`,
  GET_ALL: `${API_BASE_URL}/client`,
  GET_BY_ID: (id) => `${API_BASE_URL}/client/${id}`,
  UPDATE: (id) => `${API_BASE_URL}/client/${id}`,
  DELETE: (id) => `${API_BASE_URL}/client/${id}`,
};

// ─── Parameter Endpoints ────────────────────────────────────────────────────────
export const PARAMETER_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/parameter`,
  GET_ALL: `${API_BASE_URL}/parameter`,
  GET_BY_ID: (id) => `${API_BASE_URL}/parameter/${id}`,
  UPDATE: (id) => `${API_BASE_URL}/parameter/${id}`,
  DELETE: (id) => `${API_BASE_URL}/parameter/${id}`,
};

// ─── Category Endpoints ─────────────────────────────────────────────────────────
export const CATEGORY_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/category`,
  GET_ALL: `${API_BASE_URL}/category`,
  GET_BY_ID: (id) => `${API_BASE_URL}/category/${id}`,
  UPDATE: (id) => `${API_BASE_URL}/category/${id}`,
  DELETE: (id) => `${API_BASE_URL}/category/${id}`,
};

// ─── Category-Parameter Mapping Endpoints ───────────────────────────────────────
export const CATEGORY_PARAMETER_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/category-parameter`,
  GET_ALL: `${API_BASE_URL}/category-parameter`,
  GET_BY_ID: (id) => `${API_BASE_URL}/category-parameter/${id}`,
  GET_BY_CATEGORY: (categoryId) => `${API_BASE_URL}/category-parameter/category/${categoryId}`,
  UPDATE: (id) => `${API_BASE_URL}/category-parameter/${id}`,
  DELETE: (id) => `${API_BASE_URL}/category-parameter/${id}`,
};

// ─── Test Request Endpoints ─────────────────────────────────────────────────────
export const TEST_REQUEST_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/test-request`,
  GET_ALL: `${API_BASE_URL}/test-request`,
  GET_BY_ID: (id) => `${API_BASE_URL}/test-request/${id}`,
  UPDATE: (id) => `${API_BASE_URL}/test-request/${id}`,
  DELETE: (id) => `${API_BASE_URL}/test-request/${id}`,
};

// ─── Test Request Parameter (Transaction) Endpoints ─────────────────────────────
export const TEST_REQUEST_PARAMETER_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/test-request-parameter`,
  GET_ALL: `${API_BASE_URL}/test-request-parameter`,
  GET_BY_ID: (id) => `${API_BASE_URL}/test-request-parameter/${id}`,
  UPDATE: (id) => `${API_BASE_URL}/test-request-parameter/${id}`,
  DELETE: (id) => `${API_BASE_URL}/test-request-parameter/${id}`,
};
