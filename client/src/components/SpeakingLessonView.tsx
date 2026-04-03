import { useState, useRef } from 'react';
import apiClient from '../api/client';

interface Exercise {
  id: string;
  type: string;
  prompt: string;
  options?: string[];
  referenceAudioUrl?: string;
}

interface SpeakingResult {
  score: number;
  feedback: string;
  referenceAudioUrl: string;
}

interface SpeakingLessonViewProps {
  lessonId: string;
  exercises: Exercise[];
  onComplete: (score: number) => void;
}

export default function SpeakingLessonView({ lessonId: _lessonId, exercises, onComplete }: SpeakingLessonViewProps) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);

  const exercise = exercises[currentExercise];
  const isLastExercise = currentExercise >= exercises.length - 1;
  const allDone = currentExercise >= exercises.length && !exercise;

  const handlePlayReference = () => {
    if (!exercise?.referenceAudioUrl) return;
    if (referenceAudioRef.current) {
      referenceAudioRef.current.pause();
      referenceAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(exercise.referenceAudioUrl);
    referenceAudioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handlePlayResultReference = () => {
    if (!result?.referenceAudioUrl) return;
    const audio = new Audio(result.referenceAudioUrl);
    audio.play().catch(() => {});
  };

  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = blob;
        setRecorded(true);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleSubmit = async () => {
    if (!exercise || !audioBlobRef.current || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('exerciseId', exercise.id);
      formData.append('audioBlob', audioBlobRef.current, 'recording.webm');

      const res = await apiClient.post<SpeakingResult>('/api/speaking/evaluate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setScores((s) => [...s, res.data.score]);
    } catch {
      setError('Failed to evaluate recording. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastExercise) {
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      onComplete(avg);
      return;
    }
    setCurrentExercise((i) => i + 1);
    setRecorded(false);
    setResult(null);
    setError(null);
    audioBlobRef.current = null;
  };

  if (allDone) return null;

  return (
    <div>
      {/* Progress indicator */}
      <div style={progressStyle}>
        Exercise {currentExercise + 1} of {exercises.length}
        {scores.length > 0 && (
          <> · Avg Score: {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}/100</>
        )}
      </div>

      {exercise && (
        <div style={exerciseCardStyle}>
          {/* Prompt */}
          <p style={promptStyle}>{exercise.prompt}</p>

          {/* Reference audio */}
          {exercise.referenceAudioUrl && (
            <button onClick={handlePlayReference} style={refAudioBtnStyle}>
              🔊 Play Reference Audio
            </button>
          )}

          {/* Recording controls */}
          <div style={recordSectionStyle}>
            {!recorded && !result && (
              <>
                {!recording ? (
                  <button onClick={handleStartRecording} style={recordBtnStyle}>
                    🎙️ Start Recording
                  </button>
                ) : (
                  <button onClick={handleStopRecording} style={stopBtnStyle}>
                    ⏹️ Stop Recording
                  </button>
                )}
                {recording && <span style={recordingIndicatorStyle}>● Recording...</span>}
              </>
            )}

            {recorded && !result && (
              <div style={recordedRowStyle}>
                <span style={recordedLabelStyle}>✓ Audio recorded</span>
                <button onClick={handleSubmit} disabled={submitting} style={submitBtnStyle}>
                  {submitting ? 'Evaluating...' : 'Submit Recording'}
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <div style={errorStyle}>{error}</div>}

          {/* Result */}
          {result && (
            <div style={resultContainerStyle}>
              <div style={scoreDisplayStyle}>
                <span style={scoreLabelStyle}>Pronunciation Score</span>
                <span style={scoreValueStyle}>{result.score}</span>
                <span style={scoreOutOfStyle}>/100</span>
              </div>
              <p style={feedbackTextStyle}>{result.feedback}</p>
              <button onClick={handlePlayResultReference} style={refAudioBtnStyle}>
                🔊 Replay Reference Audio
              </button>
            </div>
          )}

          {/* Next / Finish */}
          {result && (
            <div style={actionsStyle}>
              <button onClick={handleNext} style={submitBtnStyle}>
                {isLastExercise ? 'Finish Lesson' : 'Next Exercise →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ---- Inline styles ---- */

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

const refAudioBtnStyle: React.CSSProperties = {
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#0369a1',
  marginBottom: '1rem',
  display: 'inline-block',
};

const recordSectionStyle: React.CSSProperties = {
  marginBottom: '1rem',
};

const recordBtnStyle: React.CSSProperties = {
  padding: '0.6rem 1.25rem',
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 500,
};

const stopBtnStyle: React.CSSProperties = {
  padding: '0.6rem 1.25rem',
  background: '#6b7280',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 500,
};

const recordingIndicatorStyle: React.CSSProperties = {
  marginLeft: '0.75rem',
  color: '#dc2626',
  fontWeight: 600,
  fontSize: '0.9rem',
};

const recordedRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const recordedLabelStyle: React.CSSProperties = {
  color: '#16a34a',
  fontWeight: 500,
  fontSize: '0.9rem',
};

const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  marginBottom: '1rem',
  color: '#991b1b',
  fontSize: '0.9rem',
};

const resultContainerStyle: React.CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '1.25rem',
  marginBottom: '1rem',
};

const scoreDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.5rem',
  marginBottom: '0.75rem',
};

const scoreLabelStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#166534',
  fontWeight: 500,
};

const scoreValueStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#166534',
};

const scoreOutOfStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: '#166534',
};

const feedbackTextStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#333',
  lineHeight: 1.6,
  marginBottom: '0.75rem',
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
