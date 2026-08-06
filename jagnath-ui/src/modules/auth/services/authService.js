/**
 * @file authService.js
 * @description Auth module service layer — handles login API call,
 * token persistence, and session management.
 */

import { apiService } from "../../../shared/services/apiService";
import { AUTH_ENDPOINTS } from "../../../shared/services/apiEndpoints";

/**
 * Call the server login endpoint.
 * On success, persists accessToken and refreshToken to sessionStorage.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<object>} Parsed success response body from the server
 * @throws {object} Server error body with `message` / `messageToShow`
 */
export const loginUser = async (credentials) => {
  const data = await apiService.post(AUTH_ENDPOINTS.LOGIN, credentials);

  // Persist tokens returned by the server in both storage mechanisms
  const token = data?.data?.accessToken || data?.data?.token;
  if (token) {
    sessionStorage.setItem("accessToken", token);
    sessionStorage.setItem("token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("accessToken", token);
  }
  if (data?.data?.refreshToken) {
    sessionStorage.setItem("refreshToken", data.data.refreshToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
  }
  if (data?.data?.user) {
    sessionStorage.setItem("user", JSON.stringify(data.data.user));
    localStorage.setItem("user", JSON.stringify(data.data.user));
    if (data.data.user.role) {
      localStorage.setItem("role", data.data.user.role);
    }
  }

  return data;
};

/**
 * Clear all auth-related data from sessionStorage and localStorage.
 */
export const logoutUser = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};

/**
 * Retrieve the currently stored user object (if any).
 * Checks sessionStorage first, falls back to localStorage for cross-tab support.
 * @returns {object|null}
 */
export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
