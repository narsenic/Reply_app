import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { io, Socket } from 'socket.io-client';
import SelfEvaluationRubric from '../components/SelfEvaluationRubric';
import type { AvailablePeer, AvailablePeersResponse, SpeakingPromptSummary } from '../types/api';

type AvailabilityStatus = 'available' | 'busy' | 'offline';

interface PeerInvitation {
  invitationId: string;
  fromUserId: string;
  fromDisplayName: string;
  prompt: SpeakingPromptSummary;
}

interface ActiveSession {
  sessionId: string;
  peerId: string;
  peerDisplayName: string;
  prompt: SpeakingPromptSummary;
}

export default function PeerPracticePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<AvailabilityStatus>('offline');
  const [peers, setPeers] = useState<AvailablePeer[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<PeerInvitation | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [showEval, setShowEval] = useState(false);
  const [evalAttemptId, setEvalAttemptId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Socket setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('peer:invitation', (data: PeerInvitation) => setInvitation(data));
    socket.on('peer:session-started', (data: ActiveSession) => {
      setSession(data);
      setPendingInviteId(null);
      initWebRTC(socket, data.sessionId, true);
    });
    socket.on('peer:signal', async (data: { signal: RTCSessionDescriptionInit | RTCIceCandidateInit; type: string }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('peer:signal', { sessionId: session?.sessionId, signal: answer, type: 'answer' });
      } else if (data.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));
      } else if (data.type === 'ice-candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(data.signal as RTCIceCandidateInit));
      }
    });
    socket.on('peer:session-ended', () => {
      cleanupWebRTC();
      setShowEval(true);
    });

    return () => { socket.disconnect(); cleanupWebRTC(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initWebRTC = async (socket: Socket, sessionId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('peer:signal', { sessionId, signal: e.candidate.toJSON(), type: 'ice-candidate' });
    };
    pc.ontrack = (e) => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0];
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    } catch { /* mic not available */ }

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('peer:signal', { sessionId, signal: offer, type: 'offer' });
    }
  };

  const cleanupWebRTC = () => {
    pcRef.current?.close();
    pcRef.current = null;
  };

  const fetchPeers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<AvailablePeersResponse>('/api/peers/available', { params: { level: 'A1' } });
      setPeers(res.data.peers);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (availability === 'available') fetchPeers(); }, [availability, fetchPeers]);

  const toggleAvailability = async (status: AvailabilityStatus) => {
    try {
      await apiClient.put('/api/peers/availability', { status });
      setAvailability(status);
    } catch { /* ignore */ }
  };

  const sendInvite = async (targetUserId: string) => {
    try {
      const res = await apiClient.post<{ invitationId: string }>('/api/peers/invite', { targetUserId });
      setPendingInviteId(res.data.invitationId);
      setTimeout(() => setPendingInviteId(null), 120000);
    } catch { /* ignore */ }
  };

  const acceptInvite = async () => {
    if (!invitation) return;
    try {
      const res = await apiClient.post<{ sessionId: string; prompt: SpeakingPromptSummary }>(`/api/peers/invite/${invitation.invitationId}/accept`);
      setSession({ sessionId: res.data.sessionId, peerId: invitation.fromUserId, peerDisplayName: invitation.fromDisplayName, prompt: res.data.prompt });
      setInvitation(null);
      if (socketRef.current) initWebRTC(socketRef.current, res.data.sessionId, false);
    } catch { /* ignore */ }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await apiClient.post(`/api/peers/sessions/${session.sessionId}/end`);
      cleanupWebRTC();
      setEvalAttemptId(session.sessionId);
      setSession(null);
      setShowEval(true);
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Active call view
  if (session) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <NavBar user={user} onLogout={handleLogout} />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' as const }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
          <h1 style={heading}>Speaking with {session.peerDisplayName}</h1>
          <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }}><track kind="captions" /></audio>
          <div style={card}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Speaking Prompt</h3>
            <p style={{ fontSize: '1.05rem', color: '#1a1a1a', fontWeight: 600, marginBottom: '0.5rem' }}>{session.prompt.topic}</p>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>Vocabulary: {session.prompt.suggestedVocabulary}</p>
            {session.prompt.guidingQuestions.length > 0 && (
              <ul style={{ textAlign: 'left' as const, paddingLeft: '1.25rem', margin: '0.75rem 0 0' }}>
                {session.prompt.guidingQuestions.map((q, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>{q}</li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={endSession} style={{ ...primaryBtn, background: '#E17055', marginTop: '1.5rem' }}>End Call</button>
        </div>
      </div>
    );
  }

  // Post-call evaluation
  if (showEval && evalAttemptId) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <NavBar user={user} onLogout={handleLogout} />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <h1 style={heading}>How did it go?</h1>
          <SelfEvaluationRubric attemptId={evalAttemptId} onSubmitted={() => { setShowEval(false); setEvalAttemptId(null); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <NavBar user={user} onLogout={handleLogout} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={heading}>Peer Speaking Practice</h1>
        <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.92rem' }}>Practice speaking with other learners at your level.</p>

        {/* Availability toggle */}
        <div style={{ ...card, marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>Your Status</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['available', 'busy', 'offline'] as const).map((s) => (
              <button key={s} onClick={() => toggleAvailability(s)}
                style={{ ...statusBtn, background: availability === s ? (s === 'available' ? '#00B894' : s === 'busy' ? '#FDCB6E' : '#ccc') : '#f5f5f5',
                  color: availability === s ? '#fff' : '#555' }}>
                {s === 'available' ? '🟢' : s === 'busy' ? '🟡' : '⚫'} {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Incoming invitation */}
        {invitation && (
          <div style={{ ...card, borderColor: '#6C5CE7', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.5rem' }}>📨 {invitation.fromDisplayName} wants to practice!</p>
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.75rem' }}>Topic: {invitation.prompt.topic}</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={acceptInvite} style={primaryBtn}>Accept</button>
              <button onClick={() => setInvitation(null)} style={secondaryBtn}>Decline</button>
            </div>
          </div>
        )}

        {pendingInviteId && (
          <div style={{ ...card, marginBottom: '1.25rem' }}>
            <p style={{ color: '#6C5CE7', fontSize: '0.88rem', fontWeight: 500 }}>⏳ Waiting for response... (2 min timeout)</p>
          </div>
        )}

        {/* Available peers */}
        {availability === 'available' && (
          <div style={card}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>Available Peers ({peers.length})</h3>
            {loading && <p style={{ color: '#999', fontSize: '0.88rem' }}>Loading...</p>}
            {!loading && peers.length === 0 && <p style={{ color: '#999', fontSize: '0.88rem' }}>No peers available right now. Check back soon!</p>}
            {peers.map((p) => (
              <div key={p.userId} style={peerRow}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{p.displayName}</span>
                  <span style={{ fontSize: '0.78rem', color: '#888', marginLeft: '0.5rem' }}>Level {p.level}</span>
                </div>
                <button onClick={() => sendInvite(p.userId)} disabled={!!pendingInviteId} style={pendingInviteId ? disabledBtn : primaryBtn}>
                  Invite
                </button>
              </div>
            ))}
            <button onClick={fetchPeers} style={{ ...secondaryBtn, marginTop: '0.75rem' }}>Refresh</button>
          </div>
        )}
      </div>
    </div>
  );
}

function NavBar({ user, onLogout }: { user: { displayName: string } | null; onLogout: () => void }) {
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
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <Link to="/dashboard" style={navTab}>Dashboard</Link>
            <Link to="/speaking/peer" style={navTabActive}>Peer Practice</Link>
          </div>
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
const navTabActive: React.CSSProperties = { ...navTab, color: '#6C5CE7', background: '#F0EDFF', fontWeight: 600 };
const avatarStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700 };
const logoutBtn: React.CSSProperties = { background: 'none', border: '1px solid #eee', borderRadius: 10, padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: '#999', fontWeight: 500 };
const heading: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const primaryBtn: React.CSSProperties = { padding: '0.5rem 1.25rem', background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 };
const secondaryBtn: React.CSSProperties = { ...primaryBtn, background: '#fff', color: '#1a1a1a', border: '1.5px solid #eee' };
const disabledBtn: React.CSSProperties = { ...primaryBtn, background: '#ccc', cursor: 'not-allowed' };
const statusBtn: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s' };
const peerRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #fafafa' };
