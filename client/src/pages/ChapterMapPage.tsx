import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import ReplyLogo from '../components/ReplyLogo';
import type { ChapterSummary, ChapterListResponse } from '../types/api';

const SKILL_COLORS: Record<string, string> = { grammar: '#6C5CE7', reading: '#00B894', listening: '#FDCB6E', speaking: '#E17055' };
const SKILL_LABELS: Record<string, string> = { grammar: 'Grammar', reading: 'Reading', listening: 'Listening', speaking: 'Speaking' };
const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const LEVEL_COLORS: Record<string, string> = { A1: '#00B894', A2: '#6C5CE7', B1: '#E17055', B2: '#D63031' };

function ProgressRing({ percent, color, size = 32 }: { percent: number; color: string; size?: number }) {
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
  const [allChapters, setAllChapters] = useState<Record<string, ChapterSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<'daily_life' | 'sproochentest'>('daily_life');
  const [expandedLevel, setExpandedLevel] = useState<string>('A1');

  const fetchChapters = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const results: Record<string, ChapterSummary[]> = {};
      for (const level of LEVELS) {
        try {
          const res = await apiClient.get<ChapterListResponse>('/api/chapters', { params: { level, path } });
          if (res.data.chapters.length > 0) results[level] = res.data.chapters;
        } catch { /* level may have no chapters */ }
      }
      setAllChapters(results);
    } catch { setError('Failed to load chapters.'); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <nav style={navStyle}>
        <div style={navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ReplyLogo showText size={32} />
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
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Chapters</h1>

        {/* Path toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', background: '#E9ECEF', borderRadius: 10, padding: 3, width: 'fit-content' }}>
          <button onClick={() => setPath('daily_life')}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: path === 'daily_life' ? '#fff' : 'transparent', color: path === 'daily_life' ? '#6C5CE7' : '#888',
              boxShadow: path === 'daily_life' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Daily Life
          </button>
          <button onClick={() => setPath('sproochentest')}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: path === 'sproochentest' ? '#fff' : 'transparent', color: path === 'sproochentest' ? '#6C5CE7' : '#888',
              boxShadow: path === 'sproochentest' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Sproochentest
          </button>
        </div>

        {loading && <p style={{ color: '#999' }}>Loading chapters...</p>}
        {error && <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 12, padding: '1rem', color: '#D63031', marginBottom: '1rem' }}>{error}</div>}

        {!loading && Object.keys(allChapters).length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No chapters available for {path === 'sproochentest' ? 'Sproochentest' : 'Daily Life'} yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Check back soon or switch paths above.</p>
          </div>
        )}

        {/* Level groups */}
        {LEVELS.map((level) => {
          const chapters = allChapters[level];
          if (!chapters || chapters.length === 0) return null;
          const isExpanded = expandedLevel === level;
          const completedCount = chapters.filter(c => c.status === 'completed').length;
          const levelColor = LEVEL_COLORS[level] || '#6C5CE7';

          return (
            <div key={level} style={{ marginBottom: '1.25rem' }}>
              {/* Level header */}
              <button onClick={() => setExpandedLevel(isExpanded ? '' : level)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.25rem', background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: isExpanded ? '14px 14px 0 0' : 14,
                  cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: levelColor + '15', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', color: levelColor }}>
                    {level}
                  </div>
                  <div style={{ textAlign: 'left' as const }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>Level {level}</div>
                    <div style={{ fontSize: '0.78rem', color: '#999' }}>{chapters.length} chapters · {completedCount} completed</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Overall progress bar */}
                  <div style={{ width: 100, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${chapters.length > 0 ? (completedCount / chapters.length) * 100 : 0}%`, height: '100%', background: levelColor, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '1rem', color: '#999', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>v</span>
                </div>
              </button>

              {/* Chapter list */}
              {isExpanded && (
                <div style={{ border: '1.5px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
                  {chapters.map((ch) => {
                    const isCompleted = ch.status === 'completed';
                    return (
                      <div key={ch.id} onClick={() => navigate(`/chapters/${ch.id}`)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                          padding: '1rem 1.25rem', background: '#fff', borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer', transition: 'background 0.15s', flexWrap: 'wrap' as const }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: isCompleted ? '#E8F5E9' : '#F0EDFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700,
                            color: isCompleted ? '#00B894' : '#6C5CE7', flexShrink: 0 }}>
                            {isCompleted ? 'OK' : ch.orderIndex + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>{ch.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#999' }}>{ch.description}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          {(['grammar', 'reading', 'listening', 'speaking'] as const).map((skill) => (
                            <div key={skill} style={{ textAlign: 'center' as const }} title={`${SKILL_LABELS[skill]}: ${ch.progress[skill]}%`}>
                              <ProgressRing percent={ch.progress[skill]} color={SKILL_COLORS[skill]} size={28} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', position: 'sticky', top: 0, zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navTab: React.CSSProperties = { textDecoration: 'none', color: '#999', fontSize: '0.88rem', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: 10 };
const navTabActive: React.CSSProperties = { ...navTab, color: '#6C5CE7', background: '#F0EDFF', fontWeight: 600 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtn: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
