import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import CRDashboard from './pages/CRDashboard';
import AnnouncementsPage from './pages/AnnouncementsPage';
import DiagnosticQuizPage from './pages/DiagnosticQuizPage';
import QuizResultPage from './pages/QuizResultPage';
import LearningRoadmapPage from './pages/LearningRoadmapPage';
import PracticePage from './pages/PracticePage';
import ProgressTrackerPage from './pages/ProgressTrackerPage';
import FacultyDashboard from './pages/FacultyDashboard';

import api from './api';
import './App.css';

const MainLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quizResult, setQuizResult] = useState(null);
  const [pendingNoticeCount, setPendingNoticeCount] = useState(0);

  // Set appropriate default tab on role switch
  useEffect(() => {
    if (user?.role === 'cr') {
      setActiveTab('cr-studio');
    } else if (user?.role === 'faculty') {
      setActiveTab('faculty');
    } else {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  // Fetch pending notice count for CR badge
  const checkPendingCount = async () => {
    if (user?.role === 'cr' || user?.role === 'faculty') {
      try {
        const res = await api.get('/announcements/pending');
        setPendingNoticeCount(res.data.length);
      } catch (err) {
        console.error('Failed to get pending notice count:', err);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkPendingCount();
    }
  }, [isAuthenticated, user?.role, activeTab]);

  if (loading) {
    return <LoadingSpinner message="Initializing ClassConnectAI Platform..." />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleQuizCompleted = (resultData) => {
    setQuizResult(resultData);
    setActiveTab('quiz-result');
  };

  const getPageTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Student Overview Dashboard';
      case 'cr-studio': return 'CR Notice Verification Studio';
      case 'announcements': return 'Classroom Tasks & Notices';
      case 'quiz': return 'DBMS Diagnostic Assessment';
      case 'quiz-result': return 'AI Skill Gap Analysis Results';
      case 'roadmap': return 'Personalized Learning Roadmap';
      case 'practice': return 'Interactive Practice Arena';
      case 'progress': return 'Skill Analytics & Improvement Tracker';
      case 'faculty': return 'Faculty Administration Portal';
      case 'faculty-questions': return 'DBMS Question Bank Manager';
      default: return 'ClassConnectAI';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingNoticeCount}
      />

      <div className="main-content">
        <Navbar activeTab={activeTab} title={getPageTitle(activeTab)} />

        {activeTab === 'dashboard' && (
          <StudentDashboard onNavigate={setActiveTab} />
        )}

        {activeTab === 'cr-studio' && (
          <CRDashboard onAnnouncementPublished={checkPendingCount} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsPage />
        )}

        {activeTab === 'quiz' && (
          <DiagnosticQuizPage onQuizCompleted={handleQuizCompleted} />
        )}

        {activeTab === 'quiz-result' && (
          <QuizResultPage
            result={quizResult}
            onRetakeQuiz={() => setActiveTab('quiz')}
            onNavigateToRoadmap={() => setActiveTab('roadmap')}
            onNavigateToPractice={() => setActiveTab('practice')}
          />
        )}

        {activeTab === 'roadmap' && (
          <LearningRoadmapPage
            onNavigateToPractice={() => setActiveTab('practice')}
            onNavigateToQuiz={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'practice' && (
          <PracticePage />
        )}

        {activeTab === 'progress' && (
          <ProgressTrackerPage onNavigateToQuiz={() => setActiveTab('quiz')} />
        )}

        {(activeTab === 'faculty' || activeTab === 'faculty-questions') && (
          <FacultyDashboard />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
