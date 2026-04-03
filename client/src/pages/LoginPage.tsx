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
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login</h1>
        {error && <div className="error-display"><p>{error}</p></div>}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          </label>
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div style={linksStyle}>
          <Link to="/register" style={linkStyle}>Create an account</Link>
          <Link to="/forgot-password" style={linkStyle}>Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '400px', margin: '2rem auto' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#555', fontWeight: 500 };
const inputStyle: React.CSSProperties = { padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' };
const linksStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem' };
const linkStyle: React.CSSProperties = { color: '#2563eb', textDecoration: 'none' };
