/**
 * @file blogUtils.js
 * @description Helper functions for resolving image URLs and formatting blog attributes.
 */

import { BACKEND_ROOT_URL } from '../../../shared/services/apiEndpoints';

/**
 * Normalizes relative uploaded paths to fully qualified image URLs.
 */
export const getBlogImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.replace(/\\/g, '/');
  const idx = cleanPath.lastIndexOf('uploads/');
  if (idx !== -1) {
    return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
  }
  if (path.startsWith('/')) {
    return `${BACKEND_ROOT_URL}${path}`;
  }
  return `${BACKEND_ROOT_URL}/${path}`;
};

