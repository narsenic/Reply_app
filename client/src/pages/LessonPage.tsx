import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import GrammarLessonView from '../components/GrammarLessonView';
import ReadingLessonView from '../components/ReadingLessonView';
import ListeningLessonView from '../components/ListeningLessonView';
import SpeakingLessonView from '../components/SpeakingLessonView';

interface ContentBlock {
  type: string;
  url?: string;
  body?: string;
}

interface Exercise {
  id: string;
  type: string;
  prompt: string;
  options?: string[];
  referenceAudioUrl?: string;
}

interface LessonDetail {
  id: string;
  title: string;
  skill: string;
  level: string;
  instructionalContent: ContentBlock[];
  exercises: Exercise[];
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchLesson = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<LessonDetail>(`/api/lessons/${id}`);
      setLesson(res.data);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleComplete = async (score: number) => {
    setFinalScore(score);
    setCompleted(true);
    setSaving(true);
    try {
      await apiClient.post('/api/progress/complete', { lessonId: id, score });
    } catch {
      // Progress save failed silently — score is still shown
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p style={loadingStyle}>Loading lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-display" role="alert"><p>{error}</p></div>
        <button onClick={fetchLesson} style={retryBtnStyle}>Retry</button>
        <Link to="/dashboard" style={backLinkStyle}>← Back to Dashboard</Link>
      </div>
    );
  }

  if (!lesson) return null;

  // Completion summary
  if (completed) {
    return (
      <div className="page">
        <div style={completionCardStyle}>
          <div style={completionIconStyle}>🎉</div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Lesson Complete!</h2>
          <p style={completionTitleStyle}>{lesson.title}</p>
          <div style={scoreCircleStyle}>
            <span style={scoreNumberStyle}>{finalScore}</span>
            <span style={scorePercentStyle}>%</span>
          </div>
          <p style={scoreLabel}>
            {finalScore >= 80 ? 'Great job!' : finalScore >= 50 ? 'Good effort!' : 'Keep practicing!'}
          </p>
          {saving && <p style={savingStyle}>Saving progress...</p>}
          <Link to="/dashboard" style={dashboardBtnStyle}>Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={headerStyle}>
        <Link to="/dashboard" style={backLinkStyle}>← Dashboard</Link>
        <div>
          <h1 style={{ margin: 0 }}>{lesson.title}</h1>
          <p style={metaStyle}>
            {SKILL_LABELS[lesson.skill] || lesson.skill} · Level {lesson.level}
          </p>
        </div>
      </div>

      {/* Skill-specific view */}
      {lesson.skill === 'grammar' && (
        <GrammarLessonView
          lessonId={lesson.id}
          content={lesson.instructionalContent}
          exercises={lesson.exercises}
          onComplete={handleComplete}
        />
      )}

      {lesson.skill === 'reading' && (
        <ReadingLessonView
          lessonId={lesson.id}
          content={lesson.instructionalContent}
          exercises={lesson.exercises}
          onComplete={handleComplete}
        />
      )}

      {lesson.skill === 'listening' && (
        <ListeningLessonView
          lessonId={lesson.id}
          content={lesson.instructionalContent}
          exercises={lesson.exercises}
          onComplete={handleComplete}
        />
      )}

      {lesson.skill === 'speaking' && (
        <SpeakingLessonView
          lessonId={lesson.id}
          exercises={lesson.exercises}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

const SKILL_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
};




/* ---- Inline styles ---- */

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '2rem',
  color: '#666',
};

const retryBtnStyle: React.CSSProperties = {
  display: 'block',
  margin: '1rem auto',
  padding: '0.5rem 1.5rem',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const backLinkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const headerStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const metaStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem',
  marginTop: '0.25rem',
};

const completionCardStyle: React.CSSProperties = {
  textAlign: 'center',
  background: '#fff',
  borderRadius: '12px',
  padding: '2.5rem',
  border: '1px solid #e5e7eb',
  maxWidth: '400px',
  margin: '2rem auto',
};

const completionIconStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '0.5rem',
};

const completionTitleStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.95rem',
  marginBottom: '1.5rem',
};

const scoreCircleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  background: '#eff6ff',
  border: '3px solid #2563eb',
  marginBottom: '0.75rem',
};

const scoreNumberStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 700,
  color: '#2563eb',
};

const scorePercentStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 600,
  color: '#2563eb',
};

const scoreLabel: React.CSSProperties = {
  fontSize: '1rem',
  color: '#555',
  marginBottom: '1.5rem',
};

const savingStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#888',
  marginBottom: '0.5rem',
};

const dashboardBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 1.5rem',
  background: '#2563eb',
  color: '#fff',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
};


