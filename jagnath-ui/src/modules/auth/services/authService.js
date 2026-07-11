/**
 * @file authService.js
 * @description Auth module service layer — handles login API call,
 * token persistence, and session management.
 */

import { apiService } from "../../../shared/services/apiService";
import { AUTH_ENDPOINTS } from "../../../shared/services/apiEndpoints";

/**
 * Call the server login endpoint.
 * On success, persists accessToken and refreshToken to localStorage.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<object>} Parsed success response body from the server
 * @throws {object} Server error body with `message` / `messageToShow`
 */
export const loginUser = async (credentials) => {
  const data = await apiService.post(AUTH_ENDPOINTS.LOGIN, credentials);

  // Persist tokens returned by the server
  if (data?.data?.accessToken) {
    localStorage.setItem("accessToken", data.data.accessToken);
  }
  if (data?.data?.refreshToken) {
    localStorage.setItem("refreshToken", data.data.refreshToken);
  }
  if (data?.data?.user) {
    localStorage.setItem("user", JSON.stringify(data.data.user));
  }

  return data;
};

/**
 * Clear all auth-related data from localStorage.
 */
export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

/**
 * Retrieve the currently stored user object (if any).
 * @returns {object|null}
 */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
