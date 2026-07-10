import api from './api';

const categoryParameterService = {
  getMappings: async () => {
    const response = await api.get('/category-parameter');
    return response.data;
  },

  createMapping: async (categoryId, parameterId) => {
    const response = await api.post('/category-parameter', {
      categoryId,
      parameterId,
      status: 'Active'
    });
    return response.data;
  },

  deleteMapping: async (id) => {
    const response = await api.delete(`/category-parameter/${id}`);
    return response.data;
  }
};

export default categoryParameterService;
