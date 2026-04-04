import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

const paths = [
  {
    key: 'sproochentest',
    title: 'Sproochentest Preparation',
    icon: '🎓',
    description: 'Prepare for the official Luxembourgish language test. Structured exercises matching the exam format with oral production and listening comprehension practice.',
    features: ['Exam-format exercises', 'Timed practice sessions', 'Mock exams with scoring', 'Topic cards by level'],
  },
  {
    key: 'daily_life',
    title: 'Daily Life Luxembourgish',
    icon: '🏡',
    description: 'Learn practical Luxembourgish for everyday situations. Conversations, shopping, work, and social interactions.',
    features: ['Everyday scenarios', 'Practical vocabulary', 'Conversational practice', 'Cultural context'],
  },
] as const;

export default function PathSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (path: string) => {
    setSelected(path);
    setSaving(true);
    setError(null);
    try {
      await apiClient.put('/api/users/learning-path', { learningPath: path });
      navigate('/chapters');
    } catch {
      setError('Failed to set learning path. Please try again.');
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <nav style={navStyle}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={avatarStyle}>{user?.displayName?.[0]?.toUpperCase() || '?'}</div>
            <button onClick={handleLogout} style={logoutBtnStyle}>Log out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' as const }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>
          Choose Your Learning Path
        </h1>
        <p style={{ color: '#888', fontSize: '1rem', marginBottom: '2.5rem' }}>
          Pick the path that matches your goals. You can switch anytime.
        </p>

        {error && <div className="error-display" role="alert" style={{ marginBottom: '1.5rem' }}><p>{error}</p></div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {paths.map((p) => (
            <button
              key={p.key}
              onClick={() => handleSelect(p.key)}
              disabled={saving}
              style={{
                ...cardStyle,
                borderColor: selected === p.key ? '#6C5CE7' : '#f0f0f0',
                boxShadow: selected === p.key ? '0 0 0 3px rgba(108,92,231,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                opacity: saving && selected !== p.key ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{p.icon}</span>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>{p.title}</h2>
              <p style={{ color: '#666', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>{p.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: '0.82rem', color: '#888', padding: '0.2rem 0' }}>✓ {f}</li>
                ))}
              </ul>
              {saving && selected === p.key && (
                <p style={{ color: '#6C5CE7', fontSize: '0.85rem', marginTop: '1rem', fontWeight: 600 }}>Setting up...</p>
              )}
            </button>
          ))}
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
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtnStyle: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '2rem 1.5rem',
  cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.2s ease', width: '100%',
};
