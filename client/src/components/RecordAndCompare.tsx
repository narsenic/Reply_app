import { useState, useRef, useCallback } from 'react';

interface RecordAndCompareProps {
  referenceAudioUrl: string;
  exerciseId: string;
  onRecorded?: (blob: Blob) => void;
}

export default function RecordAndCompare({ referenceAudioUrl, onRecorded }: RecordAndCompareProps) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecorded?.(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      alert('Microphone access is required for recording.');
    }
  }, [onRecorded]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  return (
    <div style={container}>
      {/* Reference audio */}
      <div style={section}>
        <label style={labelStyle}>Reference Audio</label>
        <audio controls src={referenceAudioUrl} style={{ width: '100%' }}><track kind="captions" /></audio>
      </div>

      {/* Record */}
      <div style={section}>
        <label style={labelStyle}>Your Recording</label>
        {audioUrl ? (
          <>
            <audio controls src={audioUrl} style={{ width: '100%' }}><track kind="captions" /></audio>
            <button onClick={reRecord} style={secondaryBtn}>Re-record</button>
          </>
        ) : (
          <button onClick={recording ? stopRecording : startRecording}
            style={{ ...primaryBtn, background: recording ? '#E17055' : '#6C5CE7' }}>
            {recording ? '⏹ Stop Recording' : '🎙 Start Recording'}
          </button>
        )}
      </div>
    </div>
  );
}

const container: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const section: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' };
const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.25rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600 };
const secondaryBtn: React.CSSProperties = { ...primaryBtn, background: '#fff', color: '#1a1a1a', border: '1.5px solid #eee' };
