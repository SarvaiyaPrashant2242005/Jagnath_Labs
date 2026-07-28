/**
 * @file priceMasterService.js
 * @description Frontend API service for Price Master module.
 */

import { apiService } from "../../../shared/services/apiService";
import { PRICE_MASTER_ENDPOINTS } from "../../../shared/services/apiEndpoints";

export const priceMasterService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.categoryId) query.append("categoryId", params.categoryId);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return await apiService.get(`${PRICE_MASTER_ENDPOINTS.GET_ALL}${queryString}`);
  },

  getById: async (id) => {
    return await apiService.get(PRICE_MASTER_ENDPOINTS.GET_BY_ID(id));
  },

  create: async (data) => {
    return await apiService.post(PRICE_MASTER_ENDPOINTS.CREATE, data);
  },

  update: async (id, data) => {
    return await apiService.put(PRICE_MASTER_ENDPOINTS.UPDATE(id), data);
  },

  delete: async (id) => {
    return await apiService.delete(PRICE_MASTER_ENDPOINTS.DELETE(id));
  }
};
