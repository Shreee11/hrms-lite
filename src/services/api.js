import axios from 'axios';
import { authStore } from '../store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const { accessToken } = authStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Silent token refresh on 401
let _refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        authStore.clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      if (!_refreshPromise) {
        _refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
          .then((res) => {
            const { access_token, refresh_token } = res.data;
            const { user } = authStore.getState();
            authStore.setAuth(user, access_token);
            localStorage.setItem('refresh_token', refresh_token);
            return access_token;
          })
          .catch(() => {
            authStore.clearAuth();
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          })
          .finally(() => { _refreshPromise = null; });
      }
      const newToken = await _refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) => axios.post(`${API_BASE_URL}/auth/login`, data);
export const logout = () => api.post('/auth/logout');
export const changePassword = (data) => api.post('/auth/change-password', data);
export const getMe = () => api.get('/auth/me');

// ── Employee APIs ─────────────────────────────────────────────────────────────
export const getEmployees = (search = '') => {
  const params = search ? { search } : {};
  return api.get('/employees/', { params });
};
export const getEmployee = (id) => api.get(`/employees/${id}/`);
export const createEmployee = (data) => api.post('/employees/', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}/`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}/`);
export const getDashboard = () => api.get('/employees/dashboard/');

// ── Attendance APIs ───────────────────────────────────────────────────────────
export const getAttendance = (params = {}) => api.get('/attendance/', { params });
export const createAttendance = (data) => api.post('/attendance/', data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}/`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}/`);

// ── Department & Designation APIs ─────────────────────────────────────────────
export const getDepartments = () => api.get('/departments/');
export const createDepartment = (data) => api.post('/departments/', data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

export const getDesignations = () => api.get('/designations/');
export const createDesignation = (data) => api.post('/designations/', data);
export const deleteDesignation = (id) => api.delete(`/designations/${id}`);

// ── Leave APIs ────────────────────────────────────────────────────────────────
export const getLeaveTypes = () => api.get('/leave/types/');
export const createLeaveType = (data) => api.post('/leave/types/', data);
export const updateLeaveType = (id, data) => api.put(`/leave/types/${id}`, data);
export const deleteLeaveType = (id) => api.delete(`/leave/types/${id}`);

export const getLeaveBalance = (params = {}) => api.get('/leave/balance/', { params });
export const getAllLeaveBalances = (year) => api.get('/leave/balance/all/', { params: { year } });
export const allocateLeaveBalance = (data) => api.post('/leave/balance/allocate/', data);
export const getLeaveRequests = (params = {}) => api.get('/leave/requests/', { params });
export const createLeaveRequest = (data) => api.post('/leave/requests/', data);
export const approveLeave = (id, data = {}) => api.patch(`/leave/requests/${id}/approve`, data);
export const rejectLeave = (id, data = {}) => api.patch(`/leave/requests/${id}/reject`, data);
export const cancelLeave = (id) => api.patch(`/leave/requests/${id}/cancel`);

// ── Payroll APIs ──────────────────────────────────────────────────────────────
export const getSalaryStructures = () => api.get('/payroll/salary-structures/');
export const createSalaryStructure = (data) => api.post('/payroll/salary-structures/', data);
export const updateSalaryStructure = (id, data) => api.put(`/payroll/salary-structures/${id}`, data);
export const getSalaryHistory = (id) => api.get(`/payroll/salary-structures/${id}/history`);

export const getPayrollRuns = () => api.get('/payroll/runs/');
export const createPayrollRun = (data) => api.post('/payroll/runs/', data);
export const approvePayrollRun = (id) => api.patch(`/payroll/runs/${id}/approve`);
export const markRunPaid = (id) => api.patch(`/payroll/runs/${id}/mark-paid`);

export const getPayslips = (params = {}) => api.get('/payroll/payslips/', { params });

// ── Reports APIs ──────────────────────────────────────────────────────────────
export const getHeadcountReport = () => api.get('/reports/headcount');
export const getAttendanceReport = (params = {}) => api.get('/reports/attendance', { params });
export const getLeaveReport = (params = {}) => api.get('/reports/leave', { params });
export const getPayrollReport = (params = {}) => api.get('/reports/payroll', { params });
export const getTurnoverReport = (params = {}) => api.get('/reports/turnover', { params });

// ── Attendance Self-Service ───────────────────────────────────────────────────
export const getMyTodayAttendance = () => api.get('/attendance/my/today');
export const clockIn = () => api.post('/attendance/my/clock-in');
export const clockOut = () => api.post('/attendance/my/clock-out');
export const getMyAttendanceHistory = (month, year) =>
  api.get('/attendance/my/history', { params: { month, year } });

// ── My Payslips ───────────────────────────────────────────────────────────────
export const getMyPayslips = () => api.get('/payroll/payslips/');

// ── Onboarding APIs ───────────────────────────────────────────────────────────
export const getOnboardingList = () => api.get('/onboarding/');
export const startOnboarding = (employeeId) => api.post(`/onboarding/${employeeId}`);
export const updateOnboardingStep = (employeeId, stepKey, data) =>
  api.patch(`/onboarding/${employeeId}/steps/${stepKey}`, data);
export const deleteOnboarding = (employeeId) => api.delete(`/onboarding/${employeeId}`);

// ── Documents APIs ────────────────────────────────────────────────────────────
export const getDocuments = (params = {}) => api.get('/documents/', { params });
export const uploadDocument = (data) => api.post('/documents/', data);
export const downloadDocument = (docId) =>
  api.get(`/documents/${docId}/download`, { responseType: 'blob' });
export const deleteDocument = (docId) => api.delete(`/documents/${docId}`);

// ── My Leave Balance & Calendar ───────────────────────────────────────────────
export const getMyLeaveBalance = (year) => api.get('/leave/my-balance/', { params: year ? { year } : {} });
export const getLeaveCalendar = (month, year, filter_type = 'me') =>
  api.get('/leave/calendar/', { params: { month, year, filter_type } });

// ── Holidays ──────────────────────────────────────────────────────────────────
export const getHolidays = (year) => api.get('/holidays/', { params: year ? { year } : {} });
export const createHoliday = (data) => api.post('/holidays/', data);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`);

export default api;
