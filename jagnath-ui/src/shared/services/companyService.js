import api from './api';

const companyService = {
  getCompany: async () => {
    try {
      const response = await api.get('/company');
      return response.data;
    } catch (error) {
      // If no company found (404), return null instead of throwing to simplify empty state checking
      if (error.response && error.response.status === 404) {
        return { success: true, data: null };
      }
      throw error;
    }
  },

  createCompany: async (companyData) => {
    // Map frontend fields (name, location, gst) to backend model
    const payload = {
      companyName: companyData.name,
      companyEmail: companyData.email || `${companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@jagnath.com`,
      phone: companyData.phone || '9999999999',
      address: companyData.location,
      description: `Established: ${companyData.sinceMonth} ${companyData.sinceYear}`,
      status: 'Active'
    };
    const response = await api.post('/company', payload);
    return response.data;
  },

  updateCompany: async (id, companyData) => {
    const payload = {
      companyName: companyData.name,
      companyEmail: companyData.email || `${companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@jagnath.com`,
      phone: companyData.phone || '9999999999',
      address: companyData.location,
      description: `Established: ${companyData.sinceMonth} ${companyData.sinceYear}`,
      status: 'Active'
    };
    const response = await api.put(`/company/${id}`, payload);
    return response.data;
  },

  deleteCompany: async (id) => {
    const response = await api.delete(`/company/${id}`);
    return response.data;
  }
};

export default companyService;
