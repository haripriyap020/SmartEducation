import React, { useState, useEffect } from 'react';
import api from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  TrendingUp,
  BrainCircuit,
  Compass,
  Code2,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const ProgressTrackerPage = ({ onNavigateToQuiz }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await api.get('/progress/me?subject=DBMS');
        setProgress(res.data);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating your skill improvement metrics..." />;

  const {
    total_quizzes_completed,
    latest_score_percentage,
    first_score_percentage,
    score_change_delta,
    topic_mastery,
    assessment_history,
    practice_activities_completed,
    active_learning_tasks_count,
    completed_learning_tasks_count,
    recommended_next_steps
  } = progress || {};

  // Format Recharts Line Data (Chronological: Attempt 1, Attempt 2, ...)
  const lineChartData = (assessment_history || [])
    .slice()
    .reverse()
    .map((item, idx) => ({
      name: `Quiz #${idx + 1}`,
      percentage: item.percentage,
      score: `${item.score}/${item.total_questions}`,
      date: new Date(item.created_at).toLocaleDateString()
    }));

  // Format Bar Chart Data for Topic Mastery
  const barChartData = (topic_mastery || []).map((tm) => ({
    topic: tm.topic,
    accuracy: tm.percentage,
    correct: tm.correct,
    total: tm.total,
    status: tm.status
  }));

  const getBarColor = (accuracy) => {
    if (accuracy >= 70) return '#10b981'; // Green
    if (accuracy >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Skill Improvement & Learning Analytics
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Data-driven tracking of your DBMS skill progression, score deltas, and concept retention.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNavigateToQuiz}>
          <BrainCircuit size={16} /> Take Reassessment Quiz
        </button>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="metric-val">
              {latest_score_percentage !== null && latest_score_percentage !== undefined ? `${latest_score_percentage}%` : 'N/A'}
            </div>
            <div className="metric-lbl">Latest Assessment Score</div>
            {score_change_delta !== null && score_change_delta !== undefined && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginTop: '4px',
                  color: score_change_delta >= 0 ? 'var(--success)' : 'var(--danger)'
                }}
              >
                {score_change_delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{score_change_delta >= 0 ? `+${score_change_delta}%` : `${score_change_delta}%`} Delta</span>
              </div>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="metric-val">{total_quizzes_completed || 0}</div>
            <div className="metric-lbl">Quizzes Completed</div>
            <div className="metric-sub" style={{ color: 'var(--slate-500)' }}>
              Initial: {first_score_percentage !== null ? `${first_score_percentage}%` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--success-light)', color: 'var(--success-text)' }}>
            <Code2 size={24} />
          </div>
          <div>
            <div className="metric-val">{practice_activities_completed || 0}</div>
            <div className="metric-lbl">Practice Questions Solved</div>
            <div className="metric-sub" style={{ color: 'var(--success)' }}>
              Interactive Practice
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Compass size={24} />
          </div>
          <div>
            <div className="metric-val">{completed_learning_tasks_count || 0}</div>
            <div className="metric-lbl">Roadmap Milestones Done</div>
            <div className="metric-sub" style={{ color: 'var(--slate-500)' }}>
              {active_learning_tasks_count || 0} tasks pending
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Delta Highlight Banner */}
      {score_change_delta !== null && score_change_delta > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div style={{ background: '#10b981', color: 'white', padding: '10px', borderRadius: '50%', display: 'flex' }}>
            <Award size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
              Measured Skill Progression: +{score_change_delta} Percentage Points Improvement!
            </h3>
            <p style={{ fontSize: '13px', color: '#047857', marginTop: '2px' }}>
              Your diagnostic performance improved from an initial score of <strong>{first_score_percentage}%</strong> to <strong>{latest_score_percentage}%</strong> after targeted practice and roadmap completion.
            </p>
          </div>
        </div>
      )}

      {/* Recharts Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Score Progression Trend Line Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              Assessment Score Progression
            </h3>
          </div>

          {lineChartData.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
              Take diagnostic assessments to generate your score trend chart.
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '13px'
                    }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--primary)', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Topic Mastery Distribution Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={18} style={{ color: 'var(--accent-blue)' }} />
              Topic-Wise Mastery Breakdown
            </h3>
          </div>

          {barChartData.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
              No topic data available yet.
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="topic" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '13px'
                    }}
                    formatter={(val, name, props) => [`${val}% (${props.payload.correct}/${props.payload.total} correct)`, 'Mastery']}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recommended Next Steps + Assessment History Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* Recommended Next Steps */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              AI Recommended Next Steps
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommended_next_steps && recommended_next_steps.map((rec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)'
                }}
              >
                <span style={{ fontSize: '18px' }}>🎯</span>
                <p style={{ fontSize: '13px', color: 'var(--slate-800)', fontWeight: 600, lineHeight: 1.5 }}>
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment History Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} style={{ color: 'var(--slate-700)' }} />
              Assessment Attempt History
            </h3>
          </div>

          {(!assessment_history || assessment_history.length === 0) ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
              No previous assessment records.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--slate-200)', textAlign: 'left', color: 'var(--slate-500)' }}>
                    <th style={{ padding: '10px 8px' }}>Attempt</th>
                    <th style={{ padding: '10px 8px' }}>Subject</th>
                    <th style={{ padding: '10px 8px' }}>Score</th>
                    <th style={{ padding: '10px 8px' }}>Accuracy</th>
                    <th style={{ padding: '10px 8px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment_history.map((att, idx) => (
                    <tr key={att.attempt_id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--slate-900)' }}>
                        #{assessment_history.length - idx}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge variant="primary">{att.subject}</Badge>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--slate-700)' }}>
                        {att.score} / {att.total_questions}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: att.percentage >= 70 ? 'var(--success)' : (att.percentage >= 50 ? 'var(--warning-text)' : 'var(--danger)') }}>
                        {att.percentage}%
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--slate-400)', fontSize: '12px' }}>
                        {new Date(att.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackerPage;
