/**
 * @file blogService.js
 * @description Frontend API integration service for Blog management & public consumption.
 */

import api from '../../../shared/services/api';
import { BLOG_ENDPOINTS } from '../../../shared/services/apiEndpoints';

export const blogService = {
  // Public APIs
  getPublicBlogs: async (params = {}) => {
    const res = await api.get(BLOG_ENDPOINTS.PUBLIC_GET_ALL, { params });
    return res.data;
  },

  getPublicBlogBySlug: async (slug) => {
    const res = await api.get(BLOG_ENDPOINTS.PUBLIC_GET_BY_SLUG(slug));
    return res.data;
  },

  getPublicCategories: async () => {
    const res = await api.get(BLOG_ENDPOINTS.PUBLIC_GET_CATEGORIES);
    return res.data;
  },

  // Authenticated Author APIs
  getMyBlogs: async (params = {}) => {
    const res = await api.get(BLOG_ENDPOINTS.GET_MY_BLOGS, { params });
    return res.data;
  },

  getBlogById: async (id) => {
    const res = await api.get(BLOG_ENDPOINTS.GET_BY_ID(id));
    return res.data;
  },

  createBlog: async (blogData) => {
    const res = await api.post(BLOG_ENDPOINTS.CREATE, blogData);
    return res.data;
  },

  updateBlog: async (id, blogData) => {
    const res = await api.put(BLOG_ENDPOINTS.UPDATE(id), blogData);
    return res.data;
  },

  deleteBlog: async (id) => {
    const res = await api.delete(BLOG_ENDPOINTS.DELETE(id));
    return res.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post(BLOG_ENDPOINTS.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export default blogService;

