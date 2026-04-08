import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getHolidays, createHoliday, deleteHoliday } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const HR_ROLES = ['super_admin', 'hr_admin', 'hr_manager'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const HolidayCalendar = () => {
  const { user } = useAuth();
  const isHR = HR_ROLES.includes(user?.role);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', holiday_type: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHolidays(year);
      setHolidays(res.data || []);
    } catch { setHolidays([]); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) { toast.error('Name and date are required'); return; }
    setSubmitting(true);
    try {
      await createHoliday({ name: form.name, date: form.date, year: new Date(form.date).getFullYear(), holiday_type: form.holiday_type });
      toast.success('Holiday added');
      setModalOpen(false);
      setForm({ name: '', date: '', holiday_type: 'general' });
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to add holiday'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteHoliday(deleteTarget.id);
      toast.success('Holiday deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  // Group by month
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return holidays.filter((h) => {
      const d = new Date(h.date);
      return d.getMonth() + 1 === m && d.getFullYear() === year;
    });
  });

  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return DAYS_SHORT[d.getDay()];
  };

  const getDay = (dateStr) => new Date(dateStr).getDate();

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div>
      <div className="page-header">
        <div><h2>Holiday Calendar</h2></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-control" value={year} onChange={(e) => setYear(Number(e.target.value))}
            style={{ width: 100 }}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {isHR && (
            <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              <HiOutlinePlus /> Add Holiday
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading holidays...</div>
      ) : (
        <div className="hc-grid">
          {byMonth.map((monthHols, idx) => (
            <div key={idx} className="hc-month-card">
              <div className="hc-month-title">{MONTHS[idx]} {year}</div>
              {monthHols.length === 0 ? (
                <div className="hc-no-holidays">No Holidays</div>
              ) : (
                monthHols.map((h) => (
                  <div key={h.id} className="hc-holiday-row">
                    <div className="hc-holiday-date">
                      <span className="hc-day-num">{String(getDay(h.date)).padStart(2, '0')}</span>
                      <span className="hc-day-name">{getDayName(h.date)}</span>
                    </div>
                    <span className="hc-holiday-name">{h.name}</span>
                    <div className="hc-holiday-actions">
                      {h.holiday_type === 'restricted' && (
                        <span className="hc-restricted-badge">Restricted</span>
                      )}
                      {isHR && (
                        <button className="btn-icon danger" onClick={() => setDeleteTarget(h)} title="Delete">
                          <HiOutlineTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Holiday">
        <form onSubmit={handleAdd}>
          <div className="modal-body">
            <div className="form-group">
              <label>Holiday Name *</label>
              <input className="form-control" placeholder="e.g. Independence Day"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" className="form-control" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={form.holiday_type}
                onChange={(e) => setForm({ ...form, holiday_type: e.target.value })}>
                <option value="general">General Holiday</option>
                <option value="restricted">Restricted Holiday</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Holiday'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Holiday?" message={`Remove "${deleteTarget?.name}" from the calendar?`} loading={deleting} />
    </div>
  );
};

export default HolidayCalendar;
