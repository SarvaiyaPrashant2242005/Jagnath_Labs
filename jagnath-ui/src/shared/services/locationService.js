/**
 * @file locationService.js
 * @description Service to fetch States and Cities for India (IN) from CountryStateCity API.
 */

const STATE_URL = import.meta.env.VITE_STATE_URL || 'https://api.countrystatecity.in/v1/countries/IN/states';
const API_KEY = import.meta.env.VITE_STATE_CITY_API || 'aad0bc9bbb4bd211bcaf62dd1ee2e882ee8a095f39782c1f4ae67a729fc52dcb';

let cachedStates = null;
const cachedCitiesMap = {};

/**
 * Fetch all states of India (IN) sorted alphabetically.
 * @returns {Promise<Array<{id: number, name: string, iso2: string}>>}
 */
export const getIndianStates = async () => {
  if (cachedStates && cachedStates.length > 0) {
    return cachedStates;
  }

  try {
    const response = await fetch(STATE_URL, {
      method: 'GET',
      headers: {
        'X-CSCAPI-KEY': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const sorted = Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : [];
    cachedStates = sorted;
    return sorted;
  } catch (err) {
    console.error('Failed to fetch Indian states:', err);
    return [];
  }
};

/**
 * Fetch all cities for a specific state ISO2 code (e.g. GJ for Gujarat) sorted alphabetically.
 * @param {string} stateIso2
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
export const getCitiesByStateIso2 = async (stateIso2) => {
  if (!stateIso2) return [];

  const key = String(stateIso2).toUpperCase();
  if (cachedCitiesMap[key] && cachedCitiesMap[key].length > 0) {
    return cachedCitiesMap[key];
  }

  try {
    const url = `https://api.countrystatecity.in/v1/countries/IN/states/${key}/cities`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CSCAPI-KEY': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const sorted = Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : [];
    cachedCitiesMap[key] = sorted;
    return sorted;
  } catch (err) {
    console.error(`Failed to fetch cities for state ${stateIso2}:`, err);
    return [];
  }
};
