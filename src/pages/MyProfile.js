import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineClock, HiOutlineLogout, HiOutlineCalendar,
  HiOutlineDocumentText, HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import {
  clockIn, clockOut, getMyTodayAttendance, getMyAttendanceHistory,
  getMyPayslips
} from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
// MONTH_SHORT removed — using inline array where needed

// ── Attendance Calendar ───────────────────────────────────────────────────────
const AttendanceCalendar = ({ records, month, year, selectedDate, onDayClick }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = new Date().toISOString().slice(0, 10);

  const recordMap = {};
  records.forEach((r) => { recordMap[r.date] = r; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const statusClass = { Present: 'cal-present', Absent: 'cal-absent', WFH: 'cal-wfh', Leave: 'cal-leave' };

  return (
    <div className="cal-wrap">
      <div className="cal-grid-header">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="cal-hdr">{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell cal-empty" />;
          const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const rec = recordMap[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <div
              key={i}
              className={`cal-cell ${rec ? statusClass[rec.status] || '' : ''} ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}`}
              onClick={() => onDayClick && onDayClick(dateStr, rec || null)}
              style={{ cursor: 'pointer' }}
            >
              <span className="cal-day-num">{d}</span>
              {rec && <span className="cal-dot" />}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="legend-item"><span className="legend-dot l-present" />Present</span>
        <span className="legend-item"><span className="legend-dot l-absent" />Absent</span>
        <span className="legend-item"><span className="legend-dot l-wfh" />WFH</span>
        <span className="legend-item"><span className="legend-dot l-leave" />Leave</span>
      </div>
    </div>
  );
};

// ── Clock In/Out Widget ───────────────────────────────────────────────────────
const ClockWidget = ({ onClockChange }) => {
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const res = await getMyTodayAttendance();
      setTodayStatus(res.data);
    } catch { /* no employee record is fine */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  const handleClock = async (action) => {
    setActing(true);
    try {
      if (action === 'in') { await clockIn(); toast.success('Clocked in!'); }
      else { await clockOut(); toast.success('Clocked out!'); }
      await fetchToday();
      onClockChange && onClockChange();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed');
    } finally { setActing(false); }
  };

  if (loading) return <div className="clock-widget"><div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} /></div>;

  const status = todayStatus?.status;

  return (
    <div className="clock-widget">
      <div className="clock-icon"><HiOutlineClock /></div>
      <div className="clock-info">
        <div className="clock-title">Today's Attendance</div>
        {status === 'no_employee' ? (
          <div className="clock-sub" style={{ color: 'var(--gray-400)' }}>No employee record linked to your account</div>
        ) : status === 'not_clocked_in' ? (
          <div className="clock-sub">Not clocked in yet</div>
        ) : (
          <div className="clock-sub">
            In: <strong>{fmt(todayStatus.clock_in)}</strong>
            {todayStatus.clock_out && <> &nbsp;|&nbsp; Out: <strong>{fmt(todayStatus.clock_out)}</strong></>}
          </div>
        )}
      </div>
      <div className="clock-actions">
        {(status === 'not_clocked_in') && (
          <button className="btn btn-primary btn-sm" onClick={() => handleClock('in')} disabled={acting}>
            Clock In
          </button>
        )}
        {(status === 'clocked_in') && (
          <button className="btn btn-danger btn-sm" onClick={() => handleClock('out')} disabled={acting}>
            <HiOutlineLogout /> Clock Out
          </button>
        )}
        {status === 'clocked_out' && (
          <span className="badge badge-present">Done for today</span>
        )}
      </div>
    </div>
  );
};

// ── My Payslips ───────────────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MyPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyPayslips()
      .then((r) => setPayslips(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading message="Loading payslips..." />;
  if (payslips.length === 0) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)' }}>No payslips available yet.</div>
  );

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Period</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Days Present</th><th></th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((ps) => (
            <React.Fragment key={ps.id}>
              <tr>
                <td><strong>{MONTH_NAMES[ps.month - 1]} {ps.year}</strong></td>
                <td>{fmt(ps.gross)}</td>
                <td>{fmt((ps.pf || 0) + (ps.esi || 0) + (ps.professional_tax || 0) + (ps.tds || 0) + (ps.other_deductions || 0))}</td>
                <td><strong style={{ color: 'var(--success)' }}>{fmt(ps.net)}</strong></td>
                <td>{ps.days_present} / {ps.days_present + ps.days_absent}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(expanded === ps.id ? null : ps.id)}>
                    {expanded === ps.id ? 'Hide' : 'View'}
                  </button>
                </td>
              </tr>
              {expanded === ps.id && (
                <tr>
                  <td colSpan={6}>
                    <div className="payslip-detail">
                      <div className="payslip-section">
                        <div className="payslip-section-title">Earnings</div>
                        <div className="payslip-row"><span>Basic Salary</span><span>{fmt(ps.basic)}</span></div>
                        <div className="payslip-row"><span>HRA</span><span>{fmt(ps.hra)}</span></div>
                        {(ps.da > 0) && <div className="payslip-row"><span>DA</span><span>{fmt(ps.da)}</span></div>}
                        {(ps.ta > 0) && <div className="payslip-row"><span>TA</span><span>{fmt(ps.ta)}</span></div>}
                        {(ps.special_allowance > 0) && <div className="payslip-row"><span>Special Allowance</span><span>{fmt(ps.special_allowance)}</span></div>}
                        {(ps.medical_allowance > 0) && <div className="payslip-row"><span>Medical Allowance</span><span>{fmt(ps.medical_allowance)}</span></div>}
                        {(ps.other_allowances > 0) && <div className="payslip-row"><span>Other Allowances</span><span>{fmt(ps.other_allowances)}</span></div>}
                        <div className="payslip-row payslip-total"><span>Gross</span><span>{fmt(ps.gross)}</span></div>
                      </div>
                      <div className="payslip-section">
                        <div className="payslip-section-title">Deductions</div>
                        <div className="payslip-row"><span>PF</span><span>− {fmt(ps.pf)}</span></div>
                        {(ps.esi > 0) && <div className="payslip-row"><span>ESI</span><span>− {fmt(ps.esi)}</span></div>}
                        {(ps.professional_tax > 0) && <div className="payslip-row"><span>Professional Tax</span><span>− {fmt(ps.professional_tax)}</span></div>}
                        {(ps.tds > 0) && <div className="payslip-row"><span>TDS</span><span>− {fmt(ps.tds)}</span></div>}
                        {(ps.other_deductions > 0) && <div className="payslip-row"><span>Other Deductions</span><span>− {fmt(ps.other_deductions)}</span></div>}
                      </div>
                      <div className="payslip-net">
                        <span>Net Pay</span><span>{fmt(ps.net)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Day Detail Panel ─────────────────────────────────────────────────────────
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const DayDetailPanel = ({ dateStr, record }) => {
  if (!dateStr) {
    return (
      <div className="day-detail-empty">
        <HiOutlineCalendar size={32} />
        <p>Select a day to view details</p>
      </div>
    );
  }

  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[d.getDay()];
  const formatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const calcWorkHrs = (ci, co) => {
    if (!ci || !co) return '—';
    const mins = Math.floor((new Date(co) - new Date(ci)) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const statusColors = { Present: '#22c55e', Absent: '#ef4444', WFH: '#3b82f6', Leave: '#f59e0b' };
  const statusColor = record ? (statusColors[record.status] || 'var(--gray-500)') : 'var(--gray-400)';

  return (
    <div className="day-detail-panel">
      <div className="day-detail-header">
        <div>
          <div className="day-detail-day">{dayName}</div>
          <div className="day-detail-date">{formatted}</div>
        </div>
        {record && (
          <span className="day-detail-badge" style={{ background: statusColor + '1a', color: statusColor, border: `1px solid ${statusColor}33` }}>
            {record.status}
          </span>
        )}
      </div>

      {!record ? (
        <div className="day-detail-norecord">No attendance record for this day</div>
      ) : (
        <>
          <div className="day-detail-section-title">Time Details</div>
          <div className="day-detail-table">
            <div className="day-detail-row">
              <span className="day-detail-label">First In (Clock In)</span>
              <span className="day-detail-value">{fmtTime(record.clock_in)}</span>
            </div>
            <div className="day-detail-row">
              <span className="day-detail-label">Last Out (Clock Out)</span>
              <span className="day-detail-value">{fmtTime(record.clock_out)}</span>
            </div>
            <div className="day-detail-row">
              <span className="day-detail-label">Total Work Hours</span>
              <span className="day-detail-value">{calcWorkHrs(record.clock_in, record.clock_out)}</span>
            </div>
          </div>
          <div className="day-detail-section-title" style={{ marginTop: 16 }}>Status Details</div>
          <div className="day-detail-table">
            <div className="day-detail-row">
              <span className="day-detail-label">Attendance Status</span>
              <span className="day-detail-value" style={{ color: statusColor, fontWeight: 600 }}>{record.status}</span>
            </div>
            <div className="day-detail-row">
              <span className="day-detail-label">Record ID</span>
              <span className="day-detail-value" style={{ fontSize: 11, color: 'var(--gray-400)' }}>{record.id?.slice(-8)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main MyProfile Component ──────────────────────────────────────────────────
const MyProfile = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('attendance');
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [attRecords, setAttRecords] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [clockKey, setClockKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const ROLE_LABELS = {
    super_admin: 'Super Admin', hr_admin: 'HR Admin', hr_manager: 'HR Manager',
    team_manager: 'Team Manager', employee: 'Employee',
  };

  const fetchAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const res = await getMyAttendanceHistory(calMonth, calYear);
      setAttRecords(res.data || []);
    } catch { setAttRecords([]); }
    finally { setAttLoading(false); }
  }, [calMonth, calYear]);

  useEffect(() => { if (tab === 'attendance') fetchAttendance(); }, [tab, fetchAttendance]);

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const presentDays = attRecords.filter((r) => r.status === 'Present').length;
  const absentDays = attRecords.filter((r) => r.status === 'Absent').length;

  return (
    <div>
      <div className="page-header">
        <div><h2>My Profile</h2><p>Your personal workspace</p></div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="profile-avatar">
            {(user?.full_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>{user?.full_name || user?.email}</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>{ROLE_LABELS[user?.role] || user?.role}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Clock in/out */}
      <ClockWidget key={clockKey} onClockChange={() => { setClockKey((k) => k + 1); fetchAttendance(); }} />

      {/* Tabs */}
      <div className="tab-bar" style={{ marginTop: 24 }}>
        <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>
          <HiOutlineCalendar style={{ marginRight: 6 }} />Attendance Calendar
        </button>
        <button className={`tab-btn ${tab === 'payslips' ? 'active' : ''}`} onClick={() => setTab('payslips')}>
          <HiOutlineDocumentText style={{ marginRight: 6 }} />My Payslips
        </button>
      </div>

      {/* Attendance Calendar Tab */}
      {tab === 'attendance' && (
        <div className="card">
          <div className="card-body">
            <div className="cal-nav">
              <button className="btn-icon" onClick={prevMonth}><HiOutlineChevronLeft /></button>
              <span className="cal-month-label">{MONTHS[calMonth - 1]} {calYear}</span>
              <button className="btn-icon" onClick={nextMonth}><HiOutlineChevronRight /></button>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-value" style={{ fontSize: 22, color: 'var(--success)' }}>{presentDays}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-value" style={{ fontSize: 22, color: 'var(--danger)' }}>{absentDays}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-value" style={{ fontSize: 22, color: 'var(--primary)' }}>{attRecords.length}</div>
                <div className="stat-label">Total Marked</div>
              </div>
            </div>
            {attLoading ? <Loading message="Loading calendar..." /> : (
              <div className="att-split-wrap">
                <div className="att-split-left">
                  <AttendanceCalendar
                    records={attRecords}
                    month={calMonth}
                    year={calYear}
                    selectedDate={selectedDate}
                    onDayClick={(ds, rec) => { setSelectedDate(ds); setSelectedRecord(rec); }}
                  />
                </div>
                <div className="att-split-right">
                  <DayDetailPanel dateStr={selectedDate} record={selectedRecord} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payslips Tab */}
      {tab === 'payslips' && (
        <div className="card">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)', fontWeight: 600 }}>My Payslips</div>
          <MyPayslips />
        </div>
      )}
    </div>
  );
};

export default MyProfile;
