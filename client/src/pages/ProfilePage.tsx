import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

interface SkillProgress {
  skill: string;
  level: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
}

interface DashboardData {
  currentLevel: string;
  targetLanguage: string;
  skills: SkillProgress[];
}

interface LanguageItem { code: string; name: string; isDefault: boolean; }
interface LanguageListResponse { languages: LanguageItem[]; }

const SKILL_LABELS: Record<string, string> = { grammar: 'Grammar', reading: 'Reading', listening: 'Listening', speaking: 'Speaking' };

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '0.85rem' }}>💬</span>
    </div>
    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Reply</span>
  </Link>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('');
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dashRes, langRes] = await Promise.all([
        apiClient.get<DashboardData>('/api/progress/dashboard'),
        apiClient.get<LanguageListResponse>('/api/languages'),
      ]);
      setDashboard(dashRes.data);
      setLanguages(langRes.data.languages);
      setSelectedLang(dashRes.data.targetLanguage);
    } catch { setError('Failed to load profile data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLanguageSwitch = async () => {
    if (!user || !selectedLang || selectedLang === dashboard?.targetLanguage) return;
    setSwitching(true); setSwitchError(null);
    try {
      await apiClient.put(`/api/users/${user.id}/target-language`, { languageCode: selectedLang });
      navigate('/dashboard');
    } catch (err: any) {
      setSwitchError(err?.response?.data?.message || 'Failed to switch language.');
    } finally { setSwitching(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999', fontSize: '0.95rem' }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.25rem', textAlign: 'center' as const }}>
          <div className="error-display" role="alert"><p>{error}</p></div>
          <button onClick={fetchData} style={retryBtnStyle}>Retry</button>
        </div>
      </div>
    );
  }

  const currentLangName = languages.find((l) => l.code === dashboard?.targetLanguage)?.name || dashboard?.targetLanguage;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Logo />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <Link to="/dashboard" style={navTabStyle}>Dashboard</Link>
              <Link to="/profile" style={navTabActiveStyle}>Profile</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={avatarStyle}>{user?.displayName?.[0]?.toUpperCase() || '?'}</div>
            <span style={{ fontSize: '0.88rem', color: '#1a1a1a', fontWeight: 500 }}>{user?.displayName}</span>
            <button onClick={handleLogout} style={logoutBtnStyle}>Log out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '2rem' }}>Profile & Settings</h1>

        {/* User info card */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Your Info</h2>
          <div style={infoRowStyle}><span style={labelStyle}>Display Name</span><span style={{ color: '#1a1a1a', fontWeight: 500 }}>{user?.displayName}</span></div>
          <div style={infoRowStyle}><span style={labelStyle}>Email</span><span style={{ color: '#1a1a1a', fontWeight: 500 }}>{user?.email}</span></div>
          <div style={infoRowStyle}><span style={labelStyle}>Current CEFR Level</span><span style={levelBadgeStyle}>{dashboard?.currentLevel}</span></div>
          <div style={{ ...infoRowStyle, borderBottom: 'none' }}><span style={labelStyle}>Target Language</span><span style={{ color: '#1a1a1a', fontWeight: 500 }}>{currentLangName}</span></div>
        </div>

        {/* Skill breakdown */}
        {dashboard && dashboard.skills.length > 0 && (
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Skill Levels</h2>
            <div style={skillGridStyle}>
              {dashboard.skills.map((s) => (
                <div key={s.skill} style={skillItemStyle}>
                  <span style={labelStyle}>{SKILL_LABELS[s.skill] || s.skill}</span>
                  <span style={levelBadgeStyle}>{s.level}</span>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginTop: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.percentComplete}%`, background: 'linear-gradient(90deg, #6C5CE7, #A29BFE)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={mutedTextStyle}>{s.percentComplete}% complete</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target language switcher */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Switch Target Language</h2>
          <p style={mutedTextStyle}>Switching language will reload your dashboard with progress for the selected language.</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' as const }}>
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={selectStyle} aria-label="Target language">
              {languages.map((l) => (<option key={l.code} value={l.code}>{l.name}</option>))}
            </select>
            <button onClick={handleLanguageSwitch} disabled={switching || selectedLang === dashboard?.targetLanguage}
              style={selectedLang === dashboard?.targetLanguage ? disabledBtnStyle : primaryBtnStyle}>
              {switching ? 'Switching...' : 'Switch Language'}
            </button>
          </div>
          {switchError && <p style={inlineErrorStyle}>{switchError}</p>}
        </div>

        {/* Retake assessment */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Retake Assessment</h2>
          <p style={mutedTextStyle}>Retake the proficiency assessment to update your CEFR level.</p>
          <button onClick={() => navigate('/assessment')} style={{ ...primaryBtnStyle, marginTop: '1rem' }}>Retake Assessment</button>
        </div>
      </div>
    </div>
  );
}

const navStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', position: 'sticky', top: 0, zIndex: 100 };
const navTabStyle: React.CSSProperties = { textDecoration: 'none', color: '#999', fontSize: '0.88rem', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: 10 };
const navTabActiveStyle: React.CSSProperties = { ...navTabStyle, color: '#6C5CE7', background: '#F0EDFF', fontWeight: 600 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtnStyle: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const retryBtnStyle: React.CSSProperties = { display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.75rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const cardTitleStyle: React.CSSProperties = { margin: '0 0 1rem', fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#1a1a1a' };
const infoRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #fafafa', fontSize: '0.9rem' };
const labelStyle: React.CSSProperties = { color: '#888', fontWeight: 500, fontSize: '0.88rem' };
const levelBadgeStyle: React.CSSProperties = { background: '#F0EDFF', color: '#6C5CE7', padding: '0.15rem 0.55rem', borderRadius: 6, fontWeight: 700, fontSize: '0.82rem' };
const skillGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' };
const skillItemStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem', border: '1px solid #f0f0f0', borderRadius: 12, background: '#fafafa' };
const selectStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: 10, border: '1.5px solid #eee', fontSize: '0.9rem', background: '#fff' };
const primaryBtnStyle: React.CSSProperties = { padding: '0.5rem 1.25rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 };
const disabledBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#ccc', cursor: 'not-allowed' };
const inlineErrorStyle: React.CSSProperties = { color: '#C62828', fontSize: '0.82rem', marginTop: '0.5rem' };
const mutedTextStyle: React.CSSProperties = { color: '#999', fontSize: '0.88rem', margin: 0 };
