import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Bell,
  Clock,
  CheckCircle2,
  ExternalLink,
  Filter,
  Languages,
  Calendar,
  AlertCircle
} from 'lucide-react';

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showTranslations, setShowTranslations] = useState({});

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const res = await api.get('/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        console.error('Error fetching announcements feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const toggleTranslation = (id) => {
    setShowTranslations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const subjects = ['All', ...new Set(announcements.map((a) => a.subject))];

  const filtered = selectedSubject === 'All'
    ? announcements
    : announcements.filter((a) => a.subject === selectedSubject);

  if (loading) return <LoadingSpinner message="Fetching classroom announcements..." />;

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Classroom Tasks & Notices
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Verified and approved academic announcements for {user?.classroom ? `${user.classroom.class_name} (${user.classroom.section})` : 'your class'}
          </p>
        </div>

        {/* Subject Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Filter:
          </span>
          {subjects.map((subj) => (
            <button
              key={subj}
              className={`btn btn-sm ${selectedSubject === subj ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedSubject(subj)}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate-400)' }}>
          <Bell size={40} style={{ margin: '0 auto 12px', color: 'var(--slate-300)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-700)' }}>No tasks found for this filter</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Check back later for new class updates from your CR.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((ann) => {
            const hasTranslation = !!ann.translated_text;
            const showingTranslated = showTranslations[ann.id];

            return (
              <div key={ann.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="primary">{ann.subject}</Badge>
                    <Badge variant="approved">Approved & Verified</Badge>
                    <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 500 }}>
                      Posted by {ann.creator_name}
                    </span>
                  </div>

                  {ann.deadline && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--warning-text)', background: 'var(--warning-light)', padding: '4px 10px', borderRadius: '8px' }}>
                      <Clock size={14} />
                      <span>Deadline: {ann.deadline}</span>
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
                  {ann.task_title}
                </h3>

                <p style={{ fontSize: '14px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
                  {showingTranslated ? ann.translated_text : ann.description}
                </p>

                {hasTranslation && (
                  <div style={{ marginBottom: '14px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleTranslation(ann.id)}
                      style={{ fontSize: '12px', gap: '6px' }}
                    >
                      <Languages size={14} style={{ color: 'var(--primary)' }} />
                      {showingTranslated ? 'View Original Language' : 'View English Translation'}
                    </button>
                  </div>
                )}

                {ann.resource_links && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--slate-100)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)' }}>
                      Reference Links:
                    </span>
                    {ann.resource_links.split(',').map((url, i) => (
                      <a
                        key={i}
                        href={url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '12px', gap: '4px', color: 'var(--primary)' }}
                      >
                        <span>Resource {i + 1}</span>
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
