import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus, HiOutlineTrash
} from 'react-icons/hi';
import { getAttendance, getEmployees, createAttendance, deleteAttendance } from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter state
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form
  const [form, setForm] = useState({ employee: '', date: '', status: 'Present' });
  const [formErrors, setFormErrors] = useState({});

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterEmployee) params.employee = filterEmployee;
      if (filterDate) params.date = filterDate;
      const res = await getAttendance(params);
      setRecords(res.data.results || res.data);
    } catch (err) {
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterDate]);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data.results || res.data);
    } catch (err) {
      // silent fail – employees list is non-critical for display
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const validateForm = () => {
    const errors = {};
    if (!form.employee) errors.employee = 'Select an employee';
    if (!form.date) {
      errors.date = 'Date is required';
    } else if (form.date > new Date().toISOString().split('T')[0]) {
      errors.date = 'Cannot mark attendance for a future date';
    }
    if (!form.status) errors.status = 'Status is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setForm({
      employee: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await createAttendance(form);
      toast.success('Attendance marked successfully');
      setModalOpen(false);
      fetchRecords();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        if (typeof data === 'object' && data.non_field_errors) {
          toast.error(data.non_field_errors[0]);
        } else if (typeof data === 'object') {
          const serverErrors = {};
          Object.keys(data).forEach((key) => {
            serverErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
          });
          setFormErrors(serverErrors);
        } else {
          toast.error('An error occurred');
        }
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAttendance(deleteTarget.id);
      toast.success('Attendance record deleted');
      setDeleteTarget(null);
      fetchRecords();
    } catch (err) {
      toast.error('Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>Track and manage daily attendance</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <HiOutlinePlus /> Mark Attendance
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="form-control"
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name} ({emp.employee_id})
            </option>
          ))}
        </select>
        <input
          type="date"
          className="form-control"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ maxWidth: 200 }}
        />
        {(filterEmployee || filterDate) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setFilterEmployee(''); setFilterDate(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <Loading message="Loading attendance records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecords} />
        ) : records.length === 0 ? (
          <EmptyState
            title="No attendance records"
            message={
              filterEmployee || filterDate
                ? 'No records match the selected filters'
                : 'Mark attendance to see records here'
            }
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td><strong>{rec.employee_eid}</strong></td>
                    <td>{rec.employee_name}</td>
                    <td>{rec.date}</td>
                    <td>
                      <span className={`badge badge-${rec.status.toLowerCase()}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon danger" title="Delete" onClick={() => setDeleteTarget(rec)}>
                        <HiOutlineTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Mark Attendance"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Employee *</label>
              <select
                className={`form-control ${formErrors.employee ? 'error' : ''}`}
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
              {formErrors.employee && <p className="error-text">{formErrors.employee}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className={`form-control ${formErrors.date ? 'error' : ''}`}
                  value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                {formErrors.date && <p className="error-text">{formErrors.date}</p>}
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  className={`form-control ${formErrors.status ? 'error' : ''}`}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
                {formErrors.status && <p className="error-text">{formErrors.status}</p>}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Attendance Record?"
        message={`Remove attendance for "${deleteTarget?.employee_name}" on ${deleteTarget?.date}?`}
        loading={deleting}
      />
    </div>
  );
};

export default Attendance;
