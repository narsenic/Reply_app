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
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>Email Verification</h1>
        {status === 'loading' && <p style={{ textAlign: 'center', color: '#666' }}>Verifying...</p>}
        {status === 'success' && <p style={{ textAlign: 'center', color: '#16a34a' }}>{message}</p>}
        {status === 'error' && <div className="error-display"><p>{message}</p></div>}
        <Link to="/login" style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>Go to Login</Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '400px', margin: '2rem auto' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 };
