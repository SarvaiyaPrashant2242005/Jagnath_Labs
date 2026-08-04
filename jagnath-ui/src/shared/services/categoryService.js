import api from './api';

const categoryService = {
  getCategories: async () => {
    const response = await api.get('/category');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const payload = {
      name: categoryData.name,
      description: categoryData.description || '',
      status: 'Active'
    };
    const response = await api.post('/category', payload);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const payload = {
      name: categoryData.name,
      description: categoryData.description || '',
      status: categoryData.status || 'Active'
    };
    const response = await api.put(`/category/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/category/${id}`);
    return response.data;
  }
};

export default categoryService;
