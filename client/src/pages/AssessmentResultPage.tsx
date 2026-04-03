import { Link, useLocation } from 'react-router-dom';

interface SkillResult { skill: string; level: string; strengths: string[]; improvements: string[]; }
interface ResultData { overallLevel: string; skillBreakdown: SkillResult[]; }

const SKILL_ICONS: Record<string, string> = { grammar: '📝', reading: '📖', listening: '🎧', speaking: '🗣️' };

export default function AssessmentResultPage() {
  const location = useLocation();
  const data = location.state as ResultData | null;

  if (!data) {
    return (
      <div className="page">
        <div style={cardStyle}>
          <p style={{ color: '#555' }}>No assessment results found.</p>
          <Link to="/assessment" style={{ color: '#2563eb', textDecoration: 'none' }}>Take the assessment</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={cardStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Your Level: {data.overallLevel}</h1>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '2rem' }}>Here's your breakdown by skill</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {data.skillBreakdown.map(s => (
            <div key={s.skill} style={skillCard}>
              <div style={{ fontSize: '1.5rem' }}>{SKILL_ICONS[s.skill] || '📚'}</div>
              <h3 style={{ margin: '0.25rem 0', textTransform: 'capitalize' }}>{s.skill}</h3>
              <span style={levelBadge}>{s.level}</span>
              {s.strengths.length > 0 && <p style={{ fontSize: '0.8rem', color: '#16a34a', margin: '0.5rem 0 0' }}>Strengths: {s.strengths.join(', ')}</p>}
              {s.improvements.length > 0 && <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '0.25rem 0 0' }}>Improve: {s.improvements.join(', ')}</p>}
            </div>
          ))}
        </div>
        <Link to="/dashboard" style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none' }}>Go to Dashboard</Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '700px', margin: '2rem auto' };
const skillCard: React.CSSProperties = { padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' };
const levelBadge: React.CSSProperties = { background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.9rem' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 };
