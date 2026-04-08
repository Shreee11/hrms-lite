import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineTrash, HiOutlineCheck, HiOutlineX,
  HiOutlineChevronDown, HiOutlineChevronUp,
} from 'react-icons/hi';
import {
  getLeaveRequests, getEmployees, getLeaveTypes,
  createLeaveRequest, approveLeave, rejectLeave, cancelLeave,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const MANAGER_ROLES = ['super_admin', 'hr_admin', 'hr_manager', 'team_manager'];

// ── Leave Apply Form ──────────────────────────────────────────────────────────
const ApplyTab = ({ leaveTypes, onSuccess }) => {
  const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.leave_type_id) e.leave_type_id = 'Select a leave type';
    if (!form.start_date) e.start_date = 'Start date required';
    if (!form.end_date) e.end_date = 'End date required';
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = 'End date cannot be before start date';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createLeaveRequest({ leave_type_id: form.leave_type_id, start_date: form.start_date, end_date: form.end_date, reason: form.reason });
      toast.success('Leave request submitted successfully');
      setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      setErrors({});
      onSuccess && onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    } finally { setSubmitting(false); }
  };

  const selectedType = leaveTypes.find((lt) => lt.id === form.leave_type_id);

  return (
    <div className="leave-apply-wrap">
      <div className="leave-apply-info">
        Leave is earned by an employee and granted by the employer to take time off work. The employee is free to avail this leave in accordance with the company policy.
      </div>
      <div className="leave-apply-form-wrap">
        <div className="leave-apply-form">
          <h3 style={{ margin: '0 0 20px', fontWeight: 600, color: 'var(--gray-800)' }}>Applying for Leave</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Leave type <span className="required">*</span></label>
              <select className={`form-control ${errors.leave_type_id ? 'error' : ''}`}
                value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
                <option value="">Select type</option>
                {leaveTypes.map((lt) => (<option key={lt.id} value={lt.id}>{lt.name}</option>))}
              </select>
              {errors.leave_type_id && <p className="error-text">{errors.leave_type_id}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>From date <span className="required">*</span></label>
                <input type="date" className={`form-control ${errors.start_date ? 'error' : ''}`}
                  value={form.start_date} min={today} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                {errors.start_date && <p className="error-text">{errors.start_date}</p>}
              </div>
              <div className="form-group">
                <label>To date <span className="required">*</span></label>
                <input type="date" className={`form-control ${errors.end_date ? 'error' : ''}`}
                  value={form.end_date} min={form.start_date || today} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                {errors.end_date && <p className="error-text">{errors.end_date}</p>}
              </div>
            </div>
            <div className="form-group">
              <label>Reason <span className="required">*</span></label>
              <textarea className={`form-control textarea ${errors.reason ? 'error' : ''}`} rows={4}
                placeholder="Enter a reason..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              {errors.reason && <p className="error-text">{errors.reason}</p>}
            </div>
            <div className="leave-apply-footer">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' }); setErrors({}); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
        {selectedType && (
          <div className="leave-balance-side">
            <div className="leave-balance-side-title">Leave Balance</div>
            <div className="leave-balance-side-type">{selectedType.name}</div>
            <div className="leave-balance-side-meta">{selectedType.days_per_year} days / year</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Single Leave Card (Pending / History) ─────────────────────────────────────
const LeaveCard = ({ rec, isManager, onApprove, onReject, onCancel }) => {
  const [open, setOpen] = useState(false);
  const canAct = isManager && rec.status === 'Pending';
  const canCancel = rec.status === 'Pending' || rec.status === 'Approved';
  return (
    <div className={`leave-card ${open ? 'open' : ''}`}>
      <div className="leave-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="leave-card-meta"><span className="leave-card-label">Leave Type</span><span className="leave-card-value">{rec.leave_type_name}</span></div>
        {isManager && <div className="leave-card-meta"><span className="leave-card-label">Employee</span><span className="leave-card-value">{rec.employee_name}</span></div>}
        <div className="leave-card-meta"><span className="leave-card-label">Days</span><span className="leave-card-value">{rec.total_days}</span></div>
        <span className={`leave-status-badge leave-status-${rec.status.toLowerCase()}`}>{rec.status.toUpperCase()}</span>
        <div className="leave-card-actions">
          {canAct && (
            <>
              <button className="btn-icon" title="Approve" onClick={(e) => { e.stopPropagation(); onApprove(rec.id); }}>
                <HiOutlineCheck size={18} style={{ color: 'var(--success)' }} />
              </button>
              <button className="btn-icon danger" title="Reject" onClick={(e) => { e.stopPropagation(); onReject(rec.id); }}>
                <HiOutlineX size={18} />
              </button>
            </>
          )}
          {canCancel && (
            <button className="btn-icon danger" title="Cancel" onClick={(e) => { e.stopPropagation(); onCancel(rec); }}>
              <HiOutlineTrash size={18} />
            </button>
          )}
          {open ? <HiOutlineChevronUp size={18} style={{ color: 'var(--gray-400)' }} /> : <HiOutlineChevronDown size={18} style={{ color: 'var(--gray-400)' }} />}
        </div>
      </div>
      {open && (
        <div className="leave-card-body">
          <div><span className="leave-card-label">Duration: </span>{rec.start_date} to {rec.end_date}</div>
          <div style={{ marginTop: 4 }}><span className="leave-card-label">Reason: </span>{rec.reason || '—'}</div>
          <div style={{ marginTop: 4 }}><span className="leave-card-label">Applied on: </span>
            {new Date(rec.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      )}
    </div>
  );
};

// ── Main Leave Page ───────────────────────────────────────────────────────────
const Leave = () => {
  const { user } = useAuth();
  const isManager = MANAGER_ROLES.includes(user?.role);

  const [tab, setTab] = useState('apply');
  const [records, setRecords] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const pending = records.filter((r) => r.status === 'Pending');
  const history = records.filter((r) => r.status !== 'Pending');

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [reqRes, empRes, ltRes] = await Promise.all([getLeaveRequests({}), getEmployees(), getLeaveTypes()]);
      setRecords(reqRes.data.results || reqRes.data);
      setEmployees(empRes.data.results || empRes.data);
      setLeaveTypes(ltRes.data.results || ltRes.data);
    } catch { setError('Failed to load leave data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (id) => {
    try { await approveLeave(id, {}); toast.success('Leave approved'); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };
  const handleReject = async (id) => {
    try { await rejectLeave(id, {}); toast.success('Leave rejected'); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try { await cancelLeave(cancelTarget.id); toast.success('Cancelled'); setCancelTarget(null); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setCancelling(false); }
  };

  return (
    <div>
      <div className="page-header"><div><h2>Leave Apply</h2></div></div>
      <div className="leave-tabs">
        {['apply', 'pending', 'history'].map((t) => (
          <button key={t} className={`leave-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'pending' && pending.length > 0 && <span className="leave-tab-badge">{pending.length}</span>}
          </button>
        ))}
      </div>
      {loading ? <Loading message="Loading..." /> : error ? <ErrorState message={error} onRetry={fetchAll} /> : (
        <>
          {tab === 'apply' && <ApplyTab leaveTypes={leaveTypes} employees={employees} isManager={isManager} onSuccess={fetchAll} />}
          {tab === 'pending' && (
            <div className="leave-list">
              {pending.length === 0 ? <EmptyState title="No pending requests" message="All requests have been actioned" /> :
                pending.map((rec) => <LeaveCard key={rec.id} rec={rec} isManager={isManager} onApprove={handleApprove} onReject={handleReject} onCancel={setCancelTarget} />)}
            </div>
          )}
          {tab === 'history' && (
            <div className="leave-list">
              {history.length === 0 ? <EmptyState title="No history" message="No actioned leave requests yet" /> :
                history.map((rec) => <LeaveCard key={rec.id} rec={rec} isManager={isManager} onApprove={handleApprove} onReject={handleReject} onCancel={setCancelTarget} />)}
            </div>
          )}
        </>
      )}
      <ConfirmDialog isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Cancel Leave Request?"
        message={`Cancel leave for ${cancelTarget?.employee_name} (${cancelTarget?.start_date} – ${cancelTarget?.end_date})?`}
        loading={cancelling} />
    </div>
  );
};

export default Leave;
