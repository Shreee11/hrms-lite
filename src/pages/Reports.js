import React, { useState, useEffect, useCallback } from 'react';
import {
  getHeadcountReport, getAttendanceReport,
  getLeaveReport, getPayrollReport
} from '../services/api';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Reports = () => {
  const [tab, setTab] = useState('headcount');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let res;
      if (tab === 'headcount') res = await getHeadcountReport();
      else if (tab === 'attendance') res = await getAttendanceReport({ date_from: dateFrom, date_to: dateTo });
      else if (tab === 'leave') res = await getLeaveReport({ year });
      else if (tab === 'payroll') res = await getPayrollReport({ year });
      setData(res.data);
    } catch {
      setError('Failed to load report. You may not have permission to view this report.');
    } finally {
      setLoading(false);
    }
  }, [tab, year, dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div>
      <div className="page-header">
        <div><h2>Reports & Analytics</h2><p>Data-driven HR insights</p></div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['headcount', 'attendance', 'leave', 'payroll'].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {(tab === 'leave' || tab === 'payroll') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 14, color: 'var(--gray-600)' }}>Year:</label>
            <input type="number" className="form-control" value={year} min={2020} max={2030}
              style={{ width: 100 }} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        )}
        {tab === 'attendance' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14 }}>From:</label>
              <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14 }}>To:</label>
              <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {loading ? <Loading message="Generating report..." /> :
        error ? <ErrorState message={error} onRetry={fetchReport} /> : !data ? null : (
        <>
          {/* ── Headcount ── */}
          {tab === 'headcount' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon primary">👥</div><div className="stat-value">{data.total_active}</div><div className="stat-label">Active Employees</div></div>
                <div className="stat-card"><div className="stat-icon warning">⏸</div><div className="stat-value">{data.total_inactive}</div><div className="stat-label">Inactive</div></div>
                <div className="stat-card"><div className="stat-icon danger">🚪</div><div className="stat-value">{data.total_terminated}</div><div className="stat-label">Terminated</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card">
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}><strong>By Department</strong></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Department</th><th>Count</th></tr></thead>
                      <tbody>
                        {(data.by_department || []).map((d) => (
                          <tr key={d.department}><td>{d.department}</td><td><span className="badge badge-present">{d.count}</span></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}><strong>By Employment Type</strong></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Type</th><th>Count</th></tr></thead>
                      <tbody>
                        {(data.by_employment_type || []).map((d) => (
                          <tr key={d.type}><td>{d.type}</td><td><span className="badge badge-present">{d.count}</span></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Attendance ── */}
          {tab === 'attendance' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon primary">📋</div><div className="stat-value">{data.total_records}</div><div className="stat-label">Total Records</div></div>
                <div className="stat-card"><div className="stat-icon success">✅</div><div className="stat-value">{data.present}</div><div className="stat-label">Present</div></div>
                <div className="stat-card"><div className="stat-icon danger">❌</div><div className="stat-value">{data.absent}</div><div className="stat-label">Absent</div></div>
                <div className="stat-card"><div className="stat-icon warning">🏠</div><div className="stat-value">{data.wfh}</div><div className="stat-label">WFH</div></div>
                <div className="stat-card"><div className="stat-icon primary">📊</div><div className="stat-value">{data.present_percentage}%</div><div className="stat-label">Attendance Rate</div></div>
              </div>
            </>
          )}

          {/* ── Leave ── */}
          {tab === 'leave' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon primary">📝</div><div className="stat-value">{data.total_requests}</div><div className="stat-label">Total Requests</div></div>
                <div className="stat-card"><div className="stat-icon success">✅</div><div className="stat-value">{data.approved}</div><div className="stat-label">Approved</div></div>
                <div className="stat-card"><div className="stat-icon danger">❌</div><div className="stat-value">{data.rejected}</div><div className="stat-label">Rejected</div></div>
                <div className="stat-card"><div className="stat-icon warning">⏳</div><div className="stat-value">{data.pending}</div><div className="stat-label">Pending</div></div>
              </div>
              <div className="card">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}><strong>Leave Usage by Type</strong></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Leave Type</th><th>Requests</th><th>Total Days</th></tr></thead>
                    <tbody>
                      {(data.by_leave_type || []).map((t) => (
                        <tr key={t.leave_type}><td>{t.leave_type}</td><td>{t.count}</td><td>{t.total_days}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Payroll ── */}
          {tab === 'payroll' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon success">💰</div>
                  <div className="stat-value">
                    {(data.total_cost_ytd || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                  </div>
                  <div className="stat-label">Total Cost YTD ({year})</div>
                </div>
              </div>
              <div className="card">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}><strong>Monthly Breakdown</strong></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Month</th><th>Year</th><th>Total Cost</th><th>Status</th></tr></thead>
                    <tbody>
                      {(data.monthly_breakdown || []).map((r, i) => (
                        <tr key={i}>
                          <td>{MONTHS[r.month - 1]}</td>
                          <td>{r.year}</td>
                          <td>{r.total_cost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</td>
                          <td><span className={`badge badge-${r.status === 'Approved' || r.status === 'Paid' ? 'present' : 'warning'}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
