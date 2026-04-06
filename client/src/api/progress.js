import api from './axios';

export const saveProgress = (data) => api.post('/progress', data);
export const getProgress  = ()     => api.get('/progress');
export const getStats     = ()     => api.get('/progress/stats');
