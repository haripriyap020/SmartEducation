import React, { useState, useEffect } from 'react';
import api from '../api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Layers,
  FileCheck2,
  Users,
  Plus,
  Trash2,
  BrainCircuit,
  GraduationCap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const FacultyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, questions, students

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    subject: 'DBMS',
    topic: 'SQL Joins',
    question_text: '',
    choices: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    difficulty: 'intermediate'
  });
  const [addingQ, setAddingQ] = useState(false);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const [statsRes, qRes, studentsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/questions?subject=DBMS'),
        api.get('/admin/students')
      ]);
      setStats(statsRes.data);
      setQuestions(qRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error('Failed to load faculty portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleChoiceChange = (index, value) => {
    const updated = [...newQuestion.choices];
    updated[index] = value;
    setNewQuestion({ ...newQuestion, choices: updated });
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.correct_answer || !newQuestion.question_text) {
      alert('Please fill in question text and specify the correct answer.');
      return;
    }

    setAddingQ(true);
    try {
      await api.post('/admin/questions', newQuestion);
      setShowAddModal(false);
      setNewQuestion({
        subject: 'DBMS',
        topic: 'SQL Joins',
        question_text: '',
        choices: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'intermediate'
      });
      fetchFacultyData();
    } catch (err) {
      console.error('Error creating question:', err);
    } finally {
      setAddingQ(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Question #${id}?`)) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Faculty Administration Portal..." />;

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant="faculty">Faculty & Department Administration</Badge>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Academic Curriculum & Question Bank Portal
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--slate-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('overview')}
            style={{ border: 'none' }}
          >
            <Layers size={14} /> Overview
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('questions')}
            style={{ border: 'none' }}
          >
            <FileCheck2 size={14} /> Question Bank ({questions.length})
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('students')}
            style={{ border: 'none' }}
          >
            <Users size={14} /> Student Roster ({students.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="metric-val">{stats?.total_students || 0}</div>
                <div className="metric-lbl">Enrolled Students</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="metric-val">{stats?.total_crs || 0}</div>
                <div className="metric-lbl">Class Representatives</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box" style={{ background: 'var(--success-light)', color: 'var(--success-text)' }}>
                <BrainCircuit size={24} />
              </div>
              <div>
                <div className="metric-val">{stats?.total_quizzes_taken || 0}</div>
                <div className="metric-lbl">Diagnostic Quizzes Taken</div>
                <div className="metric-sub" style={{ color: 'var(--success)' }}>
                  Avg Score: {stats?.avg_quiz_percentage || 0}%
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <FileCheck2 size={24} />
              </div>
              <div>
                <div className="metric-val">{stats?.total_questions || 0}</div>
                <div className="metric-lbl">DBMS Questions in Bank</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <BrainCircuit size={18} style={{ color: 'var(--primary)' }} />
                DBMS Topic Coverage Matrix
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {['SQL Basics', 'SQL Joins', 'Keys and Constraints', 'Normalization', 'Transactions'].map((top) => {
                const count = questions.filter((q) => q.topic === top).length;
                return (
                  <div key={top} style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)' }}>{top}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '4px' }}>{count} questions active</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: QUESTION BANK */}
      {activeSubTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-600)' }}>
              Showing {questions.length} Diagnostic & Practice Questions
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add New Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  background: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--slate-400)' }}>#{q.id}</span>
                    <Badge variant="primary">{q.topic}</Badge>
                    <Badge variant={q.difficulty}>{q.difficulty}</Badge>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '10px' }}>
                  {q.question_text}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  {q.choices.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        background: c === q.correct_answer ? 'var(--success-light)' : 'var(--slate-50)',
                        border: `1px solid ${c === q.correct_answer ? '#a7f3d0' : 'var(--slate-200)'}`,
                        color: c === q.correct_answer ? 'var(--success-text)' : 'var(--slate-700)',
                        fontWeight: c === q.correct_answer ? 700 : 400
                      }}
                    >
                      {String.fromCharCode(65 + i)}. {c} {c === q.correct_answer && '✓ (Correct)'}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div style={{ fontSize: '12px', color: 'var(--slate-500)', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: '6px' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: STUDENTS */}
      {activeSubTab === 'students' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Registered Student Roster
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--slate-200)', textAlign: 'left', color: 'var(--slate-500)' }}>
                <th style={{ padding: '10px 8px' }}>Name</th>
                <th style={{ padding: '10px 8px' }}>Email</th>
                <th style={{ padding: '10px 8px' }}>Role</th>
                <th style={{ padding: '10px 8px' }}>Classroom</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--slate-900)' }}>{st.name}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--slate-600)' }}>{st.email}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <Badge variant={st.role}>{st.role.toUpperCase()}</Badge>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--slate-500)' }}>
                    {st.classroom ? `${st.classroom.class_name} (${st.classroom.section})` : 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Question Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add DBMS Question to Bank"
        maxWidth="620px"
      >
        <form onSubmit={handleCreateQuestion}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Topic</label>
              <select
                className="form-control"
                value={newQuestion.topic}
                onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
              >
                <option value="SQL Basics">SQL Basics</option>
                <option value="SQL Joins">SQL Joins</option>
                <option value="Keys and Constraints">Keys and Constraints</option>
                <option value="Normalization">Normalization</option>
                <option value="Transactions">Transactions</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-control"
                value={newQuestion.difficulty}
                onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Question Text</label>
            <textarea
              className="form-control"
              required
              rows={3}
              placeholder="Enter technical question..."
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">4 Multiple Choice Options</label>
            {newQuestion.choices.map((c, idx) => (
              <input
                key={idx}
                type="text"
                required
                className="form-control"
                style={{ marginBottom: '8px' }}
                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                value={c}
                onChange={(e) => handleChoiceChange(idx, e.target.value)}
              />
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Correct Answer (Exact text of the correct choice)</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Copy/paste the exact text of the correct option..."
              value={newQuestion.correct_answer}
              onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Explanation</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Explain why this answer is correct..."
              value={newQuestion.explanation}
              onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            disabled={addingQ}
          >
            {addingQ ? 'Saving Question...' : 'Add Question to Bank'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FacultyDashboard;
