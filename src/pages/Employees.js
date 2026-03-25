import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil
} from 'react-icons/hi';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const initialForm = { employee_id: '', full_name: '', email: '', department: '' };

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployees(search);
      setEmployees(res.data.results || res.data);
    } catch (err) {
      setError('Failed to load employees. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(), 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const validateForm = () => {
    const errors = {};
    if (!form.employee_id.trim()) errors.employee_id = 'Employee ID is required';
    if (!form.full_name.trim()) errors.full_name = 'Full name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!form.department.trim()) errors.department = 'Department is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setForm(initialForm);
    setFormErrors({});
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setForm({
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      email: emp.email,
      department: emp.department,
    });
    setFormErrors({});
    setEditing(emp);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateEmployee(editing.id, form);
        toast.success('Employee updated successfully');
      } else {
        await createEmployee(form);
        toast.success('Employee added successfully');
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const serverErrors = {};
        Object.keys(data).forEach((key) => {
          serverErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        });
        setFormErrors(serverErrors);
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
      await deleteEmployee(deleteTarget.id);
      toast.success('Employee deleted successfully');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <p>Manage your employee records</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <HiOutlinePlus /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-bar">
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {loading ? (
          <Loading message="Loading employees..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEmployees} />
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            message={search ? 'Try a different search term' : 'Add your first employee to get started'}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td><strong>{emp.employee_id}</strong></td>
                    <td>{emp.full_name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>
                      <span className="badge badge-present">{emp.total_present}</span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" title="Edit" onClick={() => openEditModal(emp)}>
                          <HiOutlinePencil size={18} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => setDeleteTarget(emp)}>
                          <HiOutlineTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  className={`form-control ${formErrors.employee_id ? 'error' : ''}`}
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  placeholder="e.g. EMP001"
                />
                {formErrors.employee_id && <p className="error-text">{formErrors.employee_id}</p>}
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  className={`form-control ${formErrors.department ? 'error' : ''}`}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
                {formErrors.department && <p className="error-text">{formErrors.department}</p>}
              </div>
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                className={`form-control ${formErrors.full_name ? 'error' : ''}`}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g. John Doe"
              />
              {formErrors.full_name && <p className="error-text">{formErrors.full_name}</p>}
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? 'error' : ''}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. john@company.com"
              />
              {formErrors.email && <p className="error-text">{formErrors.email}</p>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee?"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This will also remove all their attendance records.`}
        loading={deleting}
      />
    </div>
  );
};

export default Employees;
