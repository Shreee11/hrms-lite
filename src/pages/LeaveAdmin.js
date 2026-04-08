import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck,
  HiOutlineBadgeCheck, HiOutlineCash, HiOutlineArrowRight,
} from 'react-icons/hi';
import {
  getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
  getEmployees, getAllLeaveBalances, allocateLeaveBalance,
} from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = { name: '', days_per_year: 12, is_paid: true, carry_forward: false, max_carry: 0 };

// ── Leave Type Card ────────────────────────────────────────────────────────────
const TypeCard = ({ lt, onEdit, onDelete }) => (
  <div className="la-type-card">
    <div className="la-type-card-header">
      <span className="la-type-name">{lt.name}</span>
      <div className="la-type-actions">
        <button className="btn-icon" title="Edit" onClick={() => onEdit(lt)}><HiOutlinePencil /></button>
        <button className="btn-icon danger" title="Delete" onClick={() => onDelete(lt)}><HiOutlineTrash /></button>
      </div>
    </div>
    <div className="la-type-meta">
      <span className="la-meta-chip la-chip-days">
        <HiOutlineArrowRight /> {lt.days_per_year} days / year
      </span>
      <span className={`la-meta-chip ${lt.is_paid ? 'la-chip-paid' : 'la-chip-unpaid'}`}>
        <HiOutlineCash /> {lt.is_paid ? 'Paid' : 'Unpaid'}
      </span>
      {lt.carry_forward && (
        <span className="la-meta-chip la-chip-carry">
          <HiOutlineBadgeCheck /> Carry fwd {lt.max_carry > 0 ? `(max ${lt.max_carry})` : '(unlimited)'}
        </span>
      )}
    </div>
    <div className="la-type-footer">
      Added {new Date(lt.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
    </div>
  </div>
);

// ── Leave Types Tab ────────────────────────────────────────────────────────────
const LeaveTypesTab = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getLeaveTypes();
      setTypes(res.data || []);
    } catch { setError('Failed to load leave types.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (lt) => {
    setEditing(lt);
    setForm({ name: lt.name, days_per_year: lt.days_per_year, is_paid: lt.is_paid, carry_forward: lt.carry_forward, max_carry: lt.max_carry });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.days_per_year || form.days_per_year < 1) { toast.error('Days per year must be at least 1'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, days_per_year: parseInt(form.days_per_year), max_carry: parseInt(form.max_carry) || 0 };
      if (editing) {
        await updateLeaveType(editing.id, payload);
        toast.success('Leave type updated');
      } else {
        await createLeaveType(payload);
        toast.success('Leave type created');
      }
      setModalOpen(false);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save leave type');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLeaveType(deleteTarget.id);
      toast.success('Leave type deleted');
      setDeleteTarget(null);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="la-section-header">
        <div>
          <h3>Leave Types</h3>
          <p className="la-section-sub">Define leave types available to employees (e.g. Annual Leave, Sick Leave, Maternity Leave).</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Add Leave Type</button>
      </div>

      {loading ? <Loading message="Loading leave types..." /> :
       error ? <ErrorState message={error} onRetry={fetchTypes} /> :
       types.length === 0 ? (
         <EmptyState title="No leave types" description="Create leave types to allow employees to apply for leave." />
       ) : (
         <div className="la-types-grid">
           {types.map((lt) => <TypeCard key={lt.id} lt={lt} onEdit={openEdit} onDelete={setDeleteTarget} />)}
         </div>
       )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Leave Type' : 'Add Leave Type'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Leave Type Name <span className="required">*</span></label>
              <input className="form-control" placeholder="e.g. Annual Leave"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Days Per Year <span className="required">*</span></label>
                <input type="number" className="form-control" min={1} max={365}
                  value={form.days_per_year} onChange={(e) => setForm({ ...form, days_per_year: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Max Carry Forward Days</label>
                <input type="number" className="form-control" min={0}
                  value={form.max_carry} onChange={(e) => setForm({ ...form, max_carry: e.target.value })}
                  disabled={!form.carry_forward} placeholder="0 = unlimited" />
              </div>
            </div>
            <div className="la-toggle-row">
              <label className="la-toggle-label">
                <input type="checkbox" checked={form.is_paid}
                  onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} />
                <span className="la-toggle-text">Paid Leave</span>
              </label>
              <label className="la-toggle-label">
                <input type="checkbox" checked={form.carry_forward}
                  onChange={(e) => setForm({ ...form, carry_forward: e.target.checked, max_carry: e.target.checked ? form.max_carry : 0 })} />
                <span className="la-toggle-text">Allow Carry Forward</span>
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Leave Type?"
        message={`Delete "${deleteTarget?.name}"? Existing requests using this type will not be affected.`}
        loading={deleting} />
    </div>
  );
};

// ── Leave Allocation Tab ───────────────────────────────────────────────────────
const AllocationTab = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [allBalances, setAllBalances] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [allocForm, setAllocForm] = useState({});   // { [lt_id]: { allocated, carried_over } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [empRes, ltRes, balRes] = await Promise.all([
        getEmployees(), getLeaveTypes(), getAllLeaveBalances(year),
      ]);
      setEmployees(empRes.data.results || empRes.data);
      setLeaveTypes(ltRes.data || []);
      setAllBalances(balRes.data || []);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When employee or balances change, populate the form
  useEffect(() => {
    if (!selectedEmp || leaveTypes.length === 0) return;
    const empBalances = allBalances.filter((b) => b.employee_id === selectedEmp);
    const newForm = {};
    leaveTypes.forEach((lt) => {
      const existing = empBalances.find((b) => b.leave_type_id === lt.id);
      newForm[lt.id] = {
        allocated: existing ? existing.allocated : lt.days_per_year,
        carried_over: existing ? existing.carried_over : 0,
      };
    });
    setAllocForm(newForm);
  }, [selectedEmp, allBalances, leaveTypes]);

  const handleBulkInit = () => {
    const newForm = {};
    leaveTypes.forEach((lt) => {
      newForm[lt.id] = { allocated: lt.days_per_year, carried_over: 0 };
    });
    setAllocForm(newForm);
    toast.info('Filled with default values from leave type settings');
  };

  const handleSave = async () => {
    if (!selectedEmp) { toast.error('Select an employee first'); return; }
    setSaving(true);
    try {
      const allocations = leaveTypes.map((lt) => ({
        leave_type_id: lt.id,
        allocated: parseInt(allocForm[lt.id]?.allocated) || 0,
        carried_over: parseInt(allocForm[lt.id]?.carried_over) || 0,
      }));
      await allocateLeaveBalance({ employee_id: selectedEmp, year, allocations });
      toast.success('Leave balance saved successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save allocation');
    } finally { setSaving(false); }
  };

  const selectedEmpObj = employees.find((e) => e.id === selectedEmp);
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div>
      <div className="la-section-header">
        <div>
          <h3>Leave Balance Allocation</h3>
          <p className="la-section-sub">Allocate annual leave days to each employee. Select an employee and set their leave balance per type.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-control" value={year} style={{ width: 100 }}
            onChange={(e) => { setYear(Number(e.target.value)); setSelectedEmp(''); }}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Loading message="Loading..." /> : error ? <ErrorState message={error} onRetry={fetchData} /> : (
        <div className="la-alloc-wrap">
          {/* Employee selector */}
          <div className="la-alloc-sidebar">
            <div className="la-alloc-sidebar-title">Employees</div>
            <div className="la-emp-list">
              {employees.map((emp) => {
                const hasAlloc = allBalances.some((b) => b.employee_id === emp.id);
                return (
                  <button key={emp.id}
                    className={`la-emp-item ${selectedEmp === emp.id ? 'active' : ''}`}
                    onClick={() => setSelectedEmp(emp.id)}>
                    <div className="la-emp-name">{emp.full_name}</div>
                    <div className="la-emp-meta">{emp.employee_id}</div>
                    {hasAlloc && <span className="la-emp-badge"><HiOutlineCheck /></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allocation form */}
          <div className="la-alloc-form">
            {!selectedEmp ? (
              <EmptyState title="Select an employee" description="Choose an employee from the list to set their leave allocations." />
            ) : (
              <>
                <div className="la-alloc-form-header">
                  <div>
                    <div className="la-alloc-emp-name">{selectedEmpObj?.full_name}</div>
                    <div className="la-alloc-emp-meta">{selectedEmpObj?.employee_id} — {year}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleBulkInit}>
                    Fill Defaults
                  </button>
                </div>
                <div className="la-alloc-table-wrap">
                  <table className="la-alloc-table">
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Type Default</th>
                        <th>Allocated Days</th>
                        <th>Carry Forward</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveTypes.map((lt) => {
                        const row = allocForm[lt.id] || { allocated: lt.days_per_year, carried_over: 0 };
                        const total = (parseInt(row.allocated) || 0) + (parseInt(row.carried_over) || 0);
                        return (
                          <tr key={lt.id}>
                            <td>
                              <div className="la-alloc-lt-name">{lt.name}</div>
                              <span className={`la-meta-chip ${lt.is_paid ? 'la-chip-paid' : 'la-chip-unpaid'}`} style={{ fontSize: 11 }}>
                                {lt.is_paid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="la-alloc-default">{lt.days_per_year} days</td>
                            <td>
                              <input type="number" className="form-control la-alloc-input" min={0}
                                value={row.allocated}
                                onChange={(e) => setAllocForm({
                                  ...allocForm,
                                  [lt.id]: { ...row, allocated: e.target.value },
                                })} />
                            </td>
                            <td>
                              <input type="number" className="form-control la-alloc-input" min={0}
                                value={row.carried_over}
                                disabled={!lt.carry_forward}
                                onChange={(e) => setAllocForm({
                                  ...allocForm,
                                  [lt.id]: { ...row, carried_over: e.target.value },
                                })} />
                            </td>
                            <td className="la-alloc-total">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="la-alloc-footer">
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Allocation'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main LeaveAdmin Page ───────────────────────────────────────────────────────
const LeaveAdmin = () => {
  const [tab, setTab] = useState('types');

  return (
    <div>
      <div className="page-header">
        <div><h2>Leave Administration</h2><p>Manage leave types, allocations and policies</p></div>
      </div>
      <div className="leave-tabs">
        {[
          { key: 'types',      label: 'Leave Types' },
          { key: 'allocation', label: 'Balance Allocation' },
        ].map(({ key, label }) => (
          <button key={key} className={`leave-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'types'      && <LeaveTypesTab />}
      {tab === 'allocation' && <AllocationTab />}
    </div>
  );
};

export default LeaveAdmin;
