import { useState, useRef, useCallback } from 'react';
import SelfEvaluationRubric from './SelfEvaluationRubric';
import apiClient from '../api/client';

interface ShadowingExerciseViewProps {
  exerciseId: string;
  nativeAudioUrl: string;
  transcript: string;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25];

export default function ShadowingExerciseView({ exerciseId, nativeAudioUrl, transcript }: ShadowingExerciseViewProps) {
  const [speed, setSpeed] = useState(1.0);
  const [recording, setRecording] = useState(false);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const nativeAudioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const playNative = () => {
    if (nativeAudioRef.current) {
      nativeAudioRef.current.playbackRate = speed;
      nativeAudioRef.current.play();
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setUserAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        // Upload
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('audioBlob', blob, 'recording.webm');
          formData.append('playbackSpeed', String(speed));
          const res = await apiClient.post<{ attemptId: string; attemptNumber: number }>(
            `/api/speaking/shadowing/${exerciseId}/attempt`, formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          setAttemptId(res.data.attemptId);
          setAttemptCount(res.data.attemptNumber);
          setShowRubric(true);
        } catch { /* upload failed silently */ }
        finally { setUploading(false); }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      alert('Microphone access is required.');
    }
  }, [exerciseId, speed]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  return (
    <div style={container}>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>🔊 Shadowing Exercise</h3>

      {/* Transcript */}
      <div style={transcriptBox}>
        <p style={{ margin: 0, fontSize: '0.92rem', color: '#1a1a1a', lineHeight: 1.7 }}>{transcript}</p>
      </div>

      {/* Speed selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.82rem', color: '#888', fontWeight: 500 }}>Speed:</span>
        {SPEEDS.map((s) => (
          <button key={s} onClick={() => setSpeed(s)}
            style={{ ...speedBtn, background: speed === s ? '#6C5CE7' : '#f5f5f5', color: speed === s ? '#fff' : '#555' }}>
            {s}x
          </button>
        ))}
      </div>

      {/* Native audio */}
      <audio ref={nativeAudioRef} src={nativeAudioUrl} style={{ display: 'none' }}><track kind="captions" /></audio>
      <button onClick={playNative} style={secondaryBtn}>▶ Play Native Audio ({speed}x)</button>

      {/* Record */}
      <button onClick={recording ? stopRecording : startRecording}
        style={{ ...primaryBtn, background: recording ? '#E17055' : '#6C5CE7', marginTop: '0.5rem' }}>
        {recording ? '⏹ Stop Recording' : '🎙 Record Your Attempt'}
      </button>

      {uploading && <p style={{ color: '#888', fontSize: '0.82rem' }}>Uploading...</p>}

      {/* Playback comparison */}
      {userAudioUrl && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: '#888', fontWeight: 600, marginBottom: '0.4rem' }}>Your Recording (Attempt #{attemptCount})</p>
          <audio controls src={userAudioUrl} style={{ width: '100%' }}><track kind="captions" /></audio>
        </div>
      )}

      {/* Self-evaluation */}
      {showRubric && attemptId && (
        <div style={{ marginTop: '1rem' }}>
          <SelfEvaluationRubric attemptId={attemptId} onSubmitted={() => setShowRubric(false)} />
        </div>
      )}
    </div>
  );
}

const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' };
const transcriptBox: React.CSSProperties = { background: '#F8F7FF', border: '1px solid #E8E4FF', borderRadius: 12, padding: '1rem' };
const speedBtn: React.CSSProperties = { padding: '0.3rem 0.6rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' };
const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.25rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600 };
const secondaryBtn: React.CSSProperties = { ...primaryBtn, background: '#fff', color: '#1a1a1a', border: '1.5px solid #eee' };
