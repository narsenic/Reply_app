import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch { setError('Failed to send reset email.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>Forgot Password</h1>
        {sent ? (
          <><p style={{ textAlign: 'center', color: '#555' }}>If an account with that email exists, a reset link has been sent.</p><Link to="/login" style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>Back to Login</Link></>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-display"><p>{error}</p></div>}
            <label style={labelStyle}>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} /></label>
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}><Link to="/login" style={linkStyle}>Back to Login</Link></p>
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
const linkStyle: React.CSSProperties = { color: '#2563eb', textDecoration: 'none' };
