import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi';
import {
  getEmployees, getOnboardingList, startOnboarding,
  updateOnboardingStep, deleteOnboarding
} from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Onboarding = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [startModal, setStartModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [starting, setStarting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // { employeeId, step }
  const [noteText, setNoteText] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [onbRes, empRes] = await Promise.all([getOnboardingList(), getEmployees()]);
      setRecords(onbRes.data || []);
      const onboardedIds = new Set((onbRes.data || []).map((r) => r.employee_id));
      setEmployees((empRes.data || []).filter((e) => !onboardedIds.has(e.id)));
    } catch {
      setError('Failed to load onboarding data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStart = async () => {
    if (!selectedEmp) return toast.error('Select an employee');
    setStarting(true);
    try {
      await startOnboarding(selectedEmp);
      toast.success('Onboarding started');
      setStartModal(false);
      setSelectedEmp('');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to start onboarding');
    } finally { setStarting(false); }
  };

  const handleStepToggle = async (employeeId, stepKey, currentCompleted) => {
    try {
      await updateOnboardingStep(employeeId, stepKey, { completed: !currentCompleted, notes: null });
      setRecords((prev) => prev.map((r) => {
        if (r.employee_id !== employeeId) return r;
        const steps = r.steps.map((s) =>
          s.key === stepKey ? { ...s, completed: !currentCompleted } : s
        );
        const done = steps.filter((s) => s.completed).length;
        return { ...r, steps, progress: Math.round((done / steps.length) * 100) };
      }));
    } catch (e) {
      toast.error('Failed to update step');
    }
  };

  const handleNotesSave = async () => {
    const { employeeId, stepKey, completed } = noteModal;
    try {
      await updateOnboardingStep(employeeId, stepKey, { completed, notes: noteText });
      toast.success('Notes saved');
      setNoteModal(null);
      setNoteText('');
      fetchAll();
    } catch { toast.error('Failed to save notes'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOnboarding(deleteTarget);
      toast.success('Onboarding record removed');
      setDeleteTarget(null);
      fetchAll();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  if (loading) return <Loading message="Loading onboarding..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAll} />;

  return (
    <div>
      <div className="page-header">
        <div><h2>Employee Onboarding</h2><p>Track new hire onboarding progress</p></div>
        <button className="btn btn-primary" onClick={() => setStartModal(true)}>
          <HiOutlinePlus /> Start Onboarding
        </button>
      </div>

      {records.length === 0 ? (
        <EmptyState title="No onboarding records" description="Start onboarding for a new employee." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {records.map((rec) => (
            <div key={rec.id} className="card">
              <div
                className="onboarding-header"
                onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
              >
                <div className="onboarding-emp-info">
                  <div className="profile-avatar-sm">{rec.employee_name[0] || '?'}</div>
                  <div>
                    <div className="onboarding-emp-name">{rec.employee_name}</div>
                    <div className="onboarding-emp-meta">{rec.employee_eid} · {rec.department}</div>
                  </div>
                </div>
                <div className="onboarding-progress-area">
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${rec.progress}%` }} />
                  </div>
                  <span className="progress-pct">{rec.progress}%</span>
                  <span className={`badge ${rec.progress === 100 ? 'badge-present' : 'badge-warning'}`}>
                    {rec.progress === 100 ? 'Complete' : 'In Progress'}
                  </span>
                </div>
                <button
                  className="btn-icon danger"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(rec.employee_id); }}
                >
                  <HiOutlineTrash />
                </button>
              </div>

              {expanded === rec.id && (
                <div className="onboarding-steps">
                  {rec.steps.map((step) => (
                    <div key={step.key} className={`onboarding-step ${step.completed ? 'step-done' : ''}`}>
                      <button
                        className={`step-check-btn ${step.completed ? 'checked' : ''}`}
                        onClick={() => handleStepToggle(rec.employee_id, step.key, step.completed)}
                      >
                        {step.completed ? <HiOutlineCheck /> : <span />}
                      </button>
                      <div className="step-info">
                        <span className="step-label">{step.label}</span>
                        {step.notes && <span className="step-notes">{step.notes}</span>}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setNoteModal({ employeeId: rec.employee_id, stepKey: step.key, completed: step.completed }); setNoteText(step.notes || ''); }}
                      >
                        Notes
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Start Onboarding Modal */}
      <Modal isOpen={startModal} onClose={() => setStartModal(false)} title="Start Onboarding">
        <div className="form-group">
          <label>Select Employee</label>
          <select className="form-control" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
            <option value="">-- Select employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
            ))}
          </select>
          {employees.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 8 }}>
              All employees already have onboarding records.
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setStartModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStart} disabled={starting || !selectedEmp}>
            {starting ? 'Starting...' : 'Start Onboarding'}
          </button>
        </div>
      </Modal>

      {/* Notes Modal */}
      {noteModal && (
        <Modal isOpen={true} onClose={() => setNoteModal(null)} title="Add Notes">
          <div className="form-group">
            <label>Notes for this step</label>
            <textarea className="form-control" rows={4} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Enter any notes or remarks..." />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setNoteModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleNotesSave}>Save Notes</button>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm">
        <ConfirmDialog
          message="Remove this onboarding record? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </Modal>
    </div>
  );
};

export default Onboarding;
