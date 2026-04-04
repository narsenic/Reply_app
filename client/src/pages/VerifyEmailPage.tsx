import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }
    apiClient.post('/api/auth/verify-email', { token })
      .then(() => { setStatus('success'); setMessage('Email verified successfully!'); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.'); });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={card}>
        <div style={{ textAlign: 'center' }}>
          <div style={logo}>💬</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", marginTop: '0.75rem', fontSize: '1.4rem', color: '#1a1a1a', marginBottom: '1.25rem' }}>Email Verification</h1>

          {status === 'loading' && (
            <div style={{ padding: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
              <p style={{ color: '#999', fontSize: '0.9rem' }}>Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ padding: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
              <p style={{ color: '#2E7D32', fontSize: '0.9rem', fontWeight: 500 }}>{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ padding: '0.5rem 0' }}>
              <div className="error-display"><p>{message}</p></div>
            </div>
          )}

          <Link to="/login" style={{ ...btn, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>Go to Login</Link>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '2rem', border: '1px solid #eee', maxWidth: 400, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' };
const logo: React.CSSProperties = { width: 48, height: 48, borderRadius: 14, background: '#6C5CE7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' };
const btn: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 };
