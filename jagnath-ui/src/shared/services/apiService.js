/**
 * @file apiService.js
 * @description Lightweight HTTP client built on top of the native fetch API.
 * Automatically attaches the JWT access token from localStorage and provides
 * standardised JSON request/response helpers for GET, POST, PUT, DELETE.
 */

// ─── Token helpers ──────────────────────────────────────────────────────────────

/**
 * Retrieve the stored access token.
 * @returns {string|null}
 */
const getAccessToken = () => localStorage.getItem("accessToken");

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
    // Throw the server's error body so callers can show `messageToShow`
    const error = data || {
      success: false,
      message: `HTTP ${response.status}: ${response.statusText}`,
    };
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
   * DELETE request.
   * @param {string} url
   */
  delete: (url) => request(url, { method: "DELETE" }),
};
