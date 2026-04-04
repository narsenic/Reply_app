import { Link, useLocation } from 'react-router-dom';

interface SkillResult { skill: string; level: string; strengths: string[]; improvements: string[]; }
interface ResultData { overallLevel: string; skillBreakdown: SkillResult[]; }

const SKILL_ICONS: Record<string, string> = { grammar: '📝', reading: '📖', listening: '🎧', speaking: '🗣️' };
const SKILL_COLORS: Record<string, string> = { grammar: '#F0EDFF', reading: '#E8F5E9', listening: '#FFF8E1', speaking: '#FCE4EC' };

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AssessmentResultPage() {
  const location = useLocation();
  const data = location.state as ResultData | null;

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' as const }}>
            <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>No assessment results found.</p>
            <Link to="/assessment" style={{ color: '#6C5CE7', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Take the assessment →</Link>
          </div>
        </div>
      </div>
    );
  }

  const levelIndex = LEVEL_ORDER.indexOf(data.overallLevel);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '1.5rem' }}>
      <div style={{ maxWidth: 680, margin: '2rem auto' }}>
        {/* Celebration header */}
        <div style={celebrationCardStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.35rem' }}>Assessment Complete!</h1>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.75rem' }}>Here's how you did across all skills</p>
          <div style={levelDisplayStyle}>
            <span style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Your Level</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 700, color: '#6C5CE7' }}>{data.overallLevel}</span>
          </div>
          {/* Level progress bar */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1.5rem', justifyContent: 'center' }}>
            {LEVEL_ORDER.map((lvl, i) => (
              <div key={lvl} style={{ textAlign: 'center' as const }}>
                <div style={{ width: 44, height: 6, borderRadius: 3, background: i <= levelIndex ? '#6C5CE7' : '#f0f0f0', marginBottom: '0.35rem' }} />
                <span style={{ fontSize: '0.7rem', color: i <= levelIndex ? '#6C5CE7' : '#ccc', fontWeight: i === levelIndex ? 700 : 500 }}>{lvl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill breakdown */}
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '1rem', marginTop: '2rem' }}>Skill Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {data.skillBreakdown.map(s => (
            <div key={s.skill} style={skillCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: SKILL_COLORS[s.skill] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{SKILL_ICONS[s.skill] || '📚'}</div>
                <div>
                  <h3 style={{ margin: 0, textTransform: 'capitalize' as const, fontSize: '0.95rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#1a1a1a' }}>{s.skill}</h3>
                  <span style={skillLevelBadge}>{s.level}</span>
                </div>
              </div>
              {s.strengths.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Strengths</span>
                  <p style={{ fontSize: '0.82rem', color: '#2E7D32', margin: '0.2rem 0 0', lineHeight: 1.5 }}>{s.strengths.join(', ')}</p>
                </div>
              )}
              {s.improvements.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>To improve</span>
                  <p style={{ fontSize: '0.82rem', color: '#E65100', margin: '0.2rem 0 0', lineHeight: 1.5 }}>{s.improvements.join(', ')}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link to="/dashboard" style={ctaBtnStyle}>Start Learning →</Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '2.5rem 2rem', border: '1px solid #f0f0f0', maxWidth: 400, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' };
const celebrationCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '2.5rem 2rem', border: '1px solid #f0f0f0', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', textAlign: 'center' as const };
const levelDisplayStyle: React.CSSProperties = { display: 'inline-block', background: '#F8F7FF', borderRadius: 16, padding: '1rem 2rem', border: '2px solid #E8E4FF' };
const skillCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '1.25rem', border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const skillLevelBadge: React.CSSProperties = { background: '#F0EDFF', color: '#6C5CE7', padding: '0.1rem 0.5rem', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem' };
const ctaBtnStyle: React.CSSProperties = { display: 'block', textAlign: 'center' as const, width: '100%', padding: '0.85rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 14, fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(108,92,231,0.2)' };
