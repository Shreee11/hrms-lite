import React, { useState, useEffect } from 'react';
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineClipboardCheck } from 'react-icons/hi';
import { getDashboard, getAttendance } from '../services/api';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, attRes] = await Promise.all([
        getDashboard(),
        getAttendance({}),
      ]);
      setData(dashRes.data);
      setRecentAttendance(attRes.data.results || attRes.data);
    } catch (err) {
      setError('Failed to load dashboard data. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your HR system</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <HiOutlineUsers />
          </div>
          <div className="stat-value">{data?.total_employees || 0}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <HiOutlineOfficeBuilding />
          </div>
          <div className="stat-value">{data?.total_departments || 0}</div>
          <div className="stat-label">Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <HiOutlineClipboardCheck />
          </div>
          <div className="stat-value">{recentAttendance.length}</div>
          <div className="stat-label">Recent Records</div>
        </div>
      </div>

      {/* Department breakdown */}
      {data?.department_counts?.length > 0 && (
        <div className="card">
          <div className="dept-table">
            <h3 style={{ paddingTop: 20 }}>Employees by Department</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                  </tr>
                </thead>
                <tbody>
                  {data.department_counts.map((dept) => (
                    <tr key={dept.department}>
                      <td>{dept.department}</td>
                      <td>{dept.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="dept-table">
            <h3 style={{ paddingTop: 20 }}>Recent Attendance Records</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.employee_name} ({rec.employee_eid})</td>
                      <td>{rec.date}</td>
                      <td>
                        <span className={`badge badge-${rec.status.toLowerCase()}`}>
                          {rec.status}
                        </span>
                      </td>
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
