/**
 * @file apiService.js
 * @description Lightweight HTTP client built on top of the native fetch API.
 * Automatically attaches the JWT access token from sessionStorage and provides
 * standardised JSON request/response helpers for GET, POST, PUT, DELETE.
 */

// ─── Token helpers ──────────────────────────────────────────────────────────────

/**
 * Retrieve the stored access token.
 * @returns {string|null}
 */
const getAccessToken = () =>
  sessionStorage.getItem("accessToken") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token");

/**
 * Build default request headers.
 * @param {boolean} isJson – whether the body will be JSON (default true)
 * @returns {HeadersInit}
 */
const buildHeaders = (isJson = true) => {
  const headers = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// ─── Core request function ──────────────────────────────────────────────────────

import { AUTH_ENDPOINTS } from "./apiEndpoints";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Make an HTTP request and return the parsed JSON body.
 *
 * @param {string}  url     – Full endpoint URL (use values from apiEndpoints.js)
 * @param {object}  options – Fetch options override
 * @returns {Promise<object>} Parsed response body
 * @throws {object} The error body from the server or a network error wrapper
 */
const request = async (url, options = {}) => {
  const config = {
    headers: buildHeaders(),
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data || {
      success: false,
      message: `HTTP ${response.status}: ${response.statusText}`,
    };

    // Handle Token Expiry & Unauthorized Access (401 only)
    if (response.status === 401) {
      const refreshToken = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");

      // Prevent infinite loops for the refresh endpoint itself or missing refresh token
      if (url === AUTH_ENDPOINTS.REFRESH_TOKEN || !refreshToken) {
        sessionStorage.clear();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw error;
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          return request(url, options);
        }).catch(err => {
          throw err;
        });
      }

      isRefreshing = true;

      return new Promise((resolve, reject) => {
        fetch(AUTH_ENDPOINTS.REFRESH_TOKEN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        })
          .then(res => res.json())
          .then(refreshData => {
            if (refreshData?.success && (refreshData?.data?.accessToken || refreshData?.data?.token)) {
              const newAccessToken = refreshData.data.accessToken || refreshData.data.token;
              sessionStorage.setItem("accessToken", newAccessToken);
              sessionStorage.setItem("token", newAccessToken);
              localStorage.setItem("token", newAccessToken);
              localStorage.setItem("accessToken", newAccessToken);

              if (refreshData.data.refreshToken) {
                 sessionStorage.setItem("refreshToken", refreshData.data.refreshToken);
                 localStorage.setItem("refreshToken", refreshData.data.refreshToken);
              }
              processQueue(null, newAccessToken);
              resolve(request(url, options));
            } else {
              sessionStorage.clear();
              localStorage.removeItem("accessToken");
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.hash = '#/login';
              processQueue(error, null);
              reject(error);
            }
          })
          .catch(err => {
            sessionStorage.clear();
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.hash = '#/login';
            processQueue(err, null);
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    throw error;
  }

  return data;
};

// ─── Public helpers ─────────────────────────────────────────────────────────────

export const apiService = {
  /**
   * GET request.
   * @param {string} url
   */
  get: (url) => request(url, { method: "GET" }),

  /**
   * POST request with a JSON body.
   * @param {string} url
   * @param {object} body
   */
  post: (url, body) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /**
   * POST request with FormData (e.g. file uploads).
   */
  postForm: (url, formData) =>
    request(url, {
      method: "POST",
      headers: buildHeaders(false),
      body: formData,
    }),

  /**
   * PUT request with a JSON body.
   * @param {string} url
   * @param {object} body
   */
  put: (url, body) =>
    request(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /**
   * PUT request with FormData (e.g. file uploads).
   */
  putForm: (url, formData) =>
    request(url, {
      method: "PUT",
      headers: buildHeaders(false),
      body: formData,
    }),

  /**
   * PATCH request with a JSON body.
   * @param {string} url
   * @param {object} body
   */
  patch: (url, body) =>
    request(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /**
   * DELETE request.
   * @param {string} url
   */
  delete: (url) => request(url, { method: "DELETE" }),
};
