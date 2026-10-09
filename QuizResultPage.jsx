import React, { useState } from 'react';
import api from '../api';
import Badge from '../components/Badge';
import {
  BrainCircuit,
  Compass,
  Code2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

const QuizResultPage = ({ result, onRetakeQuiz, onNavigateToRoadmap, onNavigateToPractice }) => {
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  if (!result) {
    return (
      <div className="page-body">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p>No assessment result available to display.</p>
          <button className="btn btn-primary" onClick={onRetakeQuiz} style={{ marginTop: '16px' }}>
            Take Diagnostic Quiz
          </button>
        </div>
      </div>
    );
  }

  const { score, total_questions, percentage, topic_breakdown, weak_topics, strong_topics, reviews } = result;

  const handleGenerateRoadmap = async () => {
    try {
      setGeneratingRoadmap(true);
      await api.post('/learning-plan/generate', {
        subject: result.subject || 'DBMS',
        attempt_id: result.attempt_id
      });
      if (onNavigateToRoadmap) onNavigateToRoadmap();
    } catch (err) {
      console.error('Error generating roadmap:', err);
      if (onNavigateToRoadmap) onNavigateToRoadmap();
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const getScoreColor = (pct) => {
    if (pct >= 70) return 'var(--success)';
    if (pct >= 50) return 'var(--warning-text)';
    return 'var(--danger)';
  };

  return (
    <div className="page-body">
      {/* Result Hero Summary Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e40af 100%)',
          color: 'white',
          padding: '36px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
              DBMS Diagnostic Analysis Complete
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            Diagnostic Assessment Results
          </h1>
          <p style={{ fontSize: '14px', color: '#c7d2fe', maxWidth: '520px' }}>
            {percentage >= 70
              ? 'Great foundational mastery! Continue with intermediate challenges to sustain retention.'
              : 'Skill gaps identified in specific topics. Follow your tailored AI roadmap to master weak concepts.'}
          </p>
        </div>

        {/* Big Score Circle Display */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 36px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1 }}>{percentage}%</div>
          <div style={{ fontSize: '14px', color: '#c7d2fe', fontWeight: 600, marginTop: '4px' }}>
            {score} / {total_questions} Correct
          </div>
        </div>
      </div>

      {/* CTA Action Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #eff6ff 100%)',
          border: '1.5px solid var(--primary-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            AI Skill Roadmap Ready for Your Needs
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '2px' }}>
            {weak_topics && weak_topics.length > 0
              ? `Recommended study milestones for: ${weak_topics.join(', ')}`
              : 'Roadmap tailored to reinforce key database concepts and practice challenges.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerateRoadmap}
            disabled={generatingRoadmap}
          >
            <Compass size={16} />
            {generatingRoadmap ? 'Generating Pathway...' : 'Generate Personalized Learning Roadmap'}
          </button>
          <button className="btn btn-secondary" onClick={onRetakeQuiz}>
            <RotateCcw size={16} /> Retake Assessment
          </button>
        </div>
      </div>

      {/* Topic-by-Topic Skill Gap Analysis Grid */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <BrainCircuit size={18} style={{ color: 'var(--primary)' }} />
            Topic-Wise Skill Gap Breakdown
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {topic_breakdown && topic_breakdown.map((item) => {
            const pct = item.percentage;
            return (
              <div
                key={item.topic}
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                  background: 'var(--slate-50)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.topic}</h4>
                  <Badge variant={item.status}>{item.status}</Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: getScoreColor(pct) }}>{pct}%</span>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>({item.correct}/{item.total} correct)</span>
                </div>

                {/* Accuracy progress bar */}
                <div style={{ height: '6px', background: 'var(--slate-200)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: pct >= 70 ? 'var(--success)' : (pct >= 50 ? 'var(--warning)' : 'var(--danger)')
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Question Review List with Explanations */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
            Question-by-Question Diagnostic Review
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews && reviews.map((rev, index) => (
            <div
              key={rev.question_id}
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: rev.is_correct ? '1px solid #a7f3d0' : '1px solid #fecaca',
                backgroundColor: rev.is_correct ? '#f0fdf4' : '#fef2f2'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)' }}>
                    Q{index + 1}.
                  </span>
                  <Badge variant="primary">{rev.topic}</Badge>
                </div>
                {rev.is_correct ? (
                  <Badge variant="strong" icon={CheckCircle2}>Correct</Badge>
                ) : (
                  <Badge variant="needs_practice" icon={XCircle}>Incorrect</Badge>
                )}
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '10px' }}>
                {rev.question_text}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'white', border: '1px solid var(--slate-200)' }}>
                  <strong>Your Answer:</strong> {rev.selected_answer || '(Unanswered)'}
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'white', border: '1px solid var(--slate-200)', color: 'var(--success-text)', fontWeight: 600 }}>
                  <strong>Correct Answer:</strong> {rev.correct_answer}
                </div>
              </div>

              {rev.explanation && (
                <div style={{ fontSize: '13px', background: 'rgba(255,255,255,0.7)', padding: '10px 14px', borderRadius: '6px', color: 'var(--slate-700)', lineHeight: 1.5 }}>
                  <strong>Concept Explanation:</strong> {rev.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;
