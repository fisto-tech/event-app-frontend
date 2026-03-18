import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
};


export const masterApi = {
  // ✅ EXISTING METHODS (keep these as they are)
  getExpos: () => api.get('/master/expos'),
  createExpo: (data) => api.post('/master/expos', data),
  updateExpo: (id, data) => api.put(`/master/expos/${id}`, data),
  deleteExpo: (id) => api.delete(`/master/expos/${id}`),

  // Current Expo (global, DB-backed — affects all users)
  getCurrentExpo: () => api.get('/master/current-expo'),
  setCurrentExpo: (id) => api.put('/master/current-expo', { id }),

  getEnquiryTypes: () => api.get('/master/enquiry-types'),
  createEnquiryType: (data) => api.post('/master/enquiry-types', data),
  updateEnquiryType: (id, data) => api.put(`/master/enquiry-types/${id}`, data),
  deleteEnquiryType: (id) => api.delete(`/master/enquiry-types/${id}`),

  getIndustryTypes: () => api.get('/master/industry-types'),
  createIndustryType: (data) => api.post('/master/industry-types', data),
  updateIndustryType: (id, data) => api.put(`/master/industry-types/${id}`, data),
  deleteIndustryType: (id) => api.delete(`/master/industry-types/${id}`),

  getSmsTemplates: () => api.get('/master/sms-templates'),
  createSmsTemplate: (data) => api.post('/master/sms-templates', data),
  updateSmsTemplate: (id, data) => api.put(`/master/sms-templates/${id}`, data),
  deleteSmsTemplate: (id) => api.delete(`/master/sms-templates/${id}`),

  getWhatsappTemplates: () => api.get('/master/whatsapp-templates'),
  createWhatsappTemplate: (data) => api.post('/master/whatsapp-templates', data),
  updateWhatsappTemplate: (id, data) => api.put(`/master/whatsapp-templates/${id}`, data),
  deleteWhatsappTemplate: (id) => api.delete(`/master/whatsapp-templates/${id}`),

  getEmailTemplates: () => api.get('/master/email-templates'),
  createEmailTemplate: (data) => api.post('/master/email-templates', data),
  deleteEmailTemplate: (id) => api.delete(`/master/email-templates/${id}`),

  // ✅ NEW METHODS

  // Sources Management
  getSources: () => api.get('/master/sources'),
  addSource: (data) => api.post('/master/sources', data),

  // SMS Templates - Context Aware
  // Returns { general, custom, enquiryTypes, industryTypes } scoped to expo when provided
  getSmsTemplatesForContext: (expoId, enquiryTypeId, industryTypeId) => {
    const params = {};
    if (expoId) params.expo_id = expoId;
    if (enquiryTypeId) params.enquiry_type_id = enquiryTypeId;
    if (industryTypeId) params.industry_type_id = industryTypeId;
    return api.get('/master/sms-templates/context', { params });
  },
  createCustomSmsTemplate: (data) => api.post('/master/sms-templates/custom', data),
  deleteCustomSmsTemplate: (id) => api.delete(`/master/sms-templates/custom/${id}`),

  // WhatsApp Templates - Context Aware
  // Returns { general, custom, enquiryTypes, industryTypes } — enquiry/industry scoped to expo when provided
  getWhatsappTemplatesForContext: (expoId, enquiryTypeId, industryTypeId) => {
    const params = {};
    if (expoId) params.expo_id = expoId;
    if (enquiryTypeId) params.enquiry_type_id = enquiryTypeId;
    if (industryTypeId) params.industry_type_id = industryTypeId;
    return api.get('/master/whatsapp-templates/context', { params });
  },
  createCustomWhatsappTemplate: (data) => api.post('/master/whatsapp-templates/custom', data),
  deleteCustomWhatsappTemplate: (id) => api.delete(`/master/whatsapp-templates/custom/${id}`),

  // Email Templates - Context Aware
  getEmailTemplatesForContext: (expoId, enquiryTypeId) => {
    const params = {};
    if (expoId) params.expo_id = expoId;
    if (enquiryTypeId) params.enquiry_type_id = enquiryTypeId;
    return api.get('/master/email-templates/context', { params });
  },
  createCustomEmailTemplate: (data) => api.post('/master/email-templates/custom', data),
};

// export const masterApi = {
//   getExpos: () => api.get('/master/expos'),
//   createExpo: (data) => api.post('/master/expos', data),
//   updateExpo: (id, data) => api.put(`/master/expos/${id}`, data),
//   deleteExpo: (id) => api.delete(`/master/expos/${id}`),

//   getEnquiryTypes: () => api.get('/master/enquiry-types'),
//   createEnquiryType: (data) => api.post('/master/enquiry-types', data),
//   deleteEnquiryType: (id) => api.delete(`/master/enquiry-types/${id}`),

//   getIndustryTypes: () => api.get('/master/industry-types'),
//   createIndustryType: (data) => api.post('/master/industry-types', data),
//   deleteIndustryType: (id) => api.delete(`/master/industry-types/${id}`),

//   getSmsTemplates: () => api.get('/master/sms-templates'),
//   createSmsTemplate: (data) => api.post('/master/sms-templates', data),
//   deleteSmsTemplate: (id) => api.delete(`/master/sms-templates/${id}`),

//   getWhatsappTemplates: () => api.get('/master/whatsapp-templates'),
//   createWhatsappTemplate: (data) => api.post('/master/whatsapp-templates', data),
//   deleteWhatsappTemplate: (id) => api.delete(`/master/whatsapp-templates/${id}`),

//   getEmailTemplates: () => api.get('/master/email-templates'),
//   createEmailTemplate: (data) => api.post('/master/email-templates', data),
//   deleteEmailTemplate: (id) => api.delete(`/master/email-templates/${id}`),
// };

export const customerApi = {
  getAll: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  sync: (records) => api.post('/customers/sync', { records }),
};

export const employeeApi = {
  getAll: () => api.get('/employees'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// followup API
export const followupApi = {
  // GET /followups?date=YYYY-MM-DD&search=xxx
  getByDate: (params) =>
    api.get('/followups', { params }).then((res) => res.data),
 
  // GET /followups/:id/detail
  getDetail: (id) =>
    api.get(`/followups/${id}/detail`).then((res) => res.data),
 
  // GET /followups/:id/history
  getHistory: (id) =>
    api.get(`/followups/${id}/history`).then((res) => res.data),
 
  // POST /followups/:customerId/log
  createLog: (customerId, data) =>
    api.post(`/followups/${customerId}/log`, data).then((res) => res.data),
 
  // GET /followups/admin/missed?search=&stage=&employee_id=
  getAdminMissed: (params) =>
    api.get('/followups/admin/missed', { params }).then((res) => res.data),
};
 

export default api;