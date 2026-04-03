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

interface LanguageItem {
  code: string;
  name: string;
  isDefault: boolean;
}

interface LanguageListResponse {
  languages: LanguageItem[];
}

const SKILL_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
};

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
    setLoading(true);
    setError(null);
    try {
      const [dashRes, langRes] = await Promise.all([
        apiClient.get<DashboardData>('/api/progress/dashboard'),
        apiClient.get<LanguageListResponse>('/api/languages'),
      ]);
      setDashboard(dashRes.data);
      setLanguages(langRes.data.languages);
      setSelectedLang(dashRes.data.targetLanguage);
    } catch {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLanguageSwitch = async () => {
    if (!user || !selectedLang || selectedLang === dashboard?.targetLanguage) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      await apiClient.put(`/api/users/${user.id}/target-language`, { languageCode: selectedLang });
      // Reload dashboard to reflect new language context
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to switch language.';
      setSwitchError(msg);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page">
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-display" role="alert"><p>{error}</p></div>
        <button onClick={fetchData} style={retryBtnStyle}>Retry</button>
      </div>
    );
  }

  const currentLangName = languages.find((l) => l.code === dashboard?.targetLanguage)?.name || dashboard?.targetLanguage;

  return (
    <div className="page">
      {/* Nav */}
      <nav style={navStyle}>
        <div style={navLeftStyle}>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link to="/profile" style={navLinkActiveStyle}>Profile</Link>
        </div>
        <div style={navRightStyle}>
          <span style={userNameStyle}>{user?.displayName}</span>
          <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
        </div>
      </nav>

      <h1 style={{ marginBottom: '1.5rem' }}>Profile &amp; Settings</h1>

      {/* User info card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Your Info</h2>
        <div style={infoRowStyle}>
          <span style={labelStyle}>Display Name</span>
          <span>{user?.displayName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={labelStyle}>Email</span>
          <span>{user?.email}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={labelStyle}>Current CEFR Level</span>
          <span style={levelBadgeStyle}>{dashboard?.currentLevel}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={labelStyle}>Target Language</span>
          <span>{currentLangName}</span>
        </div>
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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={selectStyle}
            aria-label="Target language"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <button
            onClick={handleLanguageSwitch}
            disabled={switching || selectedLang === dashboard?.targetLanguage}
            style={selectedLang === dashboard?.targetLanguage ? disabledBtnStyle : primaryBtnStyle}
          >
            {switching ? 'Switching...' : 'Switch Language'}
          </button>
        </div>
        {switchError && <p style={inlineErrorStyle}>{switchError}</p>}
      </div>

      {/* Retake assessment */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Retake Assessment</h2>
        <p style={mutedTextStyle}>Retake the proficiency assessment to update your CEFR level.</p>
        <button onClick={() => navigate('/assessment')} style={{ ...primaryBtnStyle, marginTop: '0.75rem' }}>
          Retake Assessment
        </button>
      </div>
    </div>
  );
}

/* ---- Inline styles ---- */

const navStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.75rem 0', borderBottom: '1px solid #e0e0e0', marginBottom: '1.5rem',
};
const navLeftStyle: React.CSSProperties = { display: 'flex', gap: '1.5rem' };
const navRightStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem' };
const navLinkStyle: React.CSSProperties = { textDecoration: 'none', color: '#555', fontWeight: 500 };
const navLinkActiveStyle: React.CSSProperties = { ...navLinkStyle, color: '#2563eb', fontWeight: 600 };
const userNameStyle: React.CSSProperties = { fontSize: '0.875rem', color: '#666' };
const logoutBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #ccc', borderRadius: '4px',
  padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: '#555',
};
const retryBtnStyle: React.CSSProperties = {
  display: 'block', margin: '1rem auto', padding: '0.5rem 1.5rem',
  background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
};

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
  padding: '1.25rem', marginBottom: '1.25rem',
};
const cardTitleStyle: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1.1rem' };

const infoRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
  borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem',
};
const labelStyle: React.CSSProperties = { color: '#555', fontWeight: 500 };
const levelBadgeStyle: React.CSSProperties = {
  background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.5rem',
  borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem',
};

const skillGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem',
};
const skillItemStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem',
  border: '1px solid #f0f0f0', borderRadius: '6px',
};

const selectStyle: React.CSSProperties = {
  padding: '0.45rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem',
};
const primaryBtnStyle: React.CSSProperties = {
  padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
};
const disabledBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle, background: '#94a3b8', cursor: 'not-allowed',
};

const inlineErrorStyle: React.CSSProperties = { color: '#dc2626', fontSize: '0.85rem', marginTop: '0.35rem' };
const mutedTextStyle: React.CSSProperties = { color: '#888', fontSize: '0.9rem', margin: 0 };
