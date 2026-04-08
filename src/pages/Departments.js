import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getDesignations, createDesignation, deleteDesignation
} from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Departments = () => {
  // Departments state
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState(null);
  const [deptModal, setDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [deptFormErrors, setDeptFormErrors] = useState({});
  const [deptSubmitting, setDeptSubmitting] = useState(false);
  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null);
  const [deletingDept, setDeletingDept] = useState(false);

  // Designations state
  const [designations, setDesignations] = useState([]);
  const [desigModal, setDesigModal] = useState(false);
  const [desigForm, setDesigForm] = useState({ title: '', department_id: '', salary_grade: '' });
  const [desigSubmitting, setDesigSubmitting] = useState(false);
  const [deleteDesigTarget, setDeleteDesigTarget] = useState(null);
  const [deletingDesig, setDeletingDesig] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true);
    setDeptError(null);
    try {
      const [dRes, desRes] = await Promise.all([getDepartments(), getDesignations()]);
      setDepartments(dRes.data.results || dRes.data);
      setDesignations(desRes.data.results || desRes.data);
    } catch {
      setDeptError('Failed to load departments.');
    } finally {
      setDeptLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  // Dept handlers
  const openAddDept = () => { setDeptForm({ name: '' }); setDeptFormErrors({}); setEditingDept(null); setDeptModal(true); };
  const openEditDept = (d) => { setDeptForm({ name: d.name }); setDeptFormErrors({}); setEditingDept(d); setDeptModal(true); };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) { setDeptFormErrors({ name: 'Name is required' }); return; }
    setDeptSubmitting(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, deptForm);
        toast.success('Department updated');
      } else {
        await createDepartment(deptForm);
        toast.success('Department created');
      }
      setDeptModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save department');
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deleteDeptTarget) return;
    setDeletingDept(true);
    try {
      await deleteDepartment(deleteDeptTarget.id);
      toast.success('Department deleted');
      setDeleteDeptTarget(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    } finally {
      setDeletingDept(false);
    }
  };

  // Designation handlers
  const handleDesigSubmit = async (e) => {
    e.preventDefault();
    if (!desigForm.title.trim()) { toast.error('Title is required'); return; }
    setDesigSubmitting(true);
    try {
      await createDesignation(desigForm);
      toast.success('Designation created');
      setDesigModal(false);
      setDesigForm({ title: '', department_id: '', salary_grade: '' });
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create designation');
    } finally {
      setDesigSubmitting(false);
    }
  };

  const handleDeleteDesig = async () => {
    if (!deleteDesigTarget) return;
    setDeletingDesig(true);
    try {
      await deleteDesignation(deleteDesigTarget.id);
      toast.success('Designation deleted');
      setDeleteDesigTarget(null);
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete designation');
    } finally {
      setDeletingDesig(false);
    }
  };

  return (
    <div>
      {/* Departments section */}
      <div className="page-header">
        <div><h2>Departments</h2><p>Manage company departments and designations</p></div>
        <button className="btn btn-primary" onClick={openAddDept}><HiOutlinePlus /> Add Department</button>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        {deptLoading ? <Loading message="Loading..." /> :
          deptError ? <ErrorState message={deptError} onRetry={fetchDepartments} /> :
          departments.length === 0 ? <EmptyState title="No departments" message="Create your first department" /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Head</th>
                  <th>Employees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.head_name || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td><span className="badge badge-present">{d.employee_count}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" title="Edit" onClick={() => openEditDept(d)}><HiOutlinePencil size={18} /></button>
                        <button className="btn-icon danger" title="Delete" onClick={() => setDeleteDeptTarget(d)}><HiOutlineTrash size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Designations section */}
      <div className="page-header" style={{ marginTop: 8 }}>
        <div><h2>Designations</h2><p>Job titles and grades</p></div>
        <button className="btn btn-primary" onClick={() => { setDesigForm({ title: '', department_id: '', salary_grade: '' }); setDesigModal(true); }}>
          <HiOutlinePlus /> Add Designation
        </button>
      </div>

      <div className="card">
        {designations.length === 0 ? <EmptyState title="No designations" message="Create your first designation" /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Title</th><th>Department</th><th>Grade</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {designations.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.title}</strong></td>
                    <td>{d.department_name || '—'}</td>
                    <td>{d.salary_grade || '—'}</td>
                    <td>
                      <button className="btn-icon danger" title="Delete" onClick={() => setDeleteDesigTarget(d)}><HiOutlineTrash size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dept Modal */}
      <Modal isOpen={deptModal} onClose={() => setDeptModal(false)} title={editingDept ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleDeptSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Department Name *</label>
              <input className={`form-control ${deptFormErrors.name ? 'error' : ''}`}
                value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Engineering" />
              {deptFormErrors.name && <p className="error-text">{deptFormErrors.name}</p>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setDeptModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={deptSubmitting}>
              {deptSubmitting ? 'Saving...' : editingDept ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Desig Modal */}
      <Modal isOpen={desigModal} onClose={() => setDesigModal(false)} title="Add Designation">
        <form onSubmit={handleDesigSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Job Title *</label>
              <input className="form-control" value={desigForm.title}
                onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                placeholder="e.g. Software Engineer" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select className="form-control" value={desigForm.department_id}
                  onChange={(e) => setDesigForm({ ...desigForm, department_id: e.target.value })}>
                  <option value="">None</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Salary Grade</label>
                <input className="form-control" value={desigForm.salary_grade}
                  onChange={(e) => setDesigForm({ ...desigForm, salary_grade: e.target.value })}
                  placeholder="e.g. L3" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setDesigModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={desigSubmitting}>
              {desigSubmitting ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteDeptTarget} onClose={() => setDeleteDeptTarget(null)} onConfirm={handleDeleteDept}
        title="Delete Department?" message={`Delete "${deleteDeptTarget?.name}"? This cannot be undone.`} loading={deletingDept} />
      <ConfirmDialog isOpen={!!deleteDesigTarget} onClose={() => setDeleteDesigTarget(null)} onConfirm={handleDeleteDesig}
        title="Delete Designation?" message={`Delete "${deleteDesigTarget?.title}"?`} loading={deletingDesig} />
    </div>
  );
};

export default Departments;
