import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const LEVEL_DATA: Record<string, { label: string; desc: string; color: string }> = {
  A1: { label: 'Beginner', desc: 'Basic phrases and everyday expressions', color: '#E8F5E9' },
  A2: { label: 'Elementary', desc: 'Simple everyday situations and routines', color: '#E8F5E9' },
  B1: { label: 'Intermediate', desc: 'Main points of familiar topics', color: '#FFF8E1' },
  B2: { label: 'Upper Intermediate', desc: 'Complex texts and discussions', color: '#FFF8E1' },
  C1: { label: 'Advanced', desc: 'Fluent and spontaneous expression', color: '#F0EDFF' },
  C2: { label: 'Mastery', desc: 'Near-native proficiency', color: '#F0EDFF' },
};

export default function SelfSelectLevelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selected || !user) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.put(`/api/users/${user.id}/proficiency`, { level: selected });
      navigate('/assessment-result', { state: res.data });
    } catch { setError('Failed to set level.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' as const, marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F0EDFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>📊</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.4rem' }}>Select Your Level</h1>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>Choose the CEFR level that best matches your ability</p>
        </div>
        {error && <div className="error-display"><p>{error}</p></div>}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', marginBottom: '1.75rem' }}>
          {LEVELS.map(level => {
            const d = LEVEL_DATA[level];
            const isSelected = selected === level;
            return (
              <button key={level} onClick={() => setSelected(level)}
                style={isSelected ? { ...levelBtnStyle, borderColor: '#6C5CE7', background: '#F8F7FF' } : levelBtnStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? '#F0EDFF' : d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#6C5CE7' : '#1a1a1a' }}>{level}</span>
                  </div>
                  <div style={{ textAlign: 'left' as const }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? '#6C5CE7' : '#1a1a1a', marginBottom: '0.1rem' }}>{d.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#999' }}>{d.desc}</div>
                  </div>
                </div>
                {isSelected && <span style={{ color: '#6C5CE7', fontSize: '1rem', flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <button onClick={handleSubmit} disabled={!selected || loading} style={!selected ? disabledBtnStyle : primaryBtnStyle}>{loading ? 'Saving...' : 'Confirm Level'}</button>
        <Link to="/assessment" style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem', color: '#6C5CE7', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>← Take the full assessment instead</Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '2rem', border: '1px solid #f0f0f0', maxWidth: 480, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' };
const levelBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', border: '1.5px solid #f0f0f0', borderRadius: 14, background: '#fff', cursor: 'pointer', width: '100%' };
const primaryBtnStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 };
const disabledBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#ccc', cursor: 'not-allowed' };
