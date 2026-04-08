import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineClock, HiOutlineDownload, HiOutlineEye, HiOutlineCurrencyRupee } from 'react-icons/hi';
import {
  getPayrollRuns, createPayrollRun, approvePayrollRun, markRunPaid,
  getPayslips, getSalaryStructures, getEmployees,
  createSalaryStructure, updateSalaryStructure, getSalaryHistory
} from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const Payroll = () => {
  const [tab, setTab] = useState('runs'); // 'runs' | 'salaries' | 'payslips'
  const [runs, setRuns] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Run modal
  const [runModal, setRunModal] = useState(false);
  const [runForm, setRunForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [runSubmitting, setRunSubmitting] = useState(false);

  // Salary modal
  const [salaryModal, setSalaryModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    employee_id: '',
    basic: '', hra: '', da: '', ta: '',
    special_allowance: '', medical_allowance: '', other_allowances: '',
    pf_deduction: '', esi: '', professional_tax: '', tds: '', other_deductions: '',
    bank_name: '', account_number: '', ifsc_code: '', pan_number: '',
  });
  const [salarySubmitting, setSalarySubmitting] = useState(false);

  // History modal
  const [historyModal, setHistoryModal] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Selected run for payslips
  const [selectedRun, setSelectedRun] = useState(null);

  // Payslips filter + detail modal
  const [empFilter, setEmpFilter] = useState('');
  const [payslipDetailModal, setPayslipDetailModal] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, salRes, empRes] = await Promise.all([
        getPayrollRuns(), getSalaryStructures(), getEmployees()
      ]);
      setRuns(runsRes.data.results || runsRes.data);
      setSalaries(salRes.data.results || salRes.data);
      setEmployees(empRes.data.results || empRes.data);
    } catch {
      setError('Failed to load payroll data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchPayslips = useCallback(async (runId, empId = '') => {
    try {
      const params = {};
      if (runId) params.run_id = runId;
      if (empId) params.employee = empId;
      const res = await getPayslips(params);
      setPayslips(res.data.results || res.data);
    } catch {
      toast.error('Failed to load payslips');
    }
  }, []);

  useEffect(() => {
    if (selectedRun) fetchPayslips(selectedRun.id, empFilter);
  }, [selectedRun, empFilter, fetchPayslips]);

  const handleRunSubmit = async (e) => {
    e.preventDefault();
    setRunSubmitting(true);
    try {
      await createPayrollRun({ month: Number(runForm.month), year: Number(runForm.year) });
      toast.success('Payroll run created');
      setRunModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create payroll run');
    } finally {
      setRunSubmitting(false);
    }
  };

  const handleApproveRun = async (id) => {
    try {
      await approvePayrollRun(id);
      toast.success('Payroll run approved');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve');
    }
  };

  const EMPTY_SALARY = {
    employee_id: '',
    basic: '', hra: '', da: '', ta: '',
    special_allowance: '', medical_allowance: '', other_allowances: '',
    pf_deduction: '', esi: '', professional_tax: '', tds: '', other_deductions: '',
    bank_name: '', account_number: '', ifsc_code: '', pan_number: '',
  };

  const openSalaryModal = (s) => {
    if (s) {
      setEditingSalary(s);
      setSalaryForm({
        employee_id: s.employee_id,
        basic: s.basic, hra: s.hra, da: s.da || '', ta: s.ta || '',
        special_allowance: s.special_allowance || '', medical_allowance: s.medical_allowance || '',
        other_allowances: s.other_allowances || '',
        pf_deduction: s.pf_deduction, esi: s.esi || '', professional_tax: s.professional_tax || '',
        tds: s.tds || '', other_deductions: s.other_deductions || '',
        bank_name: s.bank_name || '', account_number: s.account_number || '',
        ifsc_code: s.ifsc_code || '', pan_number: s.pan_number || '',
      });
    } else {
      setEditingSalary(null);
      setSalaryForm({ ...EMPTY_SALARY });
    }
    setSalaryModal(true);
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setSalarySubmitting(true);
    const n = (v) => parseFloat(v) || 0;
    const payload = {
      employee_id: salaryForm.employee_id,
      basic: n(salaryForm.basic), hra: n(salaryForm.hra),
      da: n(salaryForm.da), ta: n(salaryForm.ta),
      special_allowance: n(salaryForm.special_allowance),
      medical_allowance: n(salaryForm.medical_allowance),
      other_allowances: n(salaryForm.other_allowances),
      pf_deduction: n(salaryForm.pf_deduction), esi: n(salaryForm.esi),
      professional_tax: n(salaryForm.professional_tax), tds: n(salaryForm.tds),
      other_deductions: n(salaryForm.other_deductions),
      bank_name: salaryForm.bank_name, account_number: salaryForm.account_number,
      ifsc_code: salaryForm.ifsc_code, pan_number: salaryForm.pan_number,
    };
    try {
      if (editingSalary) {
        await updateSalaryStructure(editingSalary.id, payload);
        toast.success('Salary structure updated');
      } else {
        await createSalaryStructure(payload);
        toast.success('Salary structure created');
      }
      setSalaryModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save salary structure');
    } finally {
      setSalarySubmitting(false);
    }
  };

  const sf = (n) => (n ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

  const exportPayslipsCSV = () => {
    if (!payslips.length) return;
    const runLabel = selectedRun ? `${MONTHS[selectedRun.month - 1]}_${selectedRun.year}` : 'all';
    const headers = ['EID', 'Name', 'Month', 'Year', 'Days Present', 'Gross', 'PF', 'ESI', 'Prof Tax', 'TDS', 'Other Ded', 'Net Pay'];
    const rows = payslips.map((p) => [
      p.employee_eid, `"${p.employee_name}"`, MONTHS[p.month - 1], p.year,
      p.days_present, p.gross,
      p.pf || 0, p.esi || 0, p.professional_tax || 0, p.tds || 0, p.other_deductions || 0,
      p.net,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payslips-${runLabel}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printPayslip = (ps) => {
    if (!ps) return;
    const fmt = (v) => (v || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
    const runLabel = `${MONTHS[ps.month - 1]} ${ps.year}`;
    const totalDed = (ps.pf || 0) + (ps.esi || 0) + (ps.professional_tax || 0) + (ps.tds || 0) + (ps.other_deductions || 0);
    const row = (label, val, deduct) => val ? `<div class="row"><span>${label}</span><span>${deduct ? '− ' : ''}${fmt(val)}</span></div>` : '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payslip - ${ps.employee_name} - ${runLabel}</title>
<style>body{font-family:Arial,sans-serif;max-width:680px;margin:36px auto;color:#333}h2{text-align:center;color:#1e40af;margin-bottom:4px}.sub{text-align:center;color:#64748b;margin-bottom:20px;font-size:14px}.info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;padding:12px;background:#f8fafc;border-radius:8px}.info label{font-size:11px;color:#64748b;display:block}.info span{font-weight:600}h3{font-size:13px;color:#475569;background:#f1f5f9;padding:5px 10px;border-radius:4px;margin:14px 0 6px}.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f8fafc;font-size:13px}.ttl{display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:14px;border-top:2px solid #e2e8f0;margin-top:8px}.net{display:flex;justify-content:space-between;margin-top:18px;padding:12px;background:#eff6ff;border-radius:8px;font-size:17px;font-weight:700;color:#1e40af}.foot{text-align:center;color:#94a3b8;margin-top:32px;font-size:11px}</style>
</head><body>
<h2>Payslip</h2><div class="sub">${runLabel}</div>
<div class="info"><div><label>Employee</label><span>${ps.employee_name}</span></div><div><label>Employee ID</label><span>${ps.employee_eid}</span></div><div><label>Days Present</label><span>${ps.days_present}</span></div><div><label>Days Absent</label><span>${ps.days_absent}</span></div></div>
<h3>Earnings</h3>
<div class="row"><span>Basic Salary</span><span>${fmt(ps.basic)}</span></div>
<div class="row"><span>HRA</span><span>${fmt(ps.hra)}</span></div>
${row('DA', ps.da)}${row('TA', ps.ta)}${row('Special Allowance', ps.special_allowance)}${row('Medical Allowance', ps.medical_allowance)}${row('Other Allowances', ps.other_allowances)}
<div class="ttl"><span>Gross Salary</span><span>${fmt(ps.gross)}</span></div>
<h3>Deductions</h3>
${row('Provident Fund (PF)', ps.pf, true)}${row('ESI', ps.esi, true)}${row('Professional Tax', ps.professional_tax, true)}${row('TDS', ps.tds, true)}${row('Other Deductions', ps.other_deductions, true)}
<div class="ttl"><span>Total Deductions</span><span>− ${fmt(totalDed)}</span></div>
<div class="net"><span>Net Pay</span><span>${fmt(ps.net)}</span></div>
<div class="foot">This is a computer-generated payslip.</div>
</body></html>`;
    const win = window.open('', '_blank', 'width=760,height=900');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handleMarkPaid = async (id) => {
    try {
      await markRunPaid(id);
      toast.success('Payroll run marked as Paid');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to mark as Paid');
    }
  };

  const openHistory = async (s) => {
    setHistoryTarget(s);
    setHistoryModal(true);
    setHistoryData([]);
    setHistoryLoading(true);
    try {
      const res = await getSalaryHistory(s.id);
      setHistoryData(res.data || []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const statusColor = { Draft: 'warning', Approved: 'present', Paid: 'present' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Payroll</h2><p>Manage salary structures, payroll runs, and payslips</p></div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['runs', 'salaries', 'payslips'].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'runs' ? 'Payroll Runs' : t === 'salaries' ? 'Salary Structures' : 'Payslips'}
          </button>
        ))}
      </div>

      {loading ? <Loading message="Loading payroll data..." /> :
        error ? <ErrorState message={error} onRetry={fetchAll} /> : (
        <>
          {/* ── Payroll Runs ── */}
          {tab === 'runs' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => setRunModal(true)}><HiOutlinePlus /> New Payroll Run</button>
              </div>
              <div className="card">
                {runs.length === 0 ? <EmptyState title="No payroll runs" message="Create your first payroll run" /> : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr><th>Month</th><th>Year</th><th>Total Cost</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {runs.map((r) => (
                          <tr key={r.id}>
                            <td>{MONTHS[r.month - 1]}</td>
                            <td>{r.year}</td>
                            <td><strong>{sf(r.total_cost)}</strong></td>
                            <td><span className={`badge badge-${statusColor[r.status] || ''}`}>{r.status}</span></td>
                            <td>
                              <div className="actions-cell">
                                {r.status === 'Draft' && (
                                  <button className="btn-icon" title="Approve" onClick={() => handleApproveRun(r.id)}>
                                    <HiOutlineCheck size={18} style={{ color: 'var(--success)' }} />
                                  </button>
                                )}
                                {r.status === 'Approved' && (
                                  <button className="btn-icon" title="Mark as Paid" onClick={() => handleMarkPaid(r.id)}>
                                    <HiOutlineCurrencyRupee size={18} style={{ color: 'var(--primary)' }} />
                                  </button>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRun(r); setTab('payslips'); }}>
                                  View Payslips
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Salary Structures ── */}
          {tab === 'salaries' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => openSalaryModal(null)}><HiOutlinePlus /> Add Salary Structure</button>
              </div>
              <div className="card">
                {salaries.length === 0 ? <EmptyState title="No salary structures" message="Add salary details for employees" /> : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr><th>Employee</th><th>Basic</th><th>HRA</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {salaries.map((s) => (
                          <tr key={s.id}>
                            <td><strong>{s.employee_eid}</strong><br /><small>{s.employee_name}</small></td>
                            <td>{sf(s.basic)}</td>
                            <td>{sf(s.hra)}</td>
                            <td>{sf(s.gross_salary)}</td>
                            <td>{sf((s.pf_deduction||0)+(s.esi||0)+(s.professional_tax||0)+(s.tds||0)+(s.other_deductions||0))}</td>
                            <td><strong>{sf(s.net_salary)}</strong></td>
                            <td>
                              <div className="actions-cell">
                                <button className="btn btn-secondary btn-sm" onClick={() => openSalaryModal(s)}>Edit</button>
                                <button className="btn-icon" title="Salary History" onClick={() => openHistory(s)}>
                                  <HiOutlineClock size={18} style={{ color: 'var(--primary)' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Payslips ── */}
          {tab === 'payslips' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="form-control" style={{ maxWidth: 260 }} value={selectedRun?.id || ''}
                  onChange={(e) => { setEmpFilter(''); setSelectedRun(runs.find((r) => r.id === e.target.value) || null); }}>
                  <option value="">Select Payroll Run</option>
                  {runs.map((r) => <option key={r.id} value={r.id}>{MONTHS[r.month - 1]} {r.year} — {r.status}</option>)}
                </select>
                <select className="form-control" style={{ maxWidth: 220 }} value={empFilter}
                  onChange={(e) => setEmpFilter(e.target.value)}>
                  <option value="">All Employees</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                </select>
                <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={exportPayslipsCSV} disabled={!payslips.length}>
                  <HiOutlineDownload style={{ marginRight: 4 }} /> Export CSV
                </button>
              </div>
              <div className="card">
                {!selectedRun ? <EmptyState title="Select a payroll run" message="Choose a run above to view payslips" /> :
                  payslips.length === 0 ? <EmptyState title="No payslips" message="No payslips in this run" /> : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr><th>Employee</th><th>Days Present</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {payslips.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.employee_eid}</strong><br /><small>{p.employee_name}</small></td>
                            <td>{p.days_present} / {p.days_present + p.days_absent}</td>
                            <td>{sf(p.gross)}</td>
                            <td>{sf((p.pf||0)+(p.esi||0)+(p.professional_tax||0)+(p.tds||0)+(p.other_deductions||0))}</td>
                            <td><strong>{sf(p.net)}</strong></td>
                            <td>
                              <div className="actions-cell">
                                <button className="btn-icon" title="View Payslip" onClick={() => { setViewingPayslip(p); setPayslipDetailModal(true); }}>
                                  <HiOutlineEye size={18} style={{ color: 'var(--primary)' }} />
                                </button>
                                <button className="btn-icon" title="Download Payslip" onClick={() => printPayslip(p)}>
                                  <HiOutlineDownload size={18} style={{ color: 'var(--gray-500)' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* New Run Modal */}
      <Modal isOpen={runModal} onClose={() => setRunModal(false)} title="Create Payroll Run">
        <form onSubmit={handleRunSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Month *</label>
                <select className="form-control" value={runForm.month} onChange={(e) => setRunForm({ ...runForm, month: e.target.value })}>
                  {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year *</label>
                <input type="number" className="form-control" value={runForm.year}
                  min={2020} max={2030}
                  onChange={(e) => setRunForm({ ...runForm, year: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setRunModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={runSubmitting}>
              {runSubmitting ? 'Processing...' : 'Run Payroll'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Salary Modal */}
      <Modal isOpen={salaryModal} onClose={() => setSalaryModal(false)}
        title={editingSalary ? 'Edit Salary Structure' : 'Add Salary Structure'}
        style={{ maxWidth: 800 }}>
        <form onSubmit={handleSalarySubmit}>
          <div className="modal-body">
            {!editingSalary && (
              <div className="form-group">
                <label>Employee *</label>
                <select className="form-control" value={salaryForm.employee_id}
                  onChange={(e) => setSalaryForm({ ...salaryForm, employee_id: e.target.value })}>
                  <option value="">Select Employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                </select>
              </div>
            )}

            {/* Earnings + Deductions side-by-side */}
            <div className="salary-panels-wrap">
              {/* Earnings Panel */}
              <div className="salary-section salary-section-earnings">
                <div className="salary-section-title">Earnings</div>
                <div className="salary-fields-grid">
                  {[
                    { key: 'basic',             label: 'Basic Salary', required: true },
                    { key: 'hra',               label: 'HRA' },
                    { key: 'da',                label: 'DA' },
                    { key: 'ta',                label: 'TA' },
                    { key: 'special_allowance', label: 'Special Allowance' },
                    { key: 'medical_allowance', label: 'Medical Allowance' },
                    { key: 'other_allowances',  label: 'Other Allowances' },
                  ].map(({ key, label, required }) => (
                    <div key={key} className="salary-field-item">
                      <label>{label}{required && <span className="required"> *</span>}</label>
                      <input type="number" className="form-control" min="0"
                        value={salaryForm[key]}
                        onChange={(e) => setSalaryForm({ ...salaryForm, [key]: e.target.value })}
                        placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions Panel */}
              <div className="salary-section salary-section-deductions">
                <div className="salary-section-title">Deductions</div>
                <div className="salary-fields-grid">
                  {[
                    { key: 'pf_deduction',    label: 'PF' },
                    { key: 'esi',             label: 'ESI' },
                    { key: 'professional_tax',label: 'Prof. Tax' },
                    { key: 'tds',             label: 'TDS' },
                    { key: 'other_deductions',label: 'Other Deductions' },
                  ].map(({ key, label }) => (
                    <div key={key} className="salary-field-item">
                      <label>{label}</label>
                      <input type="number" className="form-control" min="0"
                        value={salaryForm[key]}
                        onChange={(e) => setSalaryForm({ ...salaryForm, [key]: e.target.value })}
                        placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bank Details Panel */}
            <div className="salary-section salary-section-bank" style={{ marginTop: 12 }}>
              <div className="salary-section-title">Bank Details</div>
              <div className="salary-bank-grid">
                {[
                  { key: 'bank_name',      label: 'Bank Name',      placeholder: 'e.g. SBI' },
                  { key: 'account_number', label: 'Account Number', placeholder: 'Account number' },
                  { key: 'ifsc_code',      label: 'IFSC Code',      placeholder: 'e.g. SBIN0001234' },
                  { key: 'pan_number',     label: 'PAN Number',     placeholder: 'e.g. ABCDE1234F' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="salary-field-item">
                    <label>{label}</label>
                    <input className="form-control"
                      value={salaryForm[key]}
                      onChange={(e) => setSalaryForm({ ...salaryForm, [key]: e.target.value })}
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Summary Strip */}
            {(() => {
              const n = (v) => parseFloat(v) || 0;
              const gross = n(salaryForm.basic) + n(salaryForm.hra) + n(salaryForm.da) +
                n(salaryForm.ta) + n(salaryForm.special_allowance) +
                n(salaryForm.medical_allowance) + n(salaryForm.other_allowances);
              const deductions = n(salaryForm.pf_deduction) + n(salaryForm.esi) +
                n(salaryForm.professional_tax) + n(salaryForm.tds) + n(salaryForm.other_deductions);
              const net = gross - deductions;
              const fmt = (v) => '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div className="salary-summary-strip">
                  <div className="salary-summary-item salary-summary-gross">
                    <span className="salary-summary-label">Gross Salary</span>
                    <span className="salary-summary-value">{fmt(gross)}</span>
                  </div>
                  <div className="salary-summary-divider" />
                  <div className="salary-summary-item salary-summary-deductions">
                    <span className="salary-summary-label">Total Deductions</span>
                    <span className="salary-summary-value">− {fmt(deductions)}</span>
                  </div>
                  <div className="salary-summary-divider" />
                  <div className="salary-summary-item salary-summary-net">
                    <span className="salary-summary-label">Net Take-Home</span>
                    <span className="salary-summary-value">{fmt(net)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setSalaryModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={salarySubmitting}>
              {salarySubmitting ? 'Saving...' : editingSalary ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Salary History Modal */}
      <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)}
        title={`Salary History — ${historyTarget?.employee_name || ''}`}
        style={{ maxWidth: 680 }}>
        <div className="modal-body">
          {historyLoading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--gray-500)' }}>Loading history…</div>
          ) : historyData.length === 0 ? (
            <div className="sh-empty">
              <HiOutlineClock size={36} style={{ color: 'var(--gray-300)', marginBottom: 8 }} />
              <div>No change history yet.</div>
              <div style={{ fontSize: 13, marginTop: 4, color: 'var(--gray-400)' }}>
                History is saved every time you edit a salary structure.
              </div>
            </div>
          ) : (
            <>
              {/* Current (live) badge */}
              <div className="sh-current-badge">
                <span>Current</span>
                <div className="sh-current-values">
                  <span className="sh-chip sh-chip-gross">Gross {sf(historyTarget?.gross_salary)}</span>
                  <span className="sh-chip sh-chip-ded">Deductions {sf((historyTarget?.pf_deduction||0)+(historyTarget?.esi||0)+(historyTarget?.professional_tax||0)+(historyTarget?.tds||0)+(historyTarget?.other_deductions||0))}</span>
                  <span className="sh-chip sh-chip-net">Net {sf(historyTarget?.net_salary)}</span>
                </div>
              </div>

              {/* History timeline */}
              <div className="sh-timeline">
                {historyData.map((h, idx) => {
                  const prevGross  = idx < historyData.length - 1 ? historyData[idx + 1].gross_salary : null;
                  const grossDiff  = prevGross != null ? h.gross_salary - prevGross : null;
                  const netDiff    = idx < historyData.length - 1 ? h.net_salary - historyData[idx + 1].net_salary : null;
                  return (
                    <div key={h.id} className="sh-entry">
                      <div className="sh-entry-dot" />
                      <div className="sh-entry-body">
                        <div className="sh-entry-date">
                          {new Date(h.changed_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                        <div className="sh-entry-row">
                          <div className="sh-entry-cols">
                            <div className="sh-entry-col">
                              <div className="sh-col-label">Basic</div>
                              <div className="sh-col-val">{sf(h.basic)}</div>
                            </div>
                            <div className="sh-entry-col">
                              <div className="sh-col-label">HRA</div>
                              <div className="sh-col-val">{sf(h.hra)}</div>
                            </div>
                            <div className="sh-entry-col sh-col-gross">
                              <div className="sh-col-label">Gross</div>
                              <div className="sh-col-val">{sf(h.gross_salary)}
                                {grossDiff != null && (
                                  <span className={`sh-diff ${grossDiff >= 0 ? 'sh-diff-up' : 'sh-diff-down'}`}>
                                    {grossDiff >= 0 ? '▲' : '▼'} {sf(Math.abs(grossDiff))}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="sh-entry-col sh-col-ded">
                              <div className="sh-col-label">Deductions</div>
                              <div className="sh-col-val">{sf((h.pf_deduction||0)+(h.esi||0)+(h.professional_tax||0)+(h.tds||0)+(h.other_deductions||0))}</div>
                            </div>
                            <div className="sh-entry-col sh-col-net">
                              <div className="sh-col-label">Net</div>
                              <div className="sh-col-val">{sf(h.net_salary)}
                                {netDiff != null && (
                                  <span className={`sh-diff ${netDiff >= 0 ? 'sh-diff-up' : 'sh-diff-down'}`}>
                                    {netDiff >= 0 ? '▲' : '▼'} {sf(Math.abs(netDiff))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setHistoryModal(false)}>Close</button>
        </div>
      </Modal>
      {/* Payslip Detail Modal */}
      <Modal isOpen={payslipDetailModal} onClose={() => setPayslipDetailModal(false)}
        title={viewingPayslip ? `Payslip — ${viewingPayslip.employee_name}` : 'Payslip'}
        style={{ maxWidth: 680 }}>
        {viewingPayslip && (() => {
          const ps = viewingPayslip;
          const totalDed = (ps.pf||0)+(ps.esi||0)+(ps.professional_tax||0)+(ps.tds||0)+(ps.other_deductions||0);
          return (
            <>
              <div className="modal-body">
                <div className="psd-info-grid">
                  <div className="psd-info-item"><span className="psd-info-label">Employee</span><span className="psd-info-val">{ps.employee_name}</span></div>
                  <div className="psd-info-item"><span className="psd-info-label">Employee ID</span><span className="psd-info-val">{ps.employee_eid}</span></div>
                  <div className="psd-info-item"><span className="psd-info-label">Period</span><span className="psd-info-val">{MONTHS[ps.month - 1]} {ps.year}</span></div>
                  <div className="psd-info-item"><span className="psd-info-label">Attendance</span><span className="psd-info-val">{ps.days_present} present / {ps.days_absent} absent</span></div>
                </div>
                <div className="psd-panels">
                  <div className="psd-panel psd-panel-earn">
                    <div className="psd-panel-title">Earnings</div>
                    <div className="psd-row"><span>Basic Salary</span><span>{sf(ps.basic)}</span></div>
                    <div className="psd-row"><span>HRA</span><span>{sf(ps.hra)}</span></div>
                    {(ps.da > 0) && <div className="psd-row"><span>DA</span><span>{sf(ps.da)}</span></div>}
                    {(ps.ta > 0) && <div className="psd-row"><span>TA</span><span>{sf(ps.ta)}</span></div>}
                    {(ps.special_allowance > 0) && <div className="psd-row"><span>Special Allowance</span><span>{sf(ps.special_allowance)}</span></div>}
                    {(ps.medical_allowance > 0) && <div className="psd-row"><span>Medical Allowance</span><span>{sf(ps.medical_allowance)}</span></div>}
                    {(ps.other_allowances > 0) && <div className="psd-row"><span>Other Allowances</span><span>{sf(ps.other_allowances)}</span></div>}
                    <div className="psd-row psd-total"><span>Gross Salary</span><span>{sf(ps.gross)}</span></div>
                  </div>
                  <div className="psd-panel psd-panel-ded">
                    <div className="psd-panel-title">Deductions</div>
                    {(ps.pf > 0) && <div className="psd-row"><span>PF</span><span>− {sf(ps.pf)}</span></div>}
                    {(ps.esi > 0) && <div className="psd-row"><span>ESI</span><span>− {sf(ps.esi)}</span></div>}
                    {(ps.professional_tax > 0) && <div className="psd-row"><span>Professional Tax</span><span>− {sf(ps.professional_tax)}</span></div>}
                    {(ps.tds > 0) && <div className="psd-row"><span>TDS</span><span>− {sf(ps.tds)}</span></div>}
                    {(ps.other_deductions > 0) && <div className="psd-row"><span>Other Deductions</span><span>− {sf(ps.other_deductions)}</span></div>}
                    {totalDed === 0 && <div className="psd-row" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}><span>No deductions</span><span>—</span></div>}
                    <div className="psd-row psd-total psd-total-ded"><span>Total Deductions</span><span>− {sf(totalDed)}</span></div>
                  </div>
                </div>
                <div className="psd-net-strip">
                  <span>Net Pay</span>
                  <span>{sf(ps.net)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setPayslipDetailModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => printPayslip(ps)}>
                  <HiOutlineDownload style={{ marginRight: 4 }} /> Download / Print
                </button>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Payroll;
