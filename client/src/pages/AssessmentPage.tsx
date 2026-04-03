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
      <div className="page">
        <div style={cardStyle}>
          <h1 style={{ marginBottom: '1rem' }}>Proficiency Assessment</h1>
          <p style={{ color: '#555', marginBottom: '1.5rem' }}>Take a quick assessment to determine your Luxembourgish level, or self-select your level.</p>
          {error && <div className="error-display"><p>{error}</p></div>}
          <button onClick={startAssessment} disabled={loading} style={btnStyle}>{loading ? 'Starting...' : 'Start Assessment'}</button>
          <Link to="/self-select-level" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>Or self-select your level →</Link>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;

  return (
    <div className="page">
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem', color: '#888' }}>
          <span>Question {current + 1} of {questions.length}</span>
          <span>{q?.skill}</span>
        </div>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '1.5rem' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#2563eb', borderRadius: '3px', transition: 'width 0.3s' }} />
        </div>
        {q && (
          <>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>{q.prompt}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(q.id, opt)}
                  style={{ ...optBtnStyle, ...(answers[q.id] === opt ? selStyle : {}) }}>{opt}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={navBtn}>← Previous</button>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[q.id]} style={btnStyle2}>Next →</button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < questions.length} style={btnStyle2}>
                  {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </>
        )}
        {error && <div className="error-display" style={{ marginTop: '1rem' }}><p>{error}</p></div>}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '8px', padding: '2rem', border: '1px solid #e5e7eb', maxWidth: '600px', margin: '2rem auto' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 };
const optBtnStyle: React.CSSProperties = { padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', textAlign: 'left' as const, fontSize: '0.95rem' };
const selStyle: React.CSSProperties = { borderColor: '#2563eb', background: '#eff6ff' };
const navBtn: React.CSSProperties = { padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' };
const btnStyle2: React.CSSProperties = { padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 };
