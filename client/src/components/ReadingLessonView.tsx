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

interface ReadingLessonViewProps {
  lessonId: string;
  content: ContentBlock[];
  exercises: Exercise[];
  onComplete: (score: number) => void;
}

export default function ReadingLessonView({ lessonId, content, exercises, onComplete }: ReadingLessonViewProps) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showVocab, setShowVocab] = useState(true);

  const exercise = exercises[currentExercise];
  const isLastExercise = currentExercise >= exercises.length - 1;
  const allDone = answeredCount === exercises.length && !exercise;

  // Separate text passages from other content
  const passages = content.filter((b) => b.type === 'text' && b.body);
  const otherContent = content.filter((b) => b.type !== 'text' || !b.body);

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

  if (allDone) return null;

  return (
    <div>
      {/* Reading passage */}
      {passages.length > 0 && (
        <div style={passageContainerStyle}>
          <div style={passageHeaderStyle}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>📖 Reading Passage</h3>
            <button onClick={() => setShowVocab(!showVocab)} style={vocabToggleBtnStyle}>
              {showVocab ? 'Hide' : 'Show'} Vocabulary Hints
            </button>
          </div>
          {passages.map((block, i) => (
            <div
              key={i}
              style={showVocab ? passageTextWithVocabStyle : passageTextStyle}
              dangerouslySetInnerHTML={{ __html: block.body! }}
            />
          ))}
          {showVocab && (
            <p style={vocabHintStyle}>
              💡 Words highlighted in the passage have definitions — hover or tap to see them.
            </p>
          )}
        </div>
      )}

      {/* Other content (images, PDFs, etc.) */}
      {otherContent.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {otherContent.map((block, i) => (
            <div key={i} style={{ marginBottom: '0.75rem' }}>
              {block.type === 'image' && block.url && (
                <img src={block.url} alt="Reading content" style={imageStyle} />
              )}
              {block.type === 'pdf' && block.url && (
                <a href={block.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  📄 Open PDF
                </a>
              )}
            </div>
          ))}
        </div>
      )}

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

const passageContainerStyle: React.CSSProperties = {
  background: '#fffbeb',
  borderRadius: '8px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
  border: '1px solid #fde68a',
};

const passageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const vocabToggleBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #d4a017',
  borderRadius: '4px',
  padding: '0.3rem 0.6rem',
  cursor: 'pointer',
  fontSize: '0.8rem',
  color: '#92400e',
};

const passageTextStyle: React.CSSProperties = {
  lineHeight: 1.8,
  fontSize: '1.05rem',
  color: '#333',
};

const passageTextWithVocabStyle: React.CSSProperties = {
  ...passageTextStyle,
};

const vocabHintStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#92400e',
  marginTop: '0.75rem',
  fontStyle: 'italic',
};

const imageStyle: React.CSSProperties = {
  maxWidth: '100%',
  borderRadius: '6px',
};

const linkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
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
