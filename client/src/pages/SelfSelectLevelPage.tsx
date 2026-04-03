import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const LEVEL_DESC: Record<string, string> = {
  A1: 'Beginner — basic phrases and expressions',
  A2: 'Elementary — simple everyday situations',
  B1: 'Intermediate — main points of familiar topics',
  B2: 'Upper Intermediate — complex texts and discussions',
  C1: 'Advanced — fluent and spontaneous expression',
  C2: 'Mastery — near-native proficiency',
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
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '0.5rem' }}>Select Your Level</h1>
        <p style={{ color: '#555', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Choose the CEFR level that best matches your Luxembourgish ability.</p>
        {error && <div className="error-display"><p>{error}</p></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {LEVELS.map(level => (
            <button key={level} onClick={() => setSelected(level)}
              style={{ ...optStyle, ...(selected === level ? selStyle : {}) }}>
              <strong>{level}</strong> <span style={{ color: '#666', fontSize: '0.85rem' }}>— {LEVEL_DESC[level]}</span>
            </button>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={!selected || loading} style={btnStyle}>{loading ? 'Saving...' : 'Confirm Level'}</button>
        <Link to="/assessment" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>← Take the full assessment instead</Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '500px', margin: '2rem auto' };
const optStyle: React.CSSProperties = { padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', textAlign: 'left' as const };
const selStyle: React.CSSProperties = { borderColor: '#2563eb', background: '#eff6ff' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 };
