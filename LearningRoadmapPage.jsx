import React, { useState, useEffect } from 'react';
import api from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Code2,
  BrainCircuit,
  Clock,
  BookOpen,
  ArrowRight
} from 'lucide-react';

const LearningRoadmapPage = ({ onNavigateToPractice, onNavigateToQuiz }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/learning-plan/me?subject=DBMS');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to load learning roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.post(`/learning-tasks/${taskId}/complete`);
      setPlans((prev) =>
        prev.map((p) => (p.id === taskId ? res.data : p))
      );
    } catch (err) {
      console.error('Failed to toggle learning task:', err);
    }
  };

  const handleRegenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/learning-plan/generate', { subject: 'DBMS' });
      setPlans(res.data);
    } catch (err) {
      console.error('Error generating roadmap:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your personalized learning roadmap..." />;

  const completedCount = plans.filter((p) => p.status === 'completed').length;
  const totalTasks = plans.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Personalized Learning Roadmap
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Tailored study milestones and practice activities based on your DBMS skill gap analysis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRegenerate}
            disabled={generating}
          >
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            {generating ? 'Regenerating...' : 'Regenerate Path with AI'}
          </button>
          <button className="btn btn-primary" onClick={onNavigateToPractice}>
            <Code2 size={16} /> Enter Practice Arena
          </button>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Roadmap Progress Overview
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)' }}>
              {completedCount} of {totalTasks} milestones completed ({completionPercentage}%)
            </p>
          </div>
          <Badge variant={completionPercentage === 100 ? 'strong' : 'moderate'}>
            {completionPercentage === 100 ? 'All Completed 🎉' : 'In Progress'}
          </Badge>
        </div>

        <div style={{ height: '10px', backgroundColor: 'var(--slate-200)', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${completionPercentage}%`,
              background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Compass size={40} style={{ margin: '0 auto 12px', color: 'var(--slate-300)' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '6px' }}>
            No Roadmap Generated Yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', maxWidth: '440px', margin: '0 auto 20px' }}>
            Complete the DBMS Diagnostic Assessment to let the AI analyzer pinpoint your weak topics and generate your personalized study path.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToQuiz}>
            <BrainCircuit size={16} /> Take Diagnostic Quiz
          </button>
        </div>
      ) : (
        <div className="roadmap-timeline">
          {plans.map((task, index) => {
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`roadmap-card ${isCompleted ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleToggleTask(task.id)}
                  className="task-checkbox"
                  title="Click to mark milestone completed"
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                        Step {index + 1}
                      </span>
                      <Badge variant="primary">{task.topic}</Badge>
                      <Badge variant={task.difficulty_level}>{task.difficulty_level}</Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>
                      <Clock size={13} />
                      <span>~{task.estimated_minutes} mins</span>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: isCompleted ? 'var(--slate-600)' : 'var(--slate-900)',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      marginBottom: '6px'
                    }}
                  >
                    {task.objective}
                  </h3>

                  <p
                    style={{
                      fontSize: '14px',
                      color: isCompleted ? 'var(--slate-500)' : 'var(--slate-700)',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.5,
                      marginBottom: '12px'
                    }}
                  >
                    {task.recommended_activity}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {task.resource_url && (
                      <a
                        href={task.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--primary)', fontWeight: 600 }}
                      >
                        <BookOpen size={13} /> Study Reference Link <ExternalLink size={12} />
                      </a>
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={onNavigateToPractice}
                      style={{ color: 'var(--slate-700)' }}
                    >
                      <Code2 size={13} /> Practice {task.topic}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningRoadmapPage;
