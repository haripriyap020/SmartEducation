import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Sparkles, GraduationCap, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';

const AuthPage = () => {
  const { login, register, switchQuickDemo, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    class_id: ''
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data);
        if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, class_id: res.data[0].id }));
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password);
        if (!res.success) {
          setLocalError(res.error);
        }
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          class_id: formData.role !== 'faculty' ? parseInt(formData.class_id) || null : null
        };
        const res = await register(payload);
        if (!res.success) {
          setLocalError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--slate-50)' }}>
      {/* Left Showcase Banner */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e40af 100%)',
          color: 'white',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div className="brand-icon" style={{ width: '48px', height: '48px' }}>
              <Sparkles size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>ClassConnect<span style={{ color: '#818cf8' }}>AI</span></h1>
              <p style={{ fontSize: '13px', color: '#c7d2fe', fontWeight: 600 }}>Smart Education & Skill Platform</p>
            </div>
          </div>

          <div style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.25, marginBottom: '18px' }}>
              Transform Classroom Notices into Personalized Skill Mastery.
            </h2>
            <p style={{ fontSize: '15px', color: '#e0e7ff', lineHeight: 1.6, marginBottom: '32px' }}>
              Go beyond simple announcements. Identify weak concepts with diagnostic AI analyzers, follow custom roadmaps, and practice with instant feedback.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '20px' }}>📢</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Smart Classroom Assistant</h4>
                  <p style={{ fontSize: '12px', color: '#c7d2fe' }}>Telugu/multilingual extraction with CR verification</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>AI Skill Gap Analyzer</h4>
                  <p style={{ fontSize: '12px', color: '#c7d2fe' }}>DBMS diagnostic quizzes across 5 core topics</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px' }}>
                <span style={{ fontSize: '20px' }}>📈</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Measurable Improvement Tracking</h4>
                  <p style={{ fontSize: '12px', color: '#c7d2fe' }}>Real score deltas and topic mastery visualizers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#a5b4fc' }}>
          ClassConnectAI Platform &copy; 2026 &bull; Designed for College & Hackathon Demonstrations
        </div>
      </div>

      {/* Right Login / Register Box */}
      <div
        style={{
          width: '520px',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            {isLogin ? 'Sign in to ClassConnectAI' : 'Create your Account'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '4px' }}>
            {isLogin ? 'Choose an account or select a 1-click demo role below' : 'Fill in your details to get started'}
          </p>
        </div>

        {/* 1-Click Demo Logins for Fast Demonstration */}
        <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-600)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ 1-Click Quick Demo Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => switchQuickDemo('student')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 6px', height: 'auto' }}
            >
              <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Student</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => switchQuickDemo('cr')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 6px', height: 'auto' }}
            >
              <ShieldCheck size={18} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700 }}>CR (Verifier)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => switchQuickDemo('faculty')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 6px', height: 'auto' }}
            >
              <BookOpen size={18} style={{ color: '#7e22ce' }} />
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Faculty</span>
            </button>
          </div>
        </div>

        {(error || localError) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger-light)', color: 'var(--danger-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '18px', border: '1px solid #fecaca' }}>
            <AlertCircle size={16} />
            <span>{error || localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                required
                className="form-control"
                placeholder="e.g. Haripriya"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="form-control"
              placeholder="name@classconnect.ai"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
                  <option value="student">Student</option>
                  <option value="cr">Class Representative (CR)</option>
                  <option value="faculty">Faculty / Admin</option>
                </select>
              </div>

              {formData.role !== 'faculty' && (
                <div className="form-group">
                  <label className="form-label">Select Classroom</label>
                  <select name="class_id" className="form-control" value={formData.class_id} onChange={handleChange}>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name} ({c.section}) - {c.academic_year}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setLocalError(null);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
