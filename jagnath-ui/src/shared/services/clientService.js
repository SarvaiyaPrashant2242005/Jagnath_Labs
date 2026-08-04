import api from './api';

const clientService = {
  getClients: async () => {
    const response = await api.get('/client');
    return response.data;
  },

  createClient: async (clientData) => {
    const payload = {
      companyName: clientData.company,
      clientName: clientData.name,
      contactNumber: clientData.phone.replace(/[^0-9]/g, ''), // Joi checks for digits only
      address: clientData.address || clientData.email || 'Default Address',
      city: clientData.city || 'Rajkot',
      gender: clientData.gender || 'Male',
      status: 'Active'
    };
    const response = await api.post('/client', payload);
    return response.data;
  },

  updateClient: async (id, clientData) => {
    const payload = {
      companyName: clientData.company,
      clientName: clientData.name,
      contactNumber: clientData.phone.replace(/[^0-9]/g, ''),
      address: clientData.address || clientData.email || 'Default Address',
      city: clientData.city || 'Rajkot',
      gender: clientData.gender || 'Male',
      status: clientData.status || 'Active'
    };
    const response = await api.put(`/client/${id}`, payload);
    return response.data;
  },

  deleteClient: async (id) => {
    const response = await api.delete(`/client/${id}`);
    return response.data;
  }
};

export default clientService;
