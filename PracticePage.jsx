import React, { useState, useEffect } from 'react';
import api from '../api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Code2,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Filter,
  Lightbulb,
  BookOpen
} from 'lucide-react';

const PracticePage = () => {
  const [topic, setTopic] = useState('SQL Joins');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Explanation Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const topics = ['SQL Basics', 'SQL Joins', 'Keys and Constraints', 'Normalization', 'Transactions'];

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setSubmittedResult(null);
      setSelectedChoice('');
      setCurrentIndex(0);
      const diffParam = difficulty ? `&difficulty=${difficulty}` : '';
      const res = await api.get(`/practice/${encodeURIComponent(topic)}?subject=DBMS${diffParam}`);
      setQuestions(res.data);
    } catch (err) {
      console.error('Error fetching practice questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [topic, difficulty]);

  const handleSubmitAnswer = async () => {
    if (!selectedChoice) return;
    const currentQ = questions[currentIndex];
    setSubmitting(true);

    try {
      const res = await api.post('/practice/submit', {
        question_id: currentQ.id,
        selected_answer: selectedChoice
      });
      setSubmittedResult(res.data);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplainAI = async () => {
    const currentQ = questions[currentIndex];
    setShowAiModal(true);
    setLoadingAi(true);

    try {
      const res = await api.post('/ai/explain-answer', {
        question_id: currentQ.id,
        selected_answer: selectedChoice || '(None selected)'
      });
      setAiExplanation(res.data);
    } catch (err) {
      console.error('AI Explanation failed:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleNextQuestion = () => {
    setSubmittedResult(null);
    setSelectedChoice('');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleRetry = () => {
    setSubmittedResult(null);
    setSelectedChoice('');
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Interactive Practice Arena
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Strengthen your conceptual knowledge with instant AI feedback and explanations.
          </p>
        </div>

        {/* Difficulty Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)' }}>Difficulty:</span>
          {['', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              className={`btn btn-sm ${difficulty === lvl ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDifficulty(lvl)}
              style={{ textTransform: 'capitalize' }}
            >
              {lvl === '' ? 'All Levels' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {topics.map((t) => (
          <button
            key={t}
            className={`btn ${topic === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTopic(t)}
            style={{ fontWeight: 700, fontSize: '13px' }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message={`Fetching practice questions for ${topic}...`} />
      ) : !currentQ ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ color: 'var(--slate-500)' }}>No practice questions found for this topic and difficulty filter.</p>
        </div>
      ) : (
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Question Counter & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="primary">{currentQ.topic}</Badge>
              <Badge variant={currentQ.difficulty}>{currentQ.difficulty}</Badge>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Challenge {currentIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Question Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="question-text" style={{ fontSize: '17px' }}>
              {currentQ.question_text}
            </h3>

            <div className="choices-list">
              {currentQ.choices.map((choice, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedChoice === choice;

                // After submit highlighting
                let extraClass = '';
                if (submittedResult) {
                  if (choice === submittedResult.correct_answer) {
                    extraClass = 'border-success-highlight';
                  } else if (isSelected && !submittedResult.is_correct) {
                    extraClass = 'border-danger-highlight';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`choice-btn ${isSelected ? 'selected' : ''} ${extraClass}`}
                    onClick={() => !submittedResult && setSelectedChoice(choice)}
                    disabled={!!submittedResult}
                    style={{
                      borderColor: submittedResult && choice === submittedResult.correct_answer ? '#10b981' : (submittedResult && isSelected && !submittedResult.is_correct ? '#ef4444' : undefined),
                      backgroundColor: submittedResult && choice === submittedResult.correct_answer ? '#f0fdf4' : (submittedResult && isSelected && !submittedResult.is_correct ? '#fef2f2' : undefined)
                    }}
                  >
                    <span className="choice-letter">{letter}</span>
                    <span style={{ flex: 1 }}>{choice}</span>
                    {submittedResult && choice === submittedResult.correct_answer && (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    )}
                    {submittedResult && isSelected && !submittedResult.is_correct && (
                      <XCircle size={18} style={{ color: 'var(--danger)' }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Submission Result Feedback Banner */}
            {submittedResult && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  backgroundColor: submittedResult.is_correct ? 'var(--success-light)' : 'var(--danger-light)',
                  border: `1.5px solid ${submittedResult.is_correct ? '#a7f3d0' : '#fecaca'}`,
                  color: submittedResult.is_correct ? 'var(--success-text)' : 'var(--danger-text)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>
                  {submittedResult.is_correct ? (
                    <>
                      <CheckCircle2 size={18} /> Correct! Well Done.
                    </>
                  ) : (
                    <>
                      <XCircle size={18} /> Incorrect Answer
                    </>
                  )}
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '4px', color: 'var(--slate-700)' }}>
                  {submittedResult.explanation}
                </p>
                {submittedResult.hint && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--slate-600)', marginTop: '8px' }}>
                    <Lightbulb size={14} style={{ color: 'var(--warning-text)' }} />
                    <span><strong>Hint:</strong> {submittedResult.hint}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                {submittedResult && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleExplainAI}
                    style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #eff6ff 100%)', color: 'var(--primary)', borderColor: 'var(--primary-border)', fontWeight: 700 }}
                  >
                    <Sparkles size={14} /> ✨ Explain Concept with AI Tutor
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!submittedResult ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedChoice || submitting}
                  >
                    <CheckCircle2 size={16} />
                    {submitting ? 'Checking...' : 'Check Answer'}
                  </button>
                ) : (
                  <>
                    {!submittedResult.is_correct && (
                      <button className="btn btn-secondary" onClick={handleRetry}>
                        <RotateCcw size={16} /> Retry
                      </button>
                    )}
                    <button className="btn btn-primary" onClick={handleNextQuestion}>
                      Next Question <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Concept Explanation Modal */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="✨ AI Tutor Concept Breakdown"
        maxWidth="600px"
      >
        {loadingAi ? (
          <LoadingSpinner message="ClassConnect AI is synthesizing concept breakdown..." />
        ) : aiExplanation ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: aiExplanation.is_correct ? '#ecfdf5' : '#fffbeb',
                color: aiExplanation.is_correct ? '#065f46' : '#92400e',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              {aiExplanation.is_correct ? <CheckCircle2 size={18} /> : <Lightbulb size={18} />}
              <span>{aiExplanation.is_correct ? 'Concept Mastered!' : 'Key Takeaway for Retention'}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Concept Explanation
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--slate-800)', lineHeight: 1.6 }}>
                {aiExplanation.explanation}
              </p>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '14px', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <BookOpen size={14} /> Core Concept Takeaway
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--slate-700)', fontWeight: 600 }}>
                {aiExplanation.concept_summary}
              </p>
            </div>

            {aiExplanation.hint && (
              <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af' }}>
                <strong>Intuitive Tip:</strong> {aiExplanation.hint}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default PracticePage;
