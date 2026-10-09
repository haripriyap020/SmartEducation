import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BrainCircuit,
  Compass,
  Code2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const StudentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [progress, setProgress] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [annRes, roadRes, progRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/learning-plan/me?subject=DBMS'),
        api.get('/progress/me?subject=DBMS')
      ]);
      setAnnouncements(annRes.data);
      setRoadmap(roadRes.data);
      setProgress(progRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (taskId) => {
    try {
      await api.post(`/learning-tasks/${taskId}/complete`);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your student learning dashboard..." />;

  const pendingRoadmap = roadmap.filter((r) => r.status !== 'completed');

  return (
    <div className="page-body">
      {/* Welcome Hero Banner */}
      <div className="hero-banner">
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
            <span>🎓 Academic Hub</span>
            <span>&bull;</span>
            <span>{user?.classroom ? `${user.classroom.class_name} (${user.classroom.section})` : 'Class Section'}</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '10px' }}>
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#c7d2fe', lineHeight: 1.6, marginBottom: '22px' }}>
            Your classroom tasks are synced with your personalized AI skill roadmap. Complete practice modules to close conceptual gaps in DBMS.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('quiz')} style={{ backgroundColor: '#ffffff', color: 'var(--primary)', fontWeight: 700 }}>
              <BrainCircuit size={16} />
              Take DBMS Diagnostic Quiz
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('practice')} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}>
              <Code2 size={16} />
              Interactive Practice
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="metric-val">
              {progress?.latest_score_percentage !== null ? `${progress.latest_score_percentage}%` : 'N/A'}
            </div>
            <div className="metric-lbl">Latest Diagnostic Score</div>
            {progress?.score_change_delta !== null && (
              <div className="metric-sub" style={{ color: progress.score_change_delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {progress.score_change_delta >= 0 ? `+${progress.score_change_delta}%` : `${progress.score_change_delta}%`} since initial test
              </div>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
            <Compass size={24} />
          </div>
          <div>
            <div className="metric-val">{pendingRoadmap.length}</div>
            <div className="metric-lbl">Active Roadmap Tasks</div>
            <div className="metric-sub" style={{ color: 'var(--slate-500)' }}>
              {roadmap.filter((r) => r.status === 'completed').length} completed
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--warning-light)', color: 'var(--warning-text)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="metric-val">{announcements.length}</div>
            <div className="metric-lbl">Approved Class Tasks</div>
            <div className="metric-sub" style={{ color: 'var(--warning-text)' }}>
              Verified by CR
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--success-light)', color: 'var(--success-text)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="metric-val">{progress?.practice_activities_completed || 0}</div>
            <div className="metric-lbl">Practice Questions Attempted</div>
            <div className="metric-sub" style={{ color: 'var(--success)' }}>
              Active Skill Building
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Announcements + Personalized Roadmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Approved Classroom Announcements Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              Classroom Academic Tasks
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('announcements')}>
              View All Feed <ArrowRight size={14} />
            </button>
          </div>

          {announcements.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--slate-400)' }}>
              No classroom announcements published yet for your section.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    background: 'var(--slate-50)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="primary">{ann.subject}</Badge>
                      <Badge variant="approved">Verified</Badge>
                    </div>
                    {ann.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--warning-text)' }}>
                        <Clock size={13} />
                        <span>Due: {ann.deadline}</span>
                      </div>
                    )}
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '6px' }}>
                    {ann.task_title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '10px' }}>
                    {ann.description}
                  </p>

                  {ann.resource_links && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--slate-500)' }}>Links:</span>
                      {ann.resource_links.split(',').map((url, i) => (
                        <a
                          key={i}
                          href={url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                        >
                          Resource {i + 1} <ExternalLink size={11} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized Roadmap Focus */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Compass size={18} style={{ color: 'var(--primary)' }} />
              Personalized Learning Path
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('roadmap')}>
              Manage Roadmap <ArrowRight size={14} />
            </button>
          </div>

          {roadmap.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginBottom: '14px' }}>
                No active learning roadmap generated yet. Take a diagnostic assessment to identify your weak topics!
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('quiz')}>
                <BrainCircuit size={14} /> Start Diagnostic Quiz
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roadmap.slice(0, 4).map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: isDone ? '1px solid #a7f3d0' : '1px solid var(--slate-200)',
                      backgroundColor: isDone ? '#f0fdf4' : 'white'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleTask(task.id)}
                      className="task-checkbox"
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Badge variant={task.difficulty_level || 'beginner'}>{task.topic}</Badge>
                        <span style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 600 }}>
                          ⏱️ ~{task.estimated_minutes} mins
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: isDone ? 'var(--slate-500)' : 'var(--slate-800)', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {task.objective}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
