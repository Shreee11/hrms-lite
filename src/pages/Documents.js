import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlineDownload, HiOutlineDocumentText
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import {
  getDocuments, uploadDocument, deleteDocument, downloadDocument, getEmployees
} from '../services/api';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const DOC_TYPES = [
  { value: 'offer_letter',  label: 'Offer Letter' },
  { value: 'contract',      label: 'Employment Contract' },
  { value: 'id_proof',      label: 'ID Proof' },
  { value: 'certificate',   label: 'Certificate / Degree' },
  { value: 'payslip',       label: 'Payslip' },
  { value: 'other',         label: 'Other' },
];
const DOC_TYPE_LABEL = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

const HR_ROLES = ['super_admin', 'hr_admin', 'hr_manager'];

const Documents = () => {
  const { user } = useAuth();
  const isHR = HR_ROLES.includes(user?.role);

  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterEmp, setFilterEmp] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef();
  const [form, setForm] = useState({ employee_id: '', doc_type: 'offer_letter', title: '', notes: '' });
  const [fileData, setFileData] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterEmp ? { employee_id: filterEmp } : {};
      const res = await getDocuments(params);
      setDocs(res.data || []);
    } catch { setError('Failed to load documents.'); }
    finally { setLoading(false); }
  }, [filterEmp]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  useEffect(() => {
    if (isHR) {
      getEmployees().then((r) => setEmployees(r.data || [])).catch(() => {});
    }
  }, [isHR]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('File size must be under 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setFileData({ base64, name: file.name, type: file.type });
      if (!form.title) setForm((f) => ({ ...f, title: file.name.replace(/\.[^.]+$/, '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!form.employee_id) return toast.error('Select an employee');
    if (!fileData) return toast.error('Select a file');
    if (!form.title.trim()) return toast.error('Enter a title');
    setUploading(true);
    try {
      await uploadDocument({
        ...form,
        file_data: fileData.base64,
        file_name: fileData.name,
        file_type: fileData.type,
      });
      toast.success('Document uploaded');
      setUploadModal(false);
      setForm({ employee_id: '', doc_type: 'offer_letter', title: '', notes: '' });
      setFileData(null);
      fetchDocs();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocument(doc.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.file_type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget);
      toast.success('Document deleted');
      setDeleteTarget(null);
      fetchDocs();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const iconColor = { offer_letter: '#4f46e5', contract: '#0891b2', id_proof: '#059669', certificate: '#d97706', payslip: '#7c3aed', other: '#6b7280' };

  if (loading) return <Loading message="Loading documents..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDocs} />;

  return (
    <div>
      <div className="page-header">
        <div><h2>Documents</h2><p>{isHR ? 'Manage employee documents' : 'Your uploaded documents'}</p></div>
        {isHR && (
          <button className="btn btn-primary" onClick={() => setUploadModal(true)}>
            <HiOutlinePlus /> Upload Document
          </button>
        )}
      </div>

      {/* Filter (HR only) */}
      {isHR && (
        <div className="filter-bar">
          <select className="form-control" value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} style={{ minWidth: 220 }}>
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
            ))}
          </select>
        </div>
      )}

      {docs.length === 0 ? (
        <EmptyState title="No documents" description={isHR ? "Upload documents for employees." : "No documents have been uploaded for you yet."} />
      ) : (
        <div className="docs-grid">
          {docs.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="doc-icon" style={{ color: iconColor[doc.doc_type] || '#6b7280' }}>
                <HiOutlineDocumentText />
              </div>
              <div className="doc-info">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">{DOC_TYPE_LABEL[doc.doc_type] || doc.doc_type}</div>
                {isHR && <div className="doc-emp">{doc.employee_name}</div>}
                <div className="doc-date">{new Date(doc.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="doc-actions">
                <button className="btn-icon" title="Download" onClick={() => handleDownload(doc)}>
                  <HiOutlineDownload />
                </button>
                {isHR && (
                  <button className="btn-icon danger" title="Delete" onClick={() => setDeleteTarget(doc.id)}>
                    <HiOutlineTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadModal} onClose={() => { setUploadModal(false); setForm({ employee_id: '', doc_type: 'offer_letter', title: '', notes: '' }); setFileData(null); }} title="Upload Document">
        <div className="modal-body">
          <div className="form-group">
            <label>Employee *</label>
            <select className="form-control" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">-- Select employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Document Type *</label>
              <select className="form-control" value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
                {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Offer Letter 2026" />
            </div>
          </div>
          <div className="form-group">
            <label>File * <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(max 8 MB)</span></label>
            <input ref={fileRef} type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} />
            {fileData && <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 6 }}>✓ {fileData.name}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => { setUploadModal(false); setForm({ employee_id: '', doc_type: 'offer_letter', title: '', notes: '' }); setFileData(null); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document?"
        message="Permanently delete this document? This cannot be undone."
        loading={deleting}
      />
    </div>
  );
};

export default Documents;
