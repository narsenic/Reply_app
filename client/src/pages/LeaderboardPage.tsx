import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import type { LeaderboardResponse, LeaderboardEntry } from '../types/api';

type Period = 'weekly' | 'monthly' | 'all_time';
const PERIOD_LABELS: Record<Period, string> = { weekly: 'This Week', monthly: 'This Month', all_time: 'All Time' };

export default function LeaderboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('weekly');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get<LeaderboardResponse>('/api/leaderboard', { params: { period, limit: 50 } });
      setData(res.data);
    } catch { setError('Failed to load leaderboard.'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getRankStyle = (rank: number): React.CSSProperties => {
    if (rank === 1) return { ...rankBadge, background: '#FFD700', color: '#1a1a1a' };
    if (rank === 2) return { ...rankBadge, background: '#C0C0C0', color: '#1a1a1a' };
    if (rank === 3) return { ...rankBadge, background: '#CD7F32', color: '#fff' };
    return { ...rankBadge, background: '#f5f5f5', color: '#888' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <nav style={navStyle}>
        <div style={navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Logo />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <Link to="/dashboard" style={navTab}>Dashboard</Link>
              <Link to="/chapters" style={navTab}>Chapters</Link>
              <Link to="/leaderboard" style={navTabActive}>Leaderboard</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={avatarStyle}>{user?.displayName?.[0]?.toUpperCase() || '?'}</div>
            <button onClick={handleLogout} style={logoutBtn}>Log out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>🏅 Leaderboard</h1>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem' }}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ ...tabBtn, background: period === p ? '#6C5CE7' : '#fff', color: period === p ? '#fff' : '#888', borderColor: period === p ? '#6C5CE7' : '#eee' }}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: '#999' }}>Loading...</p>}
        {error && <div className="error-display" role="alert"><p>{error}</p></div>}

        {data && (
          <>
            {/* User rank */}
            {data.userRank && (
              <div style={{ ...card, borderColor: '#6C5CE7', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Your Rank</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: '#6C5CE7' }}>#{data.userRank.rank}</span>
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>{data.userRank.totalXp.toLocaleString()} XP</span>
                </div>
              </div>
            )}

            {/* Entries */}
            <div style={card}>
              {data.entries.length === 0 && <p style={{ color: '#999', fontSize: '0.88rem' }}>No entries yet for this period.</p>}
              {data.entries.map((entry: LeaderboardEntry) => {
                const isMe = entry.userId === user?.id;
                return (
                  <div key={entry.userId} style={{ ...entryRow, background: isMe ? '#F8F7FF' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={getRankStyle(entry.rank)}>{entry.rank}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a1a' }}>
                          {entry.displayName} {isMe && <span style={{ color: '#6C5CE7', fontSize: '0.78rem' }}>(you)</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>
                          🔥 {entry.currentStreak}d · 🏆 {entry.badgeCount}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#6C5CE7', fontSize: '0.95rem' }}>{entry.totalXp.toLocaleString()} XP</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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
const tabBtn: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: 10, border: '1.5px solid #eee', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const entryRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.5rem', borderBottom: '1px solid #fafafa', borderRadius: 10 };
const rankBadge: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 };
