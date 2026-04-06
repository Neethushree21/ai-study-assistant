import api from './axios';

export const uploadNote   = (formData) =>
  api.post('/notes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getNotes     = ()          => api.get('/notes');
export const getNoteById  = (id)        => api.get(`/notes/${id}`);
export const deleteNote   = (id)        => api.delete(`/notes/${id}`);
