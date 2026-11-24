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

/**
 * Calculates estimated reading time in minutes based on 200 words per minute.
 */
export const calculateReadingTime = (content) => {
  if (!content) return '3 min read';
  // Strip HTML tags
  const plainText = String(content).replace(/<[^>]*>/g, ' ');
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
};

/**
 * Extracts headings from HTML string and injects IDs so Table of Contents can link to them.
 */
export const processContentWithHeadings = (htmlContent) => {
  if (!htmlContent) return { processedHtml: '', headings: [] };

  const headings = [];
  let index = 0;

  // Match <h2> and <h3> tags
  const processedHtml = htmlContent.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, text) => {
    // Strip inner tags for label
    const plainTitle = text.replace(/<[^>]*>/g, '').trim();
    if (!plainTitle) return match;

    const id = `heading-${index++}-${plainTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    headings.push({
      id,
      text: plainTitle,
      level: tag.toLowerCase() === 'h2' ? 2 : 3
    });

    return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
  });

  return { processedHtml, headings };
};
