import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await apiClient.post('/api/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err: any) { setError(err.response?.data?.message || 'Reset failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>Reset Password</h1>
        {done ? (
          <><p style={{ textAlign: 'center', color: '#16a34a' }}>Password reset successfully.</p><Link to="/login" style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}>Go to Login</Link></>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-display"><p>{error}</p></div>}
            {!token && <div className="error-display"><p>Invalid or missing reset token.</p></div>}
            <label style={labelStyle}>New Password (min 8 characters)<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} /></label>
            <button type="submit" disabled={loading || !token} style={btnStyle}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '400px', margin: '2rem auto' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#555', fontWeight: 500 };
const inputStyle: React.CSSProperties = { padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 };
