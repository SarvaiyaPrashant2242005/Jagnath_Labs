import api from './api';

const testRequestService = {
  getTestRequests: async () => {
    const response = await api.get('/test-request');
    return response.data;
  },

  getTestRequestById: async (id) => {
    const response = await api.get(`/test-request/${id}`);
    return response.data;
  },

  createTestRequest: async (trData) => {
    const payload = {
      companyName: trData.company,
      clientName: trData.client,
      contactNumber: trData.clientContact || '',
      remarks: trData.remarks || trData.notes || '',
      sampleParticular: trData.sampleType || trData.sampleCategory || '',
      dateOfCollection: trData.collectionDate || '',
      dateOfReceipt: new Date().toISOString().split('T')[0],
      sampleQuantity: trData.quantity || '',
      sampleCollectedBy: trData.collectedBy || '',
      packingDetails: trData.containerType || '',
      status: 'Active'
    };
    const response = await api.post('/test-request', payload);
    return response.data;
  },

  updateTestRequest: async (id, trData) => {
    const payload = {
      companyName: trData.company,
      clientName: trData.client,
      contactNumber: trData.clientContact || '',
      remarks: trData.remarks || trData.notes || '',
      sampleParticular: trData.sampleType || trData.sampleCategory || '',
      dateOfCollection: trData.collectionDate || '',
      sampleQuantity: trData.quantity || '',
      sampleCollectedBy: trData.collectedBy || '',
      packingDetails: trData.containerType || '',
      status: trData.status || 'Active'
    };
    const response = await api.put(`/test-request/${id}`, payload);
    return response.data;
  },

  deleteTestRequest: async (id) => {
    const response = await api.delete(`/test-request/${id}`);
    return response.data;
  },

  // Test Request Parameter Mappings (transactions)
  getTransactions: async () => {
    const response = await api.get('/test-request-parameter');
    return response.data;
  },

  createTransaction: async (testRequestId, parameterId, extra = {}) => {
    const response = await api.post('/test-request-parameter', {
      testRequestId,
      parameterId,
      testMethod: extra.testMethod || 'Standard Protocol',
      unit: extra.unit || '—',
      result: extra.result || null,
      remark: extra.remark || '',
      status: extra.status || 'Pending',
      enteredBy: extra.enteredBy || 'Lab Administrator',
      enteredAt: new Date().toISOString()
    });
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/test-request-parameter/${id}`);
    return response.data;
  }
};

export default testRequestService;
