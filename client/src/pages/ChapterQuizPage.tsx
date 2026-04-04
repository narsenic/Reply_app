import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import type { ChapterQuizResponse, QuizResultResponse } from '../types/api';

export default function ChapterQuizPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<ChapterQuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  const fetchQuiz = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null); setResult(null); setAnswers({}); setCurrentQ(0);
    try {
      const res = await apiClient.get<ChapterQuizResponse>(`/api/chapters/${id}/quiz`);
      setQuiz(res.data);
    } catch { setError('Failed to load quiz. Make sure all sections are complete.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz || !id) return;
    setSubmitting(true); setError(null);
    try {
      const payload = { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) };
      const res = await apiClient.post<QuizResultResponse>(`/api/chapters/${id}/quiz/submit`, payload);
      setResult(res.data);
    } catch { setError('Failed to submit quiz.'); }
    finally { setSubmitting(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#999' }}>Loading quiz...</p></div>;

  // Results view
  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <Nav user={user} onLogout={handleLogout} />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' as const }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{result.passed ? '🎉' : '😔'}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {result.passed ? 'Quiz Passed!' : 'Not quite there yet'}
          </h1>
          <div style={{ ...scoreCircle, borderColor: result.passed ? '#00B894' : '#E17055' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: result.passed ? '#00B894' : '#E17055' }}>{result.score}%</span>
          </div>
          <p style={{ color: '#888', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            Attempt #{result.attempts} · Highest: {result.highestScore}% · Pass: 70%
          </p>

          {/* Skill breakdown */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>Skill Breakdown</h3>
            {result.breakdown.map((b) => (
              <div key={b.skill} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #fafafa', fontSize: '0.88rem' }}>
                <span style={{ color: '#555', textTransform: 'capitalize' as const }}>{b.skill}</span>
                <span style={{ fontWeight: 600 }}>{b.correct}/{b.total}</span>
              </div>
            ))}
          </div>

          {/* Incorrect answers */}
          {result.incorrectAnswers.length > 0 && (
            <div style={{ ...card, textAlign: 'left' as const }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>Review Mistakes</h3>
              {result.incorrectAnswers.map((ia) => (
                <div key={ia.questionId} style={{ padding: '0.75rem', border: '1px solid #ffebee', borderRadius: 12, marginBottom: '0.5rem', background: '#fffbfb' }}>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#C62828' }}>Your answer: {ia.userAnswer}</p>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#00B894' }}>Correct: {ia.correctAnswer}</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>{ia.explanation}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {!result.passed && <button onClick={fetchQuiz} style={primaryBtn}>Retake Quiz</button>}
            <button onClick={() => navigate(`/chapters/${id}`)} style={secondaryBtn}>Back to Chapter</button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz view
  if (error || !quiz) return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Nav user={user} onLogout={handleLogout} />
      <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center' as const }}>
        <div className="error-display" role="alert"><p>{error || 'Quiz not found'}</p></div>
        <button onClick={() => navigate(`/chapters/${id}`)} style={primaryBtn}>Back to Chapter</button>
      </div>
    </div>
  );

  const question = quiz.questions[currentQ];
  const totalQ = quiz.questions.length;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Nav user={user} onLogout={handleLogout} />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#888' }}>Question {currentQ + 1} of {totalQ}</span>
          <span style={skillBadge}>{question.skill}</span>
        </div>
        <div style={progressBarContainer}>
          <div style={{ ...progressBarFill, width: `${((currentQ + 1) / totalQ) * 100}%` }} />
        </div>

        {/* Question */}
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.78rem', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase' as const, fontWeight: 600 }}>{question.type.replace(/-/g, ' ')}</p>
          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '1.25rem' }}>{question.prompt}</p>

          {question.audioUrl && (
            <audio controls src={question.audioUrl} style={{ width: '100%', marginBottom: '1rem' }}>
              <track kind="captions" />
            </audio>
          )}

          {question.options ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {question.options.map((opt) => (
                <button key={opt} onClick={() => handleAnswer(question.id, opt)}
                  style={{ ...optionBtn, borderColor: answers[question.id] === opt ? '#6C5CE7' : '#f0f0f0',
                    background: answers[question.id] === opt ? '#F8F7FF' : '#fff', color: answers[question.id] === opt ? '#6C5CE7' : '#1a1a1a' }}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input type="text" placeholder="Type your answer..." value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              style={inputStyle} aria-label="Answer" />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0} style={currentQ === 0 ? disabledBtn : secondaryBtn}>← Previous</button>
          {currentQ < totalQ - 1 ? (
            <button onClick={() => setCurrentQ((p) => Math.min(totalQ - 1, p + 1))} style={primaryBtn}>Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={!allAnswered || submitting} style={!allAnswered || submitting ? disabledBtn : primaryBtn}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Nav({ user, onLogout }: { user: { displayName: string } | null; onLogout: () => void }) {
  return (
    <nav style={navStyle}>
      <div style={navInner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: '0.85rem' }}>💬</span>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Reply</span>
          </Link>
          <Link to="/chapters" style={navTab}>Chapters</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={avatarStyle}>{user?.displayName?.[0]?.toUpperCase() || '?'}</div>
          <button onClick={onLogout} style={logoutBtn}>Log out</button>
        </div>
      </div>
    </nav>
  );
}

const navStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', position: 'sticky', top: 0, zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navTab: React.CSSProperties = { textDecoration: 'none', color: '#999', fontSize: '0.88rem', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: 10 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtn: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.5rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600 };
const secondaryBtn: React.CSSProperties = { ...primaryBtn, background: '#fff', color: '#1a1a1a', border: '1.5px solid #eee' };
const disabledBtn: React.CSSProperties = { ...primaryBtn, background: '#ccc', cursor: 'not-allowed' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const scoreCircle: React.CSSProperties = { width: 100, height: 100, borderRadius: '50%', border: '4px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem auto' };
const skillBadge: React.CSSProperties = { background: '#F0EDFF', color: '#6C5CE7', padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' as const };
const progressBarContainer: React.CSSProperties = { height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' };
const progressBarFill: React.CSSProperties = { height: '100%', background: '#6C5CE7', borderRadius: 2, transition: 'width 0.3s ease' };
const optionBtn: React.CSSProperties = { padding: '0.75rem 1rem', border: '1.5px solid #f0f0f0', borderRadius: 12, background: '#fff', cursor: 'pointer', textAlign: 'left' as const, fontSize: '0.92rem', fontWeight: 500, transition: 'all 0.15s' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #eee', borderRadius: 12, fontSize: '0.92rem', boxSizing: 'border-box' as const };
