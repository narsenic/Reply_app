import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

interface SkillProgress {
  skill: string;
  level: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
}

interface DashboardData {
  currentLevel: string;
  targetLanguage: string;
  skills: SkillProgress[];
}

interface HistoryEntry {
  lessonId: string;
  lessonTitle: string;
  skill: string;
  score: number;
  completedAt: string;
}

interface HistoryData {
  entries: HistoryEntry[];
  total: number;
}

const SKILL_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
};

const SKILL_ICONS: Record<string, string> = {
  grammar: 'ðŸ“',
  reading: 'ðŸ“–',
  listening: 'ðŸŽ§',
  speaking: 'ðŸ—£ï¸',
};

const MODE_KEY = 'learningMode';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'solo' | 'group'>(() => {
    const stored = localStorage.getItem(MODE_KEY);
    return stored === 'group' ? 'group' : 'solo';
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, histRes] = await Promise.all([
        apiClient.get<DashboardData>('/api/progress/dashboard'),
        apiClient.get<HistoryData>('/api/progress/history', {
          params: { page: 1, limit: 10 },
        }),
      ]);
      setDashboard(dashRes.data);
      setHistory(histRes.data);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModeToggle = (newMode: 'solo' | 'group') => {
    setMode(newMode);
    localStorage.setItem(MODE_KEY, newMode);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page">
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-display" role="alert">
          <p>{error}</p>
        </div>
        <button onClick={fetchData} style={retryBtnStyle}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Navigation bar */}
      <nav style={navStyle}>
        <div style={navLeftStyle}>
          <Link to="/dashboard" style={navLinkActiveStyle}>Dashboard</Link>
          <Link to="/profile" style={navLinkStyle}>Profile</Link>
        </div>
        <div style={navRightStyle}>
          <span style={userNameStyle}>{user?.displayName}</span>
          <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
        </div>
      </nav>

      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Learning Dashboard</h1>
          {dashboard && (
            <p style={levelBadgeStyle}>
              Overall Level: <strong>{dashboard.currentLevel}</strong>
            </p>
          )}
        </div>

        {/* Learning mode toggle */}
        <div style={modeToggleContainerStyle}>
          <span style={{ fontSize: '0.875rem', color: '#555' }}>Mode:</span>
          <div style={toggleGroupStyle}>
            <button
              onClick={() => handleModeToggle('solo')}
              style={mode === 'solo' ? toggleActiveBtnStyle : toggleBtnStyle}
              aria-pressed={mode === 'solo'}
            >
              Solo
            </button>
            <button
              onClick={() => handleModeToggle('group')}
              style={mode === 'group' ? toggleActiveBtnStyle : toggleBtnStyle}
              aria-pressed={mode === 'group'}
            >
              Group
            </button>
          </div>
          {mode === 'group' && (
            <Link to="/group-session" style={groupLinkStyle}>
              Join Session â†’
            </Link>
          )}
        </div>
      </div>

      {/* Skill cards */}
      <div style={skillGridStyle}>
        {dashboard?.skills.map((skill) => (
          <div key={skill.skill} style={skillCardStyle}>
            <div style={skillCardHeaderStyle}>
              <span style={{ fontSize: '1.5rem' }}>{SKILL_ICONS[skill.skill] || 'ðŸ“š'}</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                {SKILL_LABELS[skill.skill] || skill.skill}
              </h3>
            </div>
            <p style={skillLevelStyle}>Level: {skill.level}</p>
            <div style={progressBarContainerStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${skill.percentComplete}%`,
                }}
                role="progressbar"
                aria-valuenow={skill.percentComplete}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${SKILL_LABELS[skill.skill] || skill.skill} progress`}
              />
            </div>
            <p style={progressTextStyle}>
              {skill.completedLessons}/{skill.totalLessons} lessons Â· {skill.percentComplete}%
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={quickActionsStyle}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={actionsGrid}>
          <Link to="/chapters" style={actionCard}><span style={{ fontSize: '1.5rem' }}>📚</span><div><strong style={{ display: 'block', color: '#1c1917' }}>Chapters</strong><span style={{ fontSize: '0.8rem', color: '#78716c' }}>Browse chapter-based lessons</span></div></Link><Link to="/sproochentest" style={actionCard}><span style={{ fontSize: '1.5rem' }}>🎓</span><div><strong style={{ display: 'block', color: '#1c1917' }}>Sproochentest Prep</strong><span style={{ fontSize: '0.8rem', color: '#78716c' }}>Citizenship exam practice</span></div></Link><Link to="/speaking/peer" style={actionCard}><span style={{ fontSize: '1.5rem' }}>🗣️</span><div><strong style={{ display: 'block', color: '#1c1917' }}>Peer Practice</strong><span style={{ fontSize: '0.8rem', color: '#78716c' }}>Find a speaking partner</span></div></Link><Link to="/leaderboard" style={actionCard}><span style={{ fontSize: '1.5rem' }}>🏆</span><div><strong style={{ display: 'block', color: '#1c1917' }}>Leaderboard</strong><span style={{ fontSize: '0.8rem', color: '#78716c' }}>See top learners</span></div></Link><Link to="/path-selection" style={actionCard}><span style={{ fontSize: '1.5rem' }}>🛤️</span><div><strong style={{ display: 'block', color: '#1c1917' }}>Learning Path</strong><span style={{ fontSize: '0.8rem', color: '#78716c' }}>Sproochentest or Daily Life</span></div></Link><Link to="/assessment" style={actionCard}>
            <span style={{ fontSize: '1.5rem' }}>ðŸŽ¯</span>
            <div>
              <strong style={{ display: 'block', color: '#1c1917' }}>Take Assessment</strong>
              <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Test your Luxembourgish level</span>
            </div>
          </Link>
          <Link to="/self-select-level" style={actionCard}>
            <span style={{ fontSize: '1.5rem' }}>ðŸ“Š</span>
            <div>
              <strong style={{ display: 'block', color: '#1c1917' }}>Set Your Level</strong>
              <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Self-select A1â€“C2</span>
            </div>
          </Link>
          <Link to="/group-session" style={actionCard}>
            <span style={{ fontSize: '1.5rem' }}>ðŸ‘¥</span>
            <div>
              <strong style={{ display: 'block', color: '#1c1917' }}>Group Session</strong>
              <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Learn with others live</span>
            </div>
          </Link>
          <Link to="/profile" style={actionCard}>
            <span style={{ fontSize: '1.5rem' }}>âš™ï¸</span>
            <div>
              <strong style={{ display: 'block', color: '#1c1917' }}>Profile & Settings</strong>
              <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Switch language, retake test</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Lesson history */}
      <div style={historySectionStyle}>
        <h2 style={{ marginBottom: '1rem' }}>Lesson History</h2>
        {history && history.entries.length > 0 ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Lesson</th>
                <th style={thStyle}>Skill</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {history.entries.map((entry) => (
                <tr key={`${entry.lessonId}-${entry.completedAt}`}>
                  <td style={tdStyle}>
                    <Link to={`/lessons/${entry.lessonId}`} style={lessonLinkStyle}>
                      {entry.lessonTitle}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    {SKILL_LABELS[entry.skill] || entry.skill}
                  </td>
                  <td style={tdStyle}>{entry.score}%</td>
                  <td style={tdStyle}>
                    {new Date(entry.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888' }}>No lessons completed yet. Start learning!</p>
        )}
      </div>
    </div>
  );
}

/* ---- Inline styles ---- */

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 0',
  borderBottom: '1px solid #e0e0e0',
  marginBottom: '1.5rem',
};

const navLeftStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
};

const navRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#555',
  fontWeight: 500,
};

const navLinkActiveStyle: React.CSSProperties = {
  ...navLinkStyle,
  color: '#2563eb',
  fontWeight: 600,
};

const userNameStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#666',
};

const logoutBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '0.35rem 0.75rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: '#555',
};

const retryBtnStyle: React.CSSProperties = {
  display: 'block',
  margin: '1rem auto',
  padding: '0.5rem 1.5rem',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const levelBadgeStyle: React.CSSProperties = {
  marginTop: '0.25rem',
  color: '#555',
  fontSize: '0.95rem',
};

const modeToggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const toggleGroupStyle: React.CSSProperties = {
  display: 'flex',
  border: '1px solid #ccc',
  borderRadius: '6px',
  overflow: 'hidden',
};

const toggleBtnStyle: React.CSSProperties = {
  padding: '0.4rem 1rem',
  border: 'none',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: '#555',
};

const toggleActiveBtnStyle: React.CSSProperties = {
  ...toggleBtnStyle,
  background: '#2563eb',
  color: '#fff',
  fontWeight: 600,
};

const groupLinkStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
};

const skillGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem',
};

const skillCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1.25rem',
  border: '1px solid #e5e7eb',
};

const skillCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const skillLevelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666',
  marginBottom: '0.75rem',
};

const progressBarContainerStyle: React.CSSProperties = {
  height: '8px',
  background: '#e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  background: '#2563eb',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
};

const progressTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#888',
  marginTop: '0.5rem',
};

const historySectionStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  border: '1px solid #e5e7eb',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  borderBottom: '2px solid #e5e7eb',
  fontSize: '0.85rem',
  color: '#555',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '0.9rem',
};

const lessonLinkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
};

const quickActionsStyle: React.CSSProperties = {
  marginBottom: '2rem',
};

const actionsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '0.75rem',
};

const actionCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem',
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e7e5e4',
  textDecoration: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

