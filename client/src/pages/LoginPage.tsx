import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="page">
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={logoCircle}>Lë</div>
          <h1 style={{ marginTop: '0.75rem', fontSize: '1.5rem' }}>Welcome back</h1>
          <p style={{ color: '#78716c', fontSize: '0.9rem' }}>Log in to continue learning</p>
        </div>
        {error && <div className="error-display"><p>{error}</p></div>}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} /></label>
          <label style={labelStyle}>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password" style={inputStyle} /></label>
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Logging in...' : 'Log in'}</button>
        </form>
        <div style={linksStyle}>
          <Link to="/register" style={linkStyle}>Create account</Link>
          <Link to="/forgot-password" style={linkStyle}>Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #e7e5e4', maxWidth: '420px', margin: '3rem auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' };
const logoCircle: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #58cc02, #46a302)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#57534e', fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '0.65rem 0.75rem', borderRadius: '10px', border: '2px solid #e7e5e4', fontSize: '1rem' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', background: '#58cc02', color: '#fff', border: '2px solid #46a302', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' };
const linksStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem' };
const linkStyle: React.CSSProperties = { color: '#58cc02', textDecoration: 'none', fontWeight: 600 };
