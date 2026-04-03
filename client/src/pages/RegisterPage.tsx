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
      const msg = err?.message || err?.details?.email || 'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #e7e5e4', maxWidth: '400px', margin: '3rem auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#57534e', fontWeight: 600 };
const inputStyle: React.CSSProperties = { padding: '0.65rem 0.75rem', borderRadius: '10px', border: '2px solid #e7e5e4', fontSize: '1rem', transition: 'border-color 0.15s' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', background: '#58cc02', color: '#fff', border: '2px solid #46a302', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' };
const linkStyle: React.CSSProperties = { color: '#58cc02', textDecoration: 'none', fontWeight: 600 };
