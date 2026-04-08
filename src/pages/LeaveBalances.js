import React, { useState, useEffect, useCallback } from 'react';
import { getMyLeaveBalance } from '../services/api';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const LeaveBalances = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getMyLeaveBalance(year);
      setBalances(res.data || []);
    } catch { setError('Failed to load leave balances.'); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div>
      <div className="page-header">
        <div><h2>Leave Balances</h2></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-control" value={year} onChange={(e) => setYear(Number(e.target.value))}
            style={{ width: 100 }}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Loading message="Loading balances..." /> :
       error ? <ErrorState message={error} onRetry={fetchData} /> :
       balances.length === 0 ? <EmptyState title="No leave balances found" message="Contact HR to set up your leave allocations." /> : (
        <div className="lb-grid">
          {balances.map((lb) => {
            const total = lb.allocated + lb.carried_over;
            const pct = total > 0 ? Math.min(100, Math.round((lb.used / total) * 100)) : 0;
            return (
              <div key={lb.leave_type_id} className="lb-card">
                <div className="lb-card-header">
                  <span className="lb-card-title">{lb.leave_type_name}</span>
                  <span className="lb-card-granted">Granted: {total}</span>
                </div>
                <div className="lb-card-balance">{lb.remaining}</div>
                <div className="lb-card-balance-label">Balance</div>
                <div className="lb-progress-wrap">
                  <div className="lb-progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="lb-consumed-label">{lb.used} of {total} Consumed</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveBalances;
