import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, displayName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="page">
        <div style={cardStyle}>
          <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>Check Your Email</h1>
          <p style={{ textAlign: 'center', color: '#555' }}>We sent a verification link to <strong>{email}</strong>. Please verify your email, then log in.</p>
          <Link to="/login" style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Register</h1>
        {error && <div className="error-display"><p>{error}</p></div>}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Display Name<input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required style={inputStyle} /></label>
          <label style={labelStyle}>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} /></label>
          <label style={labelStyle}>Password (min 8 characters)<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} /></label>
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>Already have an account? <Link to="/login" style={linkStyle}>Login</Link></p>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '400px', margin: '2rem auto' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#555', fontWeight: 500 };
const inputStyle: React.CSSProperties = { padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' };
const linkStyle: React.CSSProperties = { color: '#2563eb', textDecoration: 'none' };
