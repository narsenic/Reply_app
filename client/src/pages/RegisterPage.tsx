import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try { await register(email, password, displayName); await login(email, password); navigate('/dashboard'); }
    catch (err: any) { setError(err?.message || err?.details?.email || 'Registration failed.'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={logo}>💬</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", marginTop: '0.75rem', fontSize: '1.4rem', color: '#1a1a1a' }}>Create your account</h1>
          <p style={{ color: '#999', fontSize: '0.88rem' }}>Start learning Luxembourgish today</p>
        </div>
        {error && <div className="error-display"><p>{error}</p></div>}
        <form onSubmit={handleSubmit}>
          <label style={lbl}>Name<input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name" style={inp} /></label>
          <label style={lbl}>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} /></label>
          <label style={lbl}>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" style={inp} /></label>
          <button type="submit" disabled={loading} style={btn}>{loading ? 'Creating...' : 'Get started free'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#999' }}>Already have an account? <Link to="/login" style={lnk}>Log in</Link></p>
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
