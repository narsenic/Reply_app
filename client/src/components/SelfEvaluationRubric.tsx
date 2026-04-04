import { useState } from 'react';
import apiClient from '../api/client';

interface SelfEvaluationRubricProps {
  attemptId: string;
  onSubmitted?: () => void;
}

const CRITERIA = [
  { key: 'pronunciation', label: 'Pronunciation', icon: '🗣️' },
  { key: 'fluency', label: 'Fluency', icon: '💬' },
  { key: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { key: 'grammarAccuracy', label: 'Grammar Accuracy', icon: '📝' },
] as const;

type ScoreKey = typeof CRITERIA[number]['key'];

export default function SelfEvaluationRubric({ attemptId, onSubmitted }: SelfEvaluationRubricProps) {
  const [scores, setScores] = useState<Record<ScoreKey, number>>({ pronunciation: 3, fluency: 3, vocabulary: 3, grammarAccuracy: 3 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScore = (key: ScoreKey, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      await apiClient.post('/api/speaking/self-evaluate', { attemptId, scores });
      setSubmitted(true);
      onSubmitted?.();
    } catch { setError('Failed to submit evaluation.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={card}>
        <p style={{ textAlign: 'center', color: '#00B894', fontWeight: 600, fontSize: '0.92rem' }}>✅ Self-evaluation submitted!</p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Self-Evaluation</h3>
      {CRITERIA.map((c) => (
        <div key={c.key} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span>{c.icon}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a' }}>{c.label}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => handleScore(c.key, v)}
                style={{ ...scaleBtn, background: scores[c.key] === v ? '#6C5CE7' : '#f5f5f5', color: scores[c.key] === v ? '#fff' : '#555' }}
                aria-label={`${c.label} score ${v}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p style={{ color: '#C62828', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{error}</p>}
      <button onClick={handleSubmit} disabled={submitting} style={primaryBtn}>
        {submitting ? 'Submitting...' : 'Submit Evaluation'}
      </button>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const scaleBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.15s' };
const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.5rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, width: '100%' };
