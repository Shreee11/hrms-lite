import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineClipboardCheck, HiOutlineClock, HiOutlineLogout } from 'react-icons/hi';
import { getDashboard, getAttendance, getMyTodayAttendance, clockIn, clockOut, getLeaveBalance, getMyPayslips } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';

const HR_ROLES = ['super_admin', 'hr_admin', 'hr_manager'];
const INR = (n) => (n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

// ── Clock-in/out widget (reused on dashboard) ─────────────────────────────────
const ClockWidget = () => {
  const [status, setStatus] = useState(null);
  const [acting, setActing] = useState(false);

  const fetch = useCallback(async () => {
    try { const r = await getMyTodayAttendance(); setStatus(r.data); } catch {}
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  const handle = async (action) => {
    setActing(true);
    try {
      if (action === 'in') { await clockIn(); toast.success('Clocked in!'); }
      else { await clockOut(); toast.success('Clocked out!'); }
      fetch();
    } catch (e) { toast.error(e.response?.data?.detail || 'Action failed'); }
    finally { setActing(false); }
  };

  if (!status) return null;
  const s = status.status;

  return (
    <div className="clock-widget" style={{ marginBottom: 24 }}>
      <div className="clock-icon"><HiOutlineClock /></div>
      <div className="clock-info">
        <div className="clock-title">Today's Attendance</div>
        {s === 'no_employee'
          ? <div className="clock-sub" style={{ color: 'var(--gray-400)' }}>No employee record linked</div>
          : s === 'not_clocked_in'
          ? <div className="clock-sub">Not clocked in yet</div>
          : <div className="clock-sub">
              In: <strong>{fmt(status.clock_in)}</strong>
              {status.clock_out && <> &nbsp;|&nbsp; Out: <strong>{fmt(status.clock_out)}</strong></>}
            </div>
        }
      </div>
      <div className="clock-actions">
        {s === 'not_clocked_in' && <button className="btn btn-primary btn-sm" onClick={() => handle('in')} disabled={acting}>Clock In</button>}
        {s === 'clocked_in' && <button className="btn btn-danger btn-sm" onClick={() => handle('out')} disabled={acting}><HiOutlineLogout /> Clock Out</button>}
        {s === 'clocked_out' && <span className="badge badge-present">Done for today ✓</span>}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const isHR = HR_ROLES.includes(user?.role);

  const [data, setData] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [latestPayslip, setLatestPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isHR) {
        const [dashRes, attRes] = await Promise.all([getDashboard(), getAttendance({})]);
        setData(dashRes.data);
        setRecentAttendance((attRes.data.results || attRes.data).slice(0, 10));
      } else {
        const [lbRes, psRes] = await Promise.all([
          getLeaveBalance().catch(() => ({ data: [] })),
          getMyPayslips().catch(() => ({ data: [] })),
        ]);
        setLeaveBalance(lbRes.data || []);
        const slips = psRes.data || [];
        setLatestPayslip(slips[0] || null);
      }
    } catch {
      setError('Failed to load dashboard. Make sure the backend server is running.');
    } finally { setLoading(false); }
  }, [isHR]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // ── Employee / Team Manager view ──
  if (!isHR) {
    return (
      <div>
        <div className="page-header">
          <div><h2>Welcome, {user?.full_name?.split(' ')[0] || 'there'}!</h2><p>Your personal overview</p></div>
        </div>
        <ClockWidget />
        <div className="stats-grid">
          {leaveBalance.map((lb) => (
            <div key={lb.leave_type} className="stat-card">
              <div className="stat-icon warning"><HiOutlineClipboardCheck /></div>
              <div className="stat-value">{lb.remaining ?? lb.balance ?? 0}</div>
              <div className="stat-label">{lb.leave_type} Days Left</div>
            </div>
          ))}
          {latestPayslip && (
            <div className="stat-card">
              <div className="stat-icon success" style={{ fontSize: 20 }}>₹</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{INR(latestPayslip.net)}</div>
              <div className="stat-label">Last Net Pay ({['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][latestPayslip.month - 1]} {latestPayslip.year})</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── HR view ──
  return (
    <div>
      <div className="page-header">
        <div><h2>Dashboard</h2><p>HR overview</p></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><HiOutlineUsers /></div>
          <div className="stat-value">{data?.total_employees || 0}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><HiOutlineOfficeBuilding /></div>
          <div className="stat-value">{data?.total_departments || 0}</div>
          <div className="stat-label">Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><HiOutlineClipboardCheck /></div>
          <div className="stat-value">{recentAttendance.length}</div>
          <div className="stat-label">Recent Records</div>
        </div>
      </div>

      {data?.department_counts?.length > 0 && (
        <div className="card">
          <div className="dept-table">
            <h3 style={{ paddingTop: 20 }}>Employees by Department</h3>
            <div className="table-container">
              <table>
                <thead><tr><th>Department</th><th>Employees</th></tr></thead>
                <tbody>
                  {data.department_counts.map((dept) => (
                    <tr key={dept.department}><td>{dept.department}</td><td>{dept.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {recentAttendance.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="dept-table">
            <h3 style={{ paddingTop: 20 }}>Recent Attendance Records</h3>
            <div className="table-container">
              <table>
                <thead><tr><th>Employee</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {recentAttendance.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.employee_name} ({rec.employee_eid})</td>
                      <td>{rec.date}</td>
                      <td><span className={`badge badge-${rec.status.toLowerCase()}`}>{rec.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

