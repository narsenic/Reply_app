import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import ReplyLogo from '../components/ReplyLogo';

interface SkillProgress {
  skill: string;
  level: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
}

interface LessonHistoryItem {
  id: string;
  title: string;
  skill: string;
  completedAt: string;
  score: number;
}

interface DashboardData {
  currentLevel: string;
  targetLanguage: string;
  skills: SkillProgress[];
  recentLessons?: LessonHistoryItem[];
}

const BRAND = '#6C5CE7';

const SKILL_CONFIG: Record<string, { letter: string; color: string; label: string }> = {
  grammar: { letter: 'G', color: '#6C5CE7', label: 'Grammar' },
  reading: { letter: 'R', color: '#00B894', label: 'Reading' },
  listening: { letter: 'L', color: '#0984E3', label: 'Listening' },
  speaking: { letter: 'S', color: '#E17055', label: 'Speaking' },
};

const QUICK_ACTIONS = [
  { label: 'Chapters', path: '/chapters', icon: 'CH', color: '#6C5CE7' },
  { label: 'Sproochentest', path: '/sproochentest', icon: 'SP', color: '#00B894' },
  { label: 'Peer Practice', path: '/speaking/peer', icon: 'PP', color: '#E17055' },
  { label: 'Leaderboard', path: '/leaderboard', icon: 'LB', color: '#FDCB6E' },
  { label: 'Study Planner', path: '/study-planner', icon: 'PL', color: '#00CEC9' },
  { label: 'Learning Path', path: '/path-selection', icon: 'LP', color: '#0984E3' },
  { label: 'Assessment', path: '/assessment', icon: 'AS', color: '#A29BFE' },
  { label: 'Group Session', path: '/group-session', icon: 'GS', color: '#FF7675' },
  { label: 'Profile', path: '/profile', icon: 'PR', color: '#636E72' },
];

const NAV_TABS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Chapters', path: '/chapters' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Profile', path: '/profile' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'solo' | 'group'>('solo');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<DashboardData>('/api/progress/dashboard');
      setDashboard(res.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleStartSkill = (skill: string) => {
    navigate(`/chapters?skill=${encodeURIComponent(skill)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#636E72', fontSize: '1.1rem' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' }}>
        <p style={{ color: '#D63031', fontSize: '1.1rem' }}>{error}</p>
        <button onClick={fetchDashboard} style={{ padding: '0.5rem 1.5rem', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.95rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const levelBadge = dashboard?.currentLevel || 'A1';
  const skills = dashboard?.skills || [];
  const recentLessons = dashboard?.recentLessons || [];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Top Navigation */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E9ECEF', padding: '0 2rem', display: 'flex', alignItems: 'center', height: 64, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <ReplyLogo showText size={32} />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: tab.path === '/dashboard' ? 600 : 400,
                  color: tab.path === '/dashboard' ? BRAND : '#636E72',
                  background: tab.path === '/dashboard' ? '#F0EDFF' : 'transparent',
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: BRAND,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
            title={user?.displayName || 'User'}
            onClick={() => navigate('/profile')}
          >
            {(user?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.4rem 1rem',
              background: 'transparent',
              border: '1px solid #DFE6E9',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#636E72',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
              Welcome back, {user?.displayName || 'Learner'}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem 0.75rem',
                background: BRAND,
                color: '#fff',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {levelBadge}
            </span>
          </div>
          <p style={{ color: '#636E72', margin: 0, fontSize: '0.95rem' }}>
            Keep up the great work on your Luxembourgish journey.
          </p>
        </div>

        {/* Solo / Group Toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', background: '#E9ECEF', borderRadius: 10, padding: 3, width: 'fit-content' }}>
          <button
            onClick={() => setMode('solo')}
            style={{
              padding: '0.45rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: mode === 'solo' ? '#fff' : 'transparent',
              color: mode === 'solo' ? BRAND : '#636E72',
              boxShadow: mode === 'solo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Solo
          </button>
          <button
            onClick={() => setMode('group')}
            style={{
              padding: '0.45rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: mode === 'group' ? '#fff' : 'transparent',
              color: mode === 'group' ? BRAND : '#636E72',
              boxShadow: mode === 'group' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Group
          </button>
        </div>

        {/* Skill Cards */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1A1A2E', marginBottom: '1rem' }}>Your Skills</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {Object.entries(SKILL_CONFIG).map(([key, cfg]) => {
              const sp = skills.find((s) => s.skill === key);
              const pct = sp ? sp.percentComplete : 0;
              return (
                <div
                  key={key}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: '1.25rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: cfg.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      {cfg.letter}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '0.95rem' }}>{cfg.label}</div>
                      <div style={{ fontSize: '0.8rem', color: '#636E72' }}>
                        {sp ? `${sp.completedLessons}/${sp.totalLessons} lessons` : 'Not started'}
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: '#E9ECEF', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: cfg.color,
                        borderRadius: 6,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleStartSkill(key)}
                    style={{
                      marginTop: 'auto',
                      padding: '0.45rem 0',
                      background: cfg.color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {sp && sp.completedLessons > 0 ? 'Continue' : 'Start'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1A1A2E', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1.25rem 0.75rem',
                  background: '#fff',
                  borderRadius: 14,
                  textDecoration: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: action.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: action.color,
                  }}
                >
                  {action.icon}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1A1A2E', textAlign: 'center' }}>
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Lesson History */}
        <section>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1A1A2E', marginBottom: '1rem' }}>Lesson History</h2>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {recentLessons.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#636E72', fontSize: '0.9rem' }}>
                No lessons completed yet. Start a skill above to begin learning.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E9ECEF' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#636E72', textTransform: 'uppercase' as const }}>Lesson</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#636E72', textTransform: 'uppercase' as const }}>Skill</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#636E72', textTransform: 'uppercase' as const }}>Score</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#636E72', textTransform: 'uppercase' as const }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLessons.map((lesson) => (
                    <tr key={lesson.id} style={{ borderBottom: '1px solid #F1F3F5' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#1A1A2E' }}>{lesson.title}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.6rem',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: (SKILL_CONFIG[lesson.skill]?.color || '#636E72') + '18',
                          color: SKILL_CONFIG[lesson.skill]?.color || '#636E72',
                        }}>
                          {SKILL_CONFIG[lesson.skill]?.label || lesson.skill}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 600, color: lesson.score >= 80 ? '#00B894' : lesson.score >= 50 ? '#FDCB6E' : '#D63031' }}>
                        {lesson.score}%
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#636E72' }}>
                        {new Date(lesson.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}