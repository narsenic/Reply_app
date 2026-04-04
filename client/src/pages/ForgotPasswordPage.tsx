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
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={logo}>💬</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", marginTop: '0.75rem', fontSize: '1.4rem', color: '#1a1a1a' }}>Forgot password?</h1>
          <p style={{ color: '#999', fontSize: '0.88rem' }}>We'll send you a reset link</p>
        </div>
        {sent ? (
          <>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✉️</div>
              <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6 }}>If an account with that email exists, a reset link has been sent.</p>
            </div>
            <Link to="/login" style={{ ...btn, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}>Back to Login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-display"><p>{error}</p></div>}
            <label style={lbl}>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} /></label>
            <button type="submit" disabled={loading} style={btn}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#999' }}><Link to="/login" style={lnk}>← Back to Login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '2rem', border: '1px solid #eee', maxWidth: 400, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' };
const logo: React.CSSProperties = { width: 48, height: 48, borderRadius: 14, background: '#6C5CE7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' };
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#666', fontWeight: 600 };
const inp: React.CSSProperties = { padding: '0.6rem 0.75rem', borderRadius: 10, border: '1.5px solid #eee', fontSize: '0.95rem' };
const btn: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem' };
const lnk: React.CSSProperties = { color: '#6C5CE7', textDecoration: 'none', fontWeight: 600 };
