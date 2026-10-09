import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Languages,
  FileText,
  Send,
  Eye,
  Trash2,
  ExternalLink
} from 'lucide-react';

const SAMPLE_TELUGU_NOTICE = `అందరికీ నమస్కారం, రేపు డిబిఎంఎస్ అసైన్మెంట్ సాయంత్రం 5 గంటలలోపు గూగుల్ క్లాస్‌రూమ్‌లో అప్‌లోడ్ చేయండి. రిలేషనల్ ఆల్జీబ్రా మరియు నార్మలైజేషన్ ప్రశ్నలు తప్పనిసరిగా పూర్తి చేయాలి. లింక్: https://classroom.google.com/dbms-unit-4`;

const SAMPLE_ENGLISH_NOTICE = `Important Update: Operating Systems Lab 4 on Deadlock Avoidance and Banker's Algorithm has been released. Submit your code and PDF report by 2026-10-25 23:59 on the portal: https://classroom.google.com/os-lab-4`;

const CRDashboard = ({ onAnnouncementPublished }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'pending', 'published'
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Raw Input State
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState('text'); // text, telugu, pdf_ocr, image_ocr

  // AI Extracted & Editable Fields
  const [extractedData, setExtractedData] = useState(null);
  const [editableFields, setEditableFields] = useState({
    subject: 'DBMS',
    task_title: '',
    description: '',
    deadline: '',
    resource_links: '',
    translated_text: ''
  });

  // Lists
  const [pendingList, setPendingList] = useState([]);
  const [publishedList, setPublishedList] = useState([]);
  const [notificationMsg, setNotificationMsg] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        api.get('/announcements/pending'),
        api.get('/announcements')
      ]);
      setPendingList(pendingRes.data);
      setPublishedList(allRes.data.filter((a) => a.status === 'approved'));
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleExtractAI = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    setNotificationMsg(null);

    try {
      const res = await api.post('/ai/extract-announcement', {
        raw_text: rawText,
        source_type: sourceType
      });
      const data = res.data;
      setExtractedData(data);
      setEditableFields({
        subject: data.subject || 'DBMS',
        task_title: data.task_title || '',
        description: data.description || '',
        deadline: data.deadline || '',
        resource_links: Array.isArray(data.resource_links) ? data.resource_links.join(', ') : '',
        translated_text: data.english_translation || ''
      });
    } catch (err) {
      console.error('AI extraction failed:', err);
      setNotificationMsg({ type: 'error', text: 'AI Extraction failed. Please enter details manually.' });
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateAnnouncement = async (status = 'pending') => {
    try {
      setLoading(true);
      const payload = {
        class_id: user?.class_id || 1,
        subject: editableFields.subject,
        task_title: editableFields.task_title,
        description: editableFields.description,
        original_text: rawText,
        translated_text: editableFields.translated_text || null,
        deadline: editableFields.deadline || null,
        resource_links: editableFields.resource_links || null
      };

      const res = await api.post('/announcements', payload);
      const newAnnId = res.data.id;

      if (status === 'approved') {
        await api.post(`/announcements/${newAnnId}/approve`);
        setNotificationMsg({ type: 'success', text: 'Announcement verified and published immediately to student feed!' });
      } else {
        setNotificationMsg({ type: 'success', text: 'Announcement saved as Pending for further verification.' });
      }

      // Reset form
      setRawText('');
      setExtractedData(null);
      setEditableFields({ subject: 'DBMS', task_title: '', description: '', deadline: '', resource_links: '', translated_text: '' });
      fetchAnnouncements();
      if (onAnnouncementPublished) onAnnouncementPublished();
    } catch (err) {
      console.error('Error publishing announcement:', err);
      setNotificationMsg({ type: 'error', text: 'Failed to save announcement.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/announcements/${id}/approve`);
      setNotificationMsg({ type: 'success', text: `Announcement #${id} approved and broadcasted to students!` });
      fetchAnnouncements();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/announcements/${id}/reject`);
      setNotificationMsg({ type: 'warning', text: `Announcement #${id} rejected.` });
      fetchAnnouncements();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  return (
    <div className="page-body">
      {/* CR Studio Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant="cr" icon={ShieldCheck}>Class Representative Studio</Badge>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>
              {user?.classroom?.class_name} ({user?.classroom?.section})
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Smart Classroom Notice & Verification Studio
          </h1>
        </div>

        {/* Studio Sub-Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--slate-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('create')}
            style={{ border: 'none' }}
          >
            <Sparkles size={14} /> AI Notice Ingestion
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pending')}
            style={{ border: 'none' }}
          >
            <Clock size={14} /> Pending Approvals ({pendingList.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'published' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('published')}
            style={{ border: 'none' }}
          >
            <CheckCircle2 size={14} /> Published Tasks ({publishedList.length})
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
            background: notificationMsg.type === 'success' ? 'var(--success-light)' : (notificationMsg.type === 'warning' ? 'var(--warning-light)' : 'var(--danger-light)'),
            color: notificationMsg.type === 'success' ? 'var(--success-text)' : (notificationMsg.type === 'warning' ? 'var(--warning-text)' : 'var(--danger-text)'),
            border: '1px solid currentColor'
          }}
        >
          {notificationMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* TAB 1: CREATE & AI EXTRACTION */}
      {activeTab === 'create' && (
        <div>
          <div className="side-by-side-grid">
            {/* Left Column: Raw Input & Source Selection */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <FileText size={18} style={{ color: 'var(--primary)' }} />
                  1. Raw Classroom Input
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setRawText(SAMPLE_TELUGU_NOTICE);
                      setSourceType('telugu');
                    }}
                    title="Load Telugu notice sample for demonstration"
                  >
                    🇮🇳 Load Telugu Demo
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setRawText(SAMPLE_ENGLISH_NOTICE);
                      setSourceType('text');
                    }}
                    title="Load English notice sample"
                  >
                    Load English Demo
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Input Format / Source Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['text', 'telugu', 'pdf_ocr', 'image_ocr'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`btn btn-sm ${sourceType === type ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSourceType(type)}
                      style={{ textTransform: 'capitalize', flex: 1 }}
                    >
                      {type === 'telugu' ? 'Telugu Text' : type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Paste Raw Notice / Message Content</label>
                <textarea
                  className="form-control"
                  rows={8}
                  placeholder="Paste unstructured announcement from WhatsApp, Email, Telugu notice, or OCR text..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  style={{ minHeight: '160px', fontFamily: sourceType === 'telugu' ? 'inherit' : 'var(--font-sans)' }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                onClick={handleExtractAI}
                disabled={extracting || !rawText.trim()}
              >
                <Sparkles size={16} />
                {extracting ? 'AI Analyzing & Extracting...' : 'Extract Structured Task with AI'}
              </button>
            </div>

            {/* Right Column: AI Extraction & CR Verification Editor */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <ShieldCheck size={18} style={{ color: 'var(--accent-blue)' }} />
                  2. CR Verification & Correction
                </h3>
                {extractedData?.detected_language && (
                  <Badge variant={extractedData.detected_language === 'Telugu' ? 'warning' : 'primary'} icon={Languages}>
                    {extractedData.detected_language} Detected
                  </Badge>
                )}
              </div>

              {/* Relative Date Confirmation Warning Banner */}
              {extractedData?.needs_confirmation && (
                <div
                  style={{
                    background: 'var(--warning-light)',
                    border: '1px solid #fde68a',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--warning-text)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '16px'
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Date Confirmation Required:</strong>
                    <p style={{ marginTop: '2px' }}>{extractedData.confirmation_message}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-control"
                    value={editableFields.subject}
                    onChange={(e) => setEditableFields({ ...editableFields, subject: e.target.value })}
                  >
                    <option value="DBMS">DBMS</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Computer Networks">Computer Networks</option>
                    <option value="Data Structures">Data Structures</option>
                    <option value="Web Technologies">Web Technologies</option>
                    <option value="General Academic">General Academic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmed Deadline</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="YYYY-MM-DD or YYYY-MM-DD HH:MM"
                    value={editableFields.deadline}
                    onChange={(e) => setEditableFields({ ...editableFields, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task / Assignment Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lab Milestone 4 on SQL Normalization"
                  value={editableFields.task_title}
                  onChange={(e) => setEditableFields({ ...editableFields, task_title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Clear instructions for students..."
                  value={editableFields.description}
                  onChange={(e) => setEditableFields({ ...editableFields, description: e.target.value })}
                />
              </div>

              {editableFields.translated_text && (
                <div className="form-group">
                  <label className="form-label">English Translation (for non-English notices)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editableFields.translated_text}
                    onChange={(e) => setEditableFields({ ...editableFields, translated_text: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Resource URLs (comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://classroom.google.com/..."
                  value={editableFields.resource_links}
                  onChange={(e) => setEditableFields({ ...editableFields, resource_links: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  onClick={() => handleCreateAnnouncement('approved')}
                  disabled={loading || !editableFields.task_title.trim()}
                >
                  <CheckCircle2 size={16} /> Approve & Publish to Students
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCreateAnnouncement('pending')}
                  disabled={loading || !editableFields.task_title.trim()}
                >
                  Save as Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS LIST */}
      {activeTab === 'pending' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} style={{ color: 'var(--warning-text)' }} />
              Pending Classroom Announcements ({pendingList.length})
            </h3>
          </div>

          {pendingList.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--slate-400)' }}>
              No pending notices awaiting approval.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingList.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    background: 'var(--slate-50)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="primary">{ann.subject}</Badge>
                      <Badge variant="pending">Pending CR Approval</Badge>
                      <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>By {ann.creator_name}</span>
                    </div>
                    {ann.deadline && (
                      <span style={{ fontSize: '12px', color: 'var(--warning-text)', fontWeight: 600 }}>
                        Due: {ann.deadline}
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '6px' }}>
                    {ann.task_title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginBottom: '10px' }}>
                    {ann.description}
                  </p>

                  {ann.original_text && (
                    <div style={{ fontSize: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--slate-200)', marginBottom: '12px', color: 'var(--slate-600)' }}>
                      <strong>Original Notice:</strong> {ann.original_text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(ann.id)}>
                      <CheckCircle2 size={14} /> Approve & Publish
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(ann.id)}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PUBLISHED TASKS */}
      {activeTab === 'published' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              Active Broadcasted Announcements ({publishedList.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {publishedList.map((ann) => (
              <div
                key={ann.id}
                style={{
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  background: '#f0fdf4'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="primary">{ann.subject}</Badge>
                    <Badge variant="approved">Published to Students</Badge>
                  </div>
                  {ann.deadline && (
                    <span style={{ fontSize: '12px', color: 'var(--slate-600)', fontWeight: 600 }}>
                      Due: {ann.deadline}
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '4px' }}>
                  {ann.task_title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--slate-700)', marginBottom: '8px' }}>
                  {ann.description}
                </p>
                {ann.resource_links && (
                  <div style={{ fontSize: '12px' }}>
                    {ann.resource_links.split(',').map((url, idx) => (
                      <a
                        key={idx}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', fontWeight: 600, marginRight: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        Link {idx + 1} <ExternalLink size={11} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRDashboard;
