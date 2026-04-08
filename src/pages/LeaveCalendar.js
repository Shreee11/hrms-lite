import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { getLeaveCalendar } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/Loading';

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MANAGER_ROLES = ['super_admin', 'hr_admin', 'hr_manager', 'team_manager'];

const LeaveCalendar = () => {
  const { user } = useAuth();
  const isManager = MANAGER_ROLES.includes(user?.role);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [filterType, setFilterType] = useState('me');
  const [leaves, setLeaves] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeaveCalendar(month, year, filterType);
      setLeaves(res.data || []);
    } catch { setLeaves([]); }
    finally { setLoading(false); }
  }, [month, year, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  // Build calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Map day → leaves
  const dayLeaveMap = {};
  leaves.forEach((lv) => {
    const start = new Date(lv.start_date);
    const end = new Date(lv.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() + 1 === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!dayLeaveMap[day]) dayLeaveMap[day] = [];
        dayLeaveMap[day].push(lv);
      }
    }
  });

  const todayDay = today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : null;

  // Panel: leaves for selected day
  const selectedLeaves = selectedDay ? (dayLeaveMap[selectedDay] || []) : [];

  // Summary for panel header
  const uniqueEmpDays = {};
  leaves.forEach((lv) => { uniqueEmpDays[lv.employee_eid] = true; });
  const teamCount = Object.keys(uniqueEmpDays).length;

  return (
    <div>
      <div className="page-header"><div><h2>Leave Calendar</h2></div></div>

      <div className="lc-wrap">
        {/* Left: Calendar */}
        <div className="lc-left">
          <div className="lc-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--gray-500)' }}>Filter Type</label>
              <select className="form-control" value={filterType}
                onChange={(e) => setFilterType(e.target.value)} style={{ width: 120 }}>
                <option value="me">Me</option>
                {isManager && <option value="team">Team</option>}
              </select>
            </div>
          </div>

          {loading ? <Loading message="Loading..." /> : (
            <>
              <div className="lc-nav">
                <button className="btn-icon" onClick={prevMonth}><HiOutlineChevronLeft /></button>
                <h3 className="lc-month-title">{MONTHS[month - 1]} {year}</h3>
                <button className="btn-icon" onClick={nextMonth}><HiOutlineChevronRight /></button>
              </div>

              <div className="lc-grid-header">
                {DAYS.map((d) => <div key={d} className="lc-hdr">{d}</div>)}
              </div>
              <div className="lc-grid">
                {cells.map((d, i) => {
                  if (!d) return <div key={i} className="lc-cell lc-empty" />;
                  const isToday = d === todayDay;
                  const hasLeave = !!dayLeaveMap[d];
                  const isSelected = d === selectedDay;
                  const isPast = new Date(year, month - 1, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  return (
                    <div key={i}
                      className={`lc-cell ${isToday ? 'lc-today' : ''} ${hasLeave ? 'lc-has-leave' : ''} ${isSelected ? 'lc-selected' : ''} ${isPast ? 'lc-past' : ''}`}
                      onClick={() => setSelectedDay(isSelected ? null : d)}>
                      <span className="lc-day-num">{d}</span>
                      {hasLeave && (
                        <span className="lc-leave-count">{dayLeaveMap[d].length}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="lc-legend">
                <span className="lc-legend-item"><span className="lc-legend-dot lc-dot-leave" />Team on Leave <strong>{teamCount}</strong></span>
              </div>
            </>
          )}
        </div>

        {/* Right: Transactions Panel */}
        <div className="lc-right">
          <div className="lc-panel-header">
            Leave Transactions ({selectedLeaves.length})
          </div>
          <div className="lc-panel-cols">
            <span>Employee</span><span>Days</span><span>From–To</span>
          </div>
          {selectedLeaves.length === 0 ? (
            <div className="lc-empty-panel">
              <div className="lc-empty-icon">📅</div>
              <div>No employees are on leave{selectedDay ? ` on ${selectedDay} ${MONTHS[month - 1]}` : ''}</div>
            </div>
          ) : (
            selectedLeaves.map((lv, i) => (
              <div key={i} className="lc-transaction">
                <span>{lv.employee_name}</span>
                <span>{lv.total_days}</span>
                <span>{lv.start_date} – {lv.end_date}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendar;
