import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Question { id: string; skill: string; prompt: string; options: string[]; }

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startAssessment = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.post<{ assessmentId: string; questions: Question[] }>('/api/assessments/start');
      setAssessmentId(res.data.assessmentId);
      setQuestions(res.data.questions);
    } catch { setError('Failed to start assessment.'); }
    finally { setLoading(false); }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/assessments/${assessmentId}/submit`, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      });
      navigate('/assessment-result', { state: res.data });
    } catch { setError('Failed to submit assessment.'); }
    finally { setSubmitting(false); }
  };

  if (!assessmentId) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={startCardStyle}>
          <div style={{ textAlign: 'center' as const, marginBottom: '2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F0EDFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1.25rem' }}>🎯</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>Proficiency Assessment</h1>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>Take a quick assessment to determine your Luxembourgish level across all four skills.</p>
          </div>
          {error && <div className="error-display"><p>{error}</p></div>}
          <button onClick={startAssessment} disabled={loading} style={primaryBtnStyle}>{loading ? 'Starting...' : 'Start Assessment'}</button>
          <Link to="/self-select-level" style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem', color: '#6C5CE7', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>Or self-select your level →</Link>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '1.5rem' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Top progress */}
        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#999', fontWeight: 500 }}>Question {current + 1} of {questions.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#6C5CE7', fontWeight: 600 }}>{answeredCount}/{questions.length} answered</span>
        </div>
        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6C5CE7, #A29BFE)', borderRadius: 2, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>

        {/* Question card */}
        <div style={questionCardStyle}>
          <div style={{ display: 'inline-block', background: '#F0EDFF', color: '#6C5CE7', padding: '0.2rem 0.65rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem', textTransform: 'capitalize' as const }}>{q?.skill}</div>
          {q && (
            <>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '1.5rem', lineHeight: 1.5, fontFamily: "'Space Grotesk', sans-serif" }}>{q.prompt}</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', marginBottom: '2rem' }}>
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(q.id, opt)}
                    style={answers[q.id] === opt ? optSelectedStyle : optBtnStyle}>{opt}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={current === 0 ? navBtnDisabledStyle : navBtnStyle}>← Previous</button>
                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[q.id]} style={!answers[q.id] ? nextBtnDisabledStyle : nextBtnStyle}>Next →</button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting || answeredCount < questions.length} style={answeredCount < questions.length ? nextBtnDisabledStyle : nextBtnStyle}>
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                )}
              </div>
            </>
          )}
          {error && <div className="error-display" style={{ marginTop: '1rem' }}><p>{error}</p></div>}
        </div>
      </div>
    </div>
  );
}

const startCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '2.5rem 2rem', border: '1px solid #f0f0f0', maxWidth: 440, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' };
const primaryBtnStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 };
const questionCardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '2rem', border: '1px solid #f0f0f0', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' };
const optBtnStyle: React.CSSProperties = { padding: '0.85rem 1.15rem', border: '1.5px solid #f0f0f0', borderRadius: 14, background: '#fff', cursor: 'pointer', textAlign: 'left' as const, fontSize: '0.92rem', color: '#555', fontWeight: 500 };
const optSelectedStyle: React.CSSProperties = { ...optBtnStyle, borderColor: '#6C5CE7', background: '#F8F7FF', color: '#6C5CE7', fontWeight: 600 };
const navBtnStyle: React.CSSProperties = { padding: '0.55rem 1.15rem', background: '#fff', border: '1.5px solid #eee', borderRadius: 12, cursor: 'pointer', fontSize: '0.88rem', color: '#666', fontWeight: 500 };
const navBtnDisabledStyle: React.CSSProperties = { ...navBtnStyle, color: '#ccc', borderColor: '#f0f0f0', cursor: 'not-allowed' };
const nextBtnStyle: React.CSSProperties = { padding: '0.55rem 1.5rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 };
const nextBtnDisabledStyle: React.CSSProperties = { ...nextBtnStyle, background: '#ccc', cursor: 'not-allowed' };
