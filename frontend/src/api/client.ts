import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);
export const getTimeline = () => api.get('/dashboard/timeline').then(r => r.data);

// Partners
export const getPartners = (params?: Record<string, unknown>) => api.get('/partners', { params }).then(r => r.data);
export const getPartner = (id: string) => api.get(`/partners/${id}`).then(r => r.data);
export const createPartner = (data: Record<string, unknown>) => api.post('/partners', data).then(r => r.data);
export const updatePartner = (id: string, data: Record<string, unknown>) => api.patch(`/partners/${id}`, data).then(r => r.data);

// Content
export const getContent = (params?: Record<string, unknown>) => api.get('/content', { params }).then(r => r.data);
export const updateContent = (id: string, data: Record<string, unknown>) => api.patch(`/content/${id}`, data).then(r => r.data);
export const getWorkflow = (contentId: string) => api.get(`/content/${contentId}/workflow`).then(r => r.data);
export const updateWorkflowStep = (id: string, data: Record<string, unknown>) => api.patch(`/workflow/${id}`, data).then(r => r.data);

// Issues
export const getIssues = (params?: Record<string, unknown>) => api.get('/issues', { params }).then(r => r.data);
export const createIssue = (data: Record<string, unknown>) => api.post('/issues', data).then(r => r.data);
export const updateIssue = (id: string, data: Record<string, unknown>) => api.patch(`/issues/${id}`, data).then(r => r.data);

// Reports
export const getPartnerReport = (partnerId: string) => api.get(`/reports/partner/${partnerId}`).then(r => r.data);
