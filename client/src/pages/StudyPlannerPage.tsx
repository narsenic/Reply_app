import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import ReplyLogo from '../components/ReplyLogo';

interface RecommendedChapter {
  id: string;
  title: string;
  description: string;
  level: string;
  orderIndex: number;
}

interface StudyEstimate {
  estimatedWeeks: number;
  dailyMinutes: number;
  totalHours: number;
  recommendedChapters: RecommendedChapter[];
  pace: string;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PACES = [
  { key: 'relaxed', label: 'Relaxed', desc: '15 min/day', color: '#00B894' },
  { key: 'regular', label: 'Regular', desc: '30 min/day', color: '#6C5CE7' },
  { key: 'intensive', label: 'Intensive', desc: '60 min/day', color: '#E17055' },
  { key: 'speed', label: 'Speed', desc: '90 min/day', color: '#D63031' },
];

const NAV_TABS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Chapters', path: '/chapters' },
  { label: 'Planner', path: '/study-planner' },
  { label: 'Profile', path: '/profile' },
];

export default function StudyPlannerPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentLevel, setCurrentLevel] = useState('A1');
  const [targetLevel, setTargetLevel] = useState('B1');
  const [pace, setPace] = useState('regular');
  const [estimate, setEstimate] = useState<StudyEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (LEVELS.indexOf(currentLevel) >= LEVELS.indexOf(targetLevel)) {
      setError('Target level must be higher than current level.');
      return;
    }
    setLoading(true); setError(null); setEstimate(null);
    try {
      const res = await apiClient.get<StudyEstimate>('/api/planner/estimate', {
        params: { currentLevel, targetLevel, pace },
      });
      setEstimate(res.data);
    } catch { setError('Failed to generate study plan.'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const paceInfo = PACES.find((p) => p.key === pace);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ReplyLogo showText size={32} />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {NAV_TABS.map((tab) => (
                <Link key={tab.path} to={tab.path}
                  style={tab.path === '/study-planner' ? navTabActive : navTab}>
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={avatarStyle}>{(user?.displayName || 'U')[0].toUpperCase()}</div>
            <button onClick={handleLogout} style={logoutBtn}>Log out</button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>
          Study Planner
        </h1>
        <p style={{ color: '#888', fontSize: '0.92rem', marginBottom: '2rem' }}>
          Set your goal and pace to get a personalized study plan.
        </p>

        {/* Level selectors */}
        <div style={cardStyle}>
          <h2 style={cardTitle}>Your Goal</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' as const, marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Current Level</label>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' as const }}>
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setCurrentLevel(l)}
                    style={currentLevel === l ? chipActive : chip}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Target Level</label>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' as const }}>
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setTargetLevel(l)}
                    style={targetLevel === l ? chipActive : chip}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Pace selector */}
          <label style={labelStyle}>Study Pace</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem', marginTop: '0.5rem' }}>
            {PACES.map((p) => (
              <button key={p.key} onClick={() => setPace(p.key)}
                style={{
                  padding: '0.75rem', borderRadius: 12, border: '1.5px solid',
                  borderColor: pace === p.key ? p.color : '#eee',
                  background: pace === p.key ? p.color + '12' : '#fff',
                  cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s',
                }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: pace === p.key ? p.color : '#1a1a1a' }}>{p.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>{p.desc}</div>
              </button>
            ))}
          </div>

          <button onClick={handleEstimate} disabled={loading}
            style={{ ...primaryBtn, marginTop: '1.5rem', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Calculating...' : 'Generate Study Plan'}
          </button>
          {error && <p style={{ color: '#D63031', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
        </div>

        {/* Results */}
        {estimate && (
          <>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)', color: '#fff', border: 'none' }}>
              <h2 style={{ ...cardTitle, color: '#fff' }}>Your Personalized Plan</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={statBox}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{estimate.estimatedWeeks}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>weeks</div>
                </div>
                <div style={statBox}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{estimate.dailyMinutes}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>min/day</div>
                </div>
                <div style={statBox}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{estimate.totalHours}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>total hours</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.9 }}>
                Pace: {paceInfo?.label} ({paceInfo?.desc})
              </div>
            </div>

            {estimate.recommendedChapters.length > 0 && (
              <div style={cardStyle}>
                <h2 style={cardTitle}>Recommended Chapters ({estimate.recommendedChapters.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {estimate.recommendedChapters.map((ch, i) => (
                    <div key={ch.id} onClick={() => navigate(`/chapters/${ch.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 12,
                        border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0EDFF', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#6C5CE7', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>{ch.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>{ch.description}</div>
                      </div>
                      <span style={{ background: '#F0EDFF', color: '#6C5CE7', padding: '0.15rem 0.5rem', borderRadius: 6,
                        fontSize: '0.72rem', fontWeight: 700 }}>{ch.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', position: 'sticky', top: 0, zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navTab: React.CSSProperties = { textDecoration: 'none', color: '#999', fontSize: '0.88rem', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: 10 };
const navTabActive: React.CSSProperties = { ...navTab, color: '#6C5CE7', background: '#F0EDFF', fontWeight: 600 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtn: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const cardTitle: React.CSSProperties = { margin: '0 0 1rem', fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#1a1a1a' };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#555', display: 'block' };
const chip: React.CSSProperties = { padding: '0.4rem 0.85rem', borderRadius: 10, border: '1.5px solid #eee', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#555' };
const chipActive: React.CSSProperties = { ...chip, borderColor: '#6C5CE7', background: '#F0EDFF', color: '#6C5CE7' };
const primaryBtn: React.CSSProperties = { padding: '0.7rem 1.5rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 };
const statBox: React.CSSProperties = { textAlign: 'center' as const };
