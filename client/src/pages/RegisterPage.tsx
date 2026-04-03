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
    try {
      await register(email, password, displayName);
      // Auto-login after registration and go to assessment
      await login(email, password);
      navigate('/assessment');
    } catch (err: any) {
      const msg = err?.message || err?.details?.email || 'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="page">
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={logoCircle}>Lë</div>
          <h1 style={{ marginTop: '0.75rem', fontSize: '1.5rem' }}>Create your account</h1>
          <p style={{ color: '#78716c', fontSize: '0.9rem' }}>Start learning Luxembourgish today</p>
        </div>
        {error && <div className="error-display"><p>{error}</p></div>}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Display Name<input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name" style={inputStyle} /></label>
          <label style={labelStyle}>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} /></label>
          <label style={labelStyle}>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" style={inputStyle} /></label>
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Creating account...' : 'Get started — it\'s free'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#78716c' }}>Already have an account? <Link to="/login" style={linkStyle}>Log in</Link></p>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #e7e5e4', maxWidth: '420px', margin: '3rem auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' };
const logoCircle: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #58cc02, #46a302)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#57534e', fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '0.65rem 0.75rem', borderRadius: '10px', border: '2px solid #e7e5e4', fontSize: '1rem' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', background: '#58cc02', color: '#fff', border: '2px solid #46a302', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' };
const linkStyle: React.CSSProperties = { color: '#58cc02', textDecoration: 'none', fontWeight: 600 };
