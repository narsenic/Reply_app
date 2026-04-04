import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import type { ChapterSummary, ChapterListResponse } from '../types/api';

const SKILL_COLORS: Record<string, string> = { grammar: '#6C5CE7', reading: '#00B894', listening: '#FDCB6E', speaking: '#E17055' };
const SKILL_LABELS: Record<string, string> = { grammar: 'Grammar', reading: 'Reading', listening: 'Listening', speaking: 'Speaking' };

function ProgressRing({ percent, color, size = 36 }: { percent: number; color: string; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
    </svg>
  );
}

export default function ChapterMapPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ChapterListResponse>('/api/chapters', { params: { level: 'A1', path: 'daily_life' } });
      setChapters(res.data.chapters);
    } catch { setError('Failed to load chapters.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <nav style={navStyle}>
        <div style={navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Logo />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <Link to="/dashboard" style={navTab}>Dashboard</Link>
              <Link to="/chapters" style={navTabActive}>Chapters</Link>
              <Link to="/leaderboard" style={navTab}>Leaderboard</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={avatarStyle}>{user?.displayName?.[0]?.toUpperCase() || '?'}</div>
            <button onClick={handleLogout} style={logoutBtn}>Log out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Chapter Map</h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.92rem' }}>Complete each chapter to unlock the next one.</p>

        {loading && <p style={{ color: '#999' }}>Loading chapters...</p>}
        {error && <div className="error-display" role="alert"><p>{error}</p></div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {chapters.map((ch) => {
            const isCompleted = ch.status === 'completed';
            return (
              <div
                key={ch.id}
                onClick={() => navigate(`/chapters/${ch.id}`)}
                style={{ ...chapterCard, cursor: 'pointer',
                  borderColor: isCompleted ? '#00B894' : '#6C5CE7' }}
                role="button" tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isCompleted ? '#E8F5E9' : '#F0EDFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: isCompleted ? '#00B894' : '#6C5CE7', flexShrink: 0 }}>
                    {isCompleted ? 'OK' : ch.orderIndex + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>{ch.title}</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#888' }}>{ch.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {(['grammar', 'reading', 'listening', 'speaking'] as const).map((skill) => (
                    <div key={skill} style={{ textAlign: 'center' as const }} title={`${SKILL_LABELS[skill]}: ${ch.progress[skill]}%`}>
                      <ProgressRing percent={ch.progress[skill]} color={SKILL_COLORS[skill]} />
                      <div style={{ fontSize: '0.65rem', color: '#999', marginTop: 2 }}>{SKILL_LABELS[skill][0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '0.85rem' }}>💬</span>
    </div>
    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Reply</span>
  </Link>
);

const navStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', position: 'sticky', top: 0, zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navTab: React.CSSProperties = { textDecoration: 'none', color: '#999', fontSize: '0.88rem', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: 10 };
const navTabActive: React.CSSProperties = { ...navTab, color: '#6C5CE7', background: '#F0EDFF', fontWeight: 600 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtn: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const chapterCard: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem',
  background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '1.25rem 1.5rem',
  transition: 'all 0.2s ease', flexWrap: 'wrap',
};
