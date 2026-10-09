import React, { useState, useEffect } from 'react';
import api from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BrainCircuit,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const DiagnosticQuizPage = ({ onQuizCompleted }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { question_id: selectedChoiceText }
  const [submitting, setSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (quizStarted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quiz/questions?subject=DBMS&limit=10');
      setQuestions(res.data);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setTimerSeconds(0);
      setQuizStarted(true);
    } catch (err) {
      console.error('Failed to load quiz questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, choice) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choice
    }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${Object.keys(selectedAnswers).length} out of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_answer: selectedAnswers[q.id] || ''
      }));

      const res = await api.post('/quiz/submit', {
        subject: 'DBMS',
        answers: answersPayload
      });

      if (onQuizCompleted) {
        onQuizCompleted(res.data);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Generating DBMS Diagnostic Questions..." />;

  // Welcome / Start Screen
  if (!quizStarted) {
    return (
      <div className="page-body">
        <div className="quiz-container">
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div className="metric-icon-box" style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BrainCircuit size={32} />
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '10px' }}>
              DBMS Diagnostic Skill Assessment
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--slate-600)', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Test your foundational understanding of Database Management Systems. The AI analyzer will diagnose your strengths and pinpoint topics needing practice.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', maxWidth: '640px', margin: '0 auto 32px' }}>
              {['SQL Basics', 'SQL Joins', 'Keys and Constraints', 'Normalization', 'Transactions'].map((topic) => (
                <div key={topic} style={{ background: 'var(--slate-50)', padding: '10px', borderRadius: '8px', border: '1px solid var(--slate-200)', fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)' }}>
                  {topic}
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={startQuiz} style={{ padding: '14px 32px', fontSize: '16px' }}>
              <BrainCircuit size={18} />
              Start Diagnostic Quiz (10 Questions)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="page-body">
      <div className="quiz-container">
        {/* Progress Bar & Header */}
        <div className="quiz-header">
          <div>
            <div style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: 600 }}>
              Question {currentIndex + 1} of {questions.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Badge variant="primary">{currentQ.topic}</Badge>
              <Badge variant={currentQ.difficulty}>{currentQ.difficulty}</Badge>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'var(--slate-700)', background: 'var(--slate-100)', padding: '6px 14px', borderRadius: '20px' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
        </div>

        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Question Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="question-text">{currentQ.question_text}</h3>

          <div className="choices-list">
            {currentQ.choices.map((choice, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswers[currentQ.id] === choice;

              return (
                <button
                  key={idx}
                  type="button"
                  className={`choice-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQ.id, choice)}
                >
                  <span className="choice-letter">{letter}</span>
                  <span style={{ flex: 1 }}>{choice}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Question Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--slate-100)' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} /> Previous
            </button>

            <span style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: 600 }}>
              {answeredCount} / {questions.length} Answered
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleSubmitQuiz}
                disabled={submitting}
              >
                <CheckCircle2 size={16} />
                {submitting ? 'Evaluating...' : 'Submit Diagnostic'}
              </button>
            )}
          </div>
        </div>

        {/* Question Number Pills Navigation */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                  backgroundColor: isAnswered ? 'var(--primary-light)' : '#ffffff',
                  color: isAnswered ? 'var(--primary)' : 'var(--slate-600)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticQuizPage;
