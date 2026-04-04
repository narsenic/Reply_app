import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import type { ChapterDetailResponse } from '../types/api';

const SKILL_ICONS: Record<string, string> = { grammar: '📝', reading: '📖', listening: '🎧', speaking: '🗣️' };
const SKILL_LABELS: Record<string, string> = { grammar: 'Grammar', reading: 'Reading', listening: 'Listening', speaking: 'Speaking' };

export default function ChapterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ChapterDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChapter = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get<ChapterDetailResponse>(`/api/chapters/${id}`);
      setChapter(res.data);
    } catch { setError('Failed to load chapter details.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchChapter(); }, [fetchChapter]);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#999' }}>Loading chapter...</p></div>;
  if (error || !chapter) return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center' as const }}>
        <div className="error-display" role="alert"><p>{error || 'Chapter not found'}</p></div>
        <button onClick={() => navigate('/chapters')} style={primaryBtn}>Back to Chapters</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <nav style={navStyle}>
        <div style={navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Logo />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <Link to="/dashboard" style={navTab}>Dashboard</Link>
              <Link to="/chapters" style={navTabActive}>Chapters</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={avatarStyle}>{user?.displayName?.[0]?.toUpperCase() || '?'}</div>
            <button onClick={handleLogout} style={logoutBtn}>Log out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <button onClick={() => navigate('/chapters')} style={{ background: 'none', border: 'none', color: '#6C5CE7', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500, marginBottom: '1rem', padding: 0 }}>← Back to Chapters</button>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{chapter.title}</h1>
        <p style={{ color: '#888', fontSize: '0.92rem', marginBottom: '2rem' }}>{chapter.description}</p>

        {/* Skill sections */}
        {chapter.sections.map((section) => (
          <div key={section.skill} style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{SKILL_ICONS[section.skill]}</span> {SKILL_LABELS[section.skill]}
              </h2>
              <span style={badgeStyle}>{section.completedCount}/{section.totalCount} done</span>
            </div>
            <div style={progressBarContainer}>
              <div style={{ ...progressBarFill, width: `${section.totalCount > 0 ? (section.completedCount / section.totalCount) * 100 : 0}%` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
              {section.lessons.map((lesson) => (
                <Link key={lesson.id} to={`/lessons/${lesson.id}`} style={lessonRow}>
                  <span style={{ color: lesson.completed ? '#00B894' : '#ccc', marginRight: '0.5rem' }}>{lesson.completed ? '✓' : '○'}</span>
                  {lesson.title}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Speaking prompts */}
        {chapter.speakingPrompts.length > 0 && (
          <div style={sectionCard}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700 }}>🎤 Speaking Prompts</h2>
            {chapter.speakingPrompts.map((p) => (
              <div key={p.id} style={promptCard}>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', fontWeight: 600 }}>{p.topic}</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>Difficulty: {p.difficulty} · Vocabulary: {p.suggestedVocabulary}</p>
              </div>
            ))}
          </div>
        )}

        {/* Shadowing exercises */}
        {chapter.shadowingExercises.length > 0 && (
          <div style={sectionCard}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700 }}>🔊 Shadowing Exercises</h2>
            {chapter.shadowingExercises.map((ex) => (
              <div key={ex.id} style={promptCard}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#1a1a1a' }}>{ex.transcript}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quiz button */}
        <div style={{ ...sectionCard, textAlign: 'center' as const }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 700 }}>📋 Chapter Quiz</h2>
          {chapter.quizPassed ? (
            <p style={{ color: '#00B894', fontWeight: 600, fontSize: '0.92rem' }}>✅ Quiz passed!</p>
          ) : chapter.quizUnlocked ? (
            <button onClick={() => navigate(`/chapters/${id}/quiz`)} style={primaryBtn}>Take Quiz</button>
          ) : (
            <p style={{ color: '#999', fontSize: '0.88rem' }}>🔒 Complete all sections to unlock the quiz</p>
          )}
        </div>
      </div>
    </div>
  );
}

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '0.85rem' }}>💬</span>
    </div>
    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Reply</span>
  </Link>
);

const navStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', position: 'sticky', top: 0, zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navTab: React.CSSProperties = { textDecoration: 'none', color: '#999', fontSize: '0.88rem', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: 10 };
const navTabActive: React.CSSProperties = { ...navTab, color: '#6C5CE7', background: '#F0EDFF', fontWeight: 600 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtn: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.5rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600 };
const sectionCard: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const badgeStyle: React.CSSProperties = { background: '#F0EDFF', color: '#6C5CE7', padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 };
const progressBarContainer: React.CSSProperties = { height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' };
const progressBarFill: React.CSSProperties = { height: '100%', background: 'linear-gradient(90deg, #6C5CE7, #A29BFE)', borderRadius: 3, transition: 'width 0.4s ease' };
const lessonRow: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 10, textDecoration: 'none', color: '#1a1a1a', fontSize: '0.88rem', transition: 'background 0.15s' };
const promptCard: React.CSSProperties = { padding: '0.75rem', border: '1px solid #f0f0f0', borderRadius: 12, marginBottom: '0.5rem' };
