import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee APIs
export const getEmployees = (search = '') => {
  const params = search ? { search } : {};
  return api.get('/employees/', { params });
};

export const getEmployee = (id) => api.get(`/employees/${id}/`);

export const createEmployee = (data) => api.post('/employees/', data);

export const updateEmployee = (id, data) => api.put(`/employees/${id}/`, data);

export const deleteEmployee = (id) => api.delete(`/employees/${id}/`);

export const getDashboard = () => api.get('/employees/dashboard/');

// Attendance APIs
export const getAttendance = (params = {}) => api.get('/attendance/', { params });

export const createAttendance = (data) => api.post('/attendance/', data);

export const updateAttendance = (id, data) => api.put(`/attendance/${id}/`, data);

export const deleteAttendance = (id) => api.delete(`/attendance/${id}/`);

export default api;
