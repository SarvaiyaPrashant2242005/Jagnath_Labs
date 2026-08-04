import api from './api';

const parameterService = {
  getParameters: async () => {
    const response = await api.get('/parameter');
    if (response.data && response.data.data) {
      const params = response.data.data.map(p => {
        let extra = { unit: '—', price: 150, turnaround: '2 hrs', text: p.description || '' };
        try {
          if (p.description && p.description.startsWith('{')) {
            extra = { ...extra, ...JSON.parse(p.description) };
          }
        } catch (e) {
          extra.text = p.description || '';
        }
        return {
          id: p.id,
          name: p.parameterName,
          description: extra.text,
          unit: extra.unit || '—',
          price: Number(extra.price || 150),
          turnaround: extra.turnaround || '2 hrs',
          categories: [] // Mappings will be populated by Category-Parameter API
        };
      });
      response.data.data = params;
    }
    return response.data;
  },

  createParameter: async (paramData) => {
    const descriptionJson = JSON.stringify({
      unit: paramData.unit || '—',
      price: paramData.price || 150,
      turnaround: paramData.turnaround || '2 hrs',
      text: paramData.description || ''
    });
    const payload = {
      parameterName: paramData.name,
      description: descriptionJson,
      status: 'Active'
    };
    const response = await api.post('/parameter', payload);
    return response.data;
  },

  updateParameter: async (id, paramData) => {
    const descriptionJson = JSON.stringify({
      unit: paramData.unit || '—',
      price: paramData.price || 150,
      turnaround: paramData.turnaround || '2 hrs',
      text: paramData.description || ''
    });
    const payload = {
      parameterName: paramData.name,
      description: descriptionJson,
      status: paramData.status || 'Active'
    };
    const response = await api.put(`/parameter/${id}`, payload);
    return response.data;
  },

  deleteParameter: async (id) => {
    const response = await api.delete(`/parameter/${id}`);
    return response.data;
  }
};

export default parameterService;
