import { useState } from 'react';
import apiClient from '../api/client';

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

interface ExerciseResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

interface ListeningLessonViewProps {
  lessonId: string;
  content: ContentBlock[];
  exercises: Exercise[];
  onComplete: (score: number) => void;
}

export default function ListeningLessonView({ lessonId, content, exercises, onComplete }: ListeningLessonViewProps) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const audioBlocks = content.filter((b) => b.type === 'audio' && b.url);
  const exercise = exercises[currentExercise];
  const isLastExercise = currentExercise >= exercises.length - 1;
  const allDone = answeredCount === exercises.length && !exercise;

  const handleSubmit = async () => {
    if (!exercise || !selectedAnswer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post<ExerciseResult>(
        `/api/lessons/${lessonId}/exercises/${exercise.id}/submit`,
        { answer: selectedAnswer },
      );
      setResult(res.data);
      if (res.data.correct) setCorrectCount((c) => c + 1);
      setAnsweredCount((c) => c + 1);
    } catch {
      setResult({ correct: false, correctAnswer: '—', explanation: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastExercise) {
      const score = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 100;
      onComplete(score);
      return;
    }
    setCurrentExercise((i) => i + 1);
    setSelectedAnswer('');
    setResult(null);
  };

  const handleShowTranscript = async () => {
    if (transcript !== null) return;
    setLoadingTranscript(true);
    try {
      const res = await apiClient.get<{ text: string }>(`/api/lessons/${lessonId}/transcript`);
      setTranscript(res.data.text);
    } catch {
      setTranscript('Failed to load transcript.');
    } finally {
      setLoadingTranscript(false);
    }
  };

  if (allDone) return null;

  return (
    <div>
      {/* Audio player section */}
      {audioBlocks.length > 0 && (
        <div style={audioSectionStyle}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>🎧 Listening Audio</h3>
          {audioBlocks.map((block, i) => (
            <audio key={i} controls src={block.url} style={audioPlayerStyle}>
              Your browser does not support the audio element.
            </audio>
          ))}
          <p style={replayHintStyle}>You can replay the audio as many times as you need.</p>
        </div>
      )}

      {/* Transcript reveal */}
      <div style={transcriptSectionStyle}>
        {transcript === null ? (
          <button onClick={handleShowTranscript} disabled={loadingTranscript} style={transcriptBtnStyle}>
            {loadingTranscript ? 'Loading...' : '📝 Show Transcript'}
          </button>
        ) : (
          <div style={transcriptBoxStyle}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>📝 Transcript</strong>
            <p style={transcriptTextStyle}>{transcript}</p>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div style={progressStyle}>
        Question {currentExercise + 1} of {exercises.length} · Score: {correctCount}/{answeredCount}
      </div>

      {/* Comprehension questions */}
      {exercise && (
        <div style={exerciseCardStyle}>
          <p style={promptStyle}>{exercise.prompt}</p>

          {/* Multiple-choice / matching */}
          {(exercise.type === 'multiple-choice' || exercise.type === 'matching') && exercise.options && (
            <div style={optionsContainerStyle}>
              {(exercise.options as string[]).map((opt, i) => {
                let btnStyle = optionBtnStyle;
                if (result) {
                  if (opt.toLowerCase() === result.correctAnswer.toLowerCase()) {
                    btnStyle = { ...optionBtnStyle, ...correctBtnStyle };
                  } else if (opt === selectedAnswer && !result.correct) {
                    btnStyle = { ...optionBtnStyle, ...incorrectBtnStyle };
                  }
                } else if (opt === selectedAnswer) {
                  btnStyle = { ...optionBtnStyle, ...selectedBtnStyle };
                }
                return (
                  <button
                    key={i}
                    onClick={() => !result && setSelectedAnswer(opt)}
                    style={btnStyle}
                    disabled={!!result}
                    aria-pressed={opt === selectedAnswer}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill-blank / free-text */}
          {(exercise.type === 'fill-blank' || exercise.type === 'free-text') && (
            <input
              type="text"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder={exercise.type === 'fill-blank' ? 'Fill in the blank...' : 'Type your answer...'}
              style={inputStyle}
              disabled={!!result}
              onKeyDown={(e) => e.key === 'Enter' && !result && handleSubmit()}
            />
          )}

          {/* Feedback */}
          {result && (
            <div style={result.correct ? feedbackCorrectStyle : feedbackIncorrectStyle}>
              <strong>{result.correct ? '✓ Correct!' : '✗ Incorrect'}</strong>
              {!result.correct && <p style={{ margin: '0.25rem 0 0' }}>Correct answer: {result.correctAnswer}</p>}
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{result.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div style={actionsStyle}>
            {!result ? (
              <button onClick={handleSubmit} disabled={!selectedAnswer.trim() || submitting} style={submitBtnStyle}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button onClick={handleNext} style={submitBtnStyle}>
                {isLastExercise ? 'Finish Lesson' : 'Next Question →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/* ---- Inline styles ---- */

const audioSectionStyle: React.CSSProperties = {
  background: '#f0f9ff',
  borderRadius: '8px',
  padding: '1.25rem',
  marginBottom: '1rem',
  border: '1px solid #bae6fd',
};

const audioPlayerStyle: React.CSSProperties = {
  width: '100%',
  marginBottom: '0.5rem',
};

const replayHintStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#0369a1',
  fontStyle: 'italic',
  margin: '0.25rem 0 0',
};

const transcriptSectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const transcriptBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#555',
};

const transcriptBoxStyle: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: '8px',
  padding: '1rem',
  border: '1px solid #e5e7eb',
};

const transcriptTextStyle: React.CSSProperties = {
  lineHeight: 1.7,
  fontSize: '0.95rem',
  color: '#333',
  margin: 0,
  whiteSpace: 'pre-wrap',
};

const progressStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#888',
  marginBottom: '1rem',
};

const exerciseCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  border: '1px solid #e5e7eb',
};

const promptStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '1rem',
  color: '#222',
};

const optionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const optionBtnStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '0.95rem',
};

const selectedBtnStyle: React.CSSProperties = {
  borderColor: '#2563eb',
  background: '#eff6ff',
};

const correctBtnStyle: React.CSSProperties = {
  borderColor: '#16a34a',
  background: '#f0fdf4',
  color: '#166534',
};

const incorrectBtnStyle: React.CSSProperties = {
  borderColor: '#dc2626',
  background: '#fef2f2',
  color: '#991b1b',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '1rem',
  marginBottom: '1rem',
  boxSizing: 'border-box',
};

const feedbackCorrectStyle: React.CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  marginBottom: '1rem',
  color: '#166534',
};

const feedbackIncorrectStyle: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  marginBottom: '1rem',
  color: '#991b1b',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 500,
};
