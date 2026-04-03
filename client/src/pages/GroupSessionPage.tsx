import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

/* ---------- Types ---------- */

interface Participant {
  id: string;
  displayName: string;
}

interface CurrentLesson {
  id: string;
  title: string;
  skill: string;
  level: string;
}

interface JoinResponse {
  sessionId: string;
  participants: Participant[];
  currentLesson: CurrentLesson;
}

interface ChatMsg {
  userId: string;
  displayName: string;
  text: string;
  timestamp: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/* ---------- Component ---------- */

export default function GroupSessionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /* ---- Auto-scroll chat ---- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---- Join session + connect socket ---- */
  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        // Fetch dashboard to get user's level and target language
        let level = 'A1';
        let targetLanguage = 'lb';
        try {
          const dashRes = await apiClient.get<{ currentLevel: string; targetLanguage: string }>(
            '/api/progress/dashboard',
          );
          level = dashRes.data.currentLevel || 'A1';
          targetLanguage = dashRes.data.targetLanguage || 'lb';
        } catch {
          // Use defaults if dashboard fails
        }

        // Join group session via REST
        const res = await apiClient.post<JoinResponse>('/api/groups/join', {
          level,
          targetLanguage,
        });

        if (cancelled) return;

        const { sessionId: sid, participants: parts, currentLesson: lesson } = res.data;
        setSessionId(sid);
        setParticipants(parts);
        setCurrentLesson(lesson);

        // Connect Socket.IO
        const token = localStorage.getItem('token');
        // In dev, Vite proxies /api but not Socket.IO, so connect to the server directly
        const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin;

        socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (cancelled) return;
          setConnectionStatus('connected');
          // Join the session room
          socket!.emit('session:join', { sessionId: sid });
        });

        socket.on('disconnect', () => {
          if (cancelled) return;
          setConnectionStatus('disconnected');
        });

        socket.on('connect_error', () => {
          if (cancelled) return;
          setConnectionStatus('error');
        });

        // Chat messages
        socket.on('chat:message', (msg: ChatMsg) => {
          if (cancelled) return;
          setMessages((prev) => [...prev, msg]);
        });

        // Participant events
        socket.on('participant:joined', (data: { userId: string; displayName: string }) => {
          if (cancelled) return;
          setParticipants((prev) => {
            if (prev.some((p) => p.id === data.userId)) return prev;
            return [...prev, { id: data.userId, displayName: data.displayName }];
          });
        });

        socket.on('participant:left', (data: { userId: string }) => {
          if (cancelled) return;
          setParticipants((prev) => prev.filter((p) => p.id !== data.userId));
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const apiErr = (err as { response?: { data?: { message?: string } } }).response?.data;
        setError(apiErr?.message || 'Failed to join group session. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Send message ---- */
  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !sessionId || !socketRef.current) return;
    socketRef.current.emit('chat:send', { sessionId, text });
    setDraft('');
  }, [draft, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ---- Connection status helpers ---- */
  const statusLabel: Record<ConnectionStatus, string> = {
    connecting: '🟡 Connecting…',
    connected: '🟢 Connected',
    disconnected: '🔴 Disconnected — reconnecting…',
    error: '🔴 Connection error — retrying…',
  };

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="page">
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Joining group session…
        </p>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="page">
        <nav style={navStyle}>
          <div style={navLeftStyle}>
            <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          </div>
          <div style={navRightStyle}>
            <span style={userNameStyle}>{user?.displayName}</span>
            <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
          </div>
        </nav>
        <div className="error-display" role="alert">
          <p>{error}</p>
        </div>
        <Link to="/dashboard" style={backLinkStyle}>← Back to Dashboard</Link>
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <div className="page">
      {/* Navigation */}
      <nav style={navStyle}>
        <div style={navLeftStyle}>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <span style={navLinkActiveStyle}>Group Session</span>
        </div>
        <div style={navRightStyle}>
          <span style={userNameStyle}>{user?.displayName}</span>
          <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
        </div>
      </nav>

      {/* Connection status bar */}
      <div style={statusBarStyle}>
        <span style={{ fontSize: '0.8rem' }}>{statusLabel[connectionStatus]}</span>
      </div>

      {/* Main layout: lesson + sidebar */}
      <div style={mainLayoutStyle}>
        {/* Left: Lesson + Chat */}
        <div style={leftColumnStyle}>
          {/* Shared lesson view */}
          {currentLesson && (
            <div style={lessonCardStyle}>
              <h2 style={{ margin: '0 0 0.25rem' }}>{currentLesson.title}</h2>
              <p style={lessonMetaStyle}>
                {currentLesson.skill.charAt(0).toUpperCase() + currentLesson.skill.slice(1)} · Level {currentLesson.level}
              </p>
              <Link to={`/lessons/${currentLesson.id}`} style={openLessonLinkStyle}>
                Open Lesson →
              </Link>
            </div>
          )}

          {/* Chat panel */}
          <div style={chatContainerStyle}>
            <h3 style={chatHeaderStyle}>Group Chat</h3>

            <div style={chatMessagesStyle}>
              {messages.length === 0 && (
                <p style={emptyMsgStyle}>No messages yet. Say hello!</p>
              )}
              {messages.map((msg, i) => {
                const isOwn = msg.userId === user?.id;
                return (
                  <div key={i} style={{ ...msgRowStyle, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                    <div style={isOwn ? ownBubbleStyle : otherBubbleStyle}>
                      {!isOwn && <span style={senderNameStyle}>{msg.displayName}</span>}
                      <span>{msg.text}</span>
                      <span style={timestampStyle}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={chatInputContainerStyle}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                style={chatInputStyle}
                disabled={connectionStatus !== 'connected'}
                aria-label="Chat message input"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || connectionStatus !== 'connected'}
                style={sendBtnStyle}
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right: Participants sidebar */}
        <div style={sidebarStyle}>
          <h3 style={sidebarHeaderStyle}>
            Participants ({participants.length})
          </h3>
          <ul style={participantListStyle}>
            {participants.map((p) => (
              <li key={p.id} style={participantItemStyle}>
                <span style={avatarStyle}>
                  {p.displayName.charAt(0).toUpperCase()}
                </span>
                <span style={participantNameStyle}>
                  {p.displayName}
                  {p.id === user?.id && <span style={youBadgeStyle}> (you)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---- Inline styles ---- */

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 0',
  borderBottom: '1px solid #e0e0e0',
  marginBottom: '1rem',
};

const navLeftStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'center',
};

const navRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#555',
  fontWeight: 500,
};

const navLinkActiveStyle: React.CSSProperties = {
  color: '#2563eb',
  fontWeight: 600,
};

const userNameStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#666',
};

const logoutBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '0.35rem 0.75rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: '#555',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '1rem',
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
};

const statusBarStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  background: '#f9fafb',
  borderRadius: '6px',
  marginBottom: '1rem',
  border: '1px solid #e5e7eb',
};

const mainLayoutStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  minHeight: '70vh',
};

const leftColumnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  minWidth: 0,
};

const lessonCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1.25rem',
  border: '1px solid #e5e7eb',
};

const lessonMetaStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666',
  margin: '0 0 0.75rem',
};

const openLessonLinkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '0.9rem',
};

/* Chat styles */

const chatContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
};

const chatHeaderStyle: React.CSSProperties = {
  margin: 0,
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '1rem',
};

const chatMessagesStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0.75rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  minHeight: '250px',
  maxHeight: '450px',
};

const emptyMsgStyle: React.CSSProperties = {
  color: '#aaa',
  textAlign: 'center',
  marginTop: '2rem',
  fontSize: '0.9rem',
};

const msgRowStyle: React.CSSProperties = {
  display: 'flex',
};

const baseBubbleStyle: React.CSSProperties = {
  maxWidth: '70%',
  padding: '0.5rem 0.75rem',
  borderRadius: '12px',
  fontSize: '0.9rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
};

const ownBubbleStyle: React.CSSProperties = {
  ...baseBubbleStyle,
  background: '#2563eb',
  color: '#fff',
  borderBottomRightRadius: '4px',
};

const otherBubbleStyle: React.CSSProperties = {
  ...baseBubbleStyle,
  background: '#f3f4f6',
  color: '#1f2937',
  borderBottomLeftRadius: '4px',
};

const senderNameStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6b7280',
};

const timestampStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  opacity: 0.7,
  alignSelf: 'flex-end',
};

const chatInputContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderTop: '1px solid #e5e7eb',
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '0.9rem',
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '0.9rem',
};

/* Sidebar styles */

const sidebarStyle: React.CSSProperties = {
  width: '220px',
  flexShrink: 0,
  background: '#fff',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '1rem',
  alignSelf: 'flex-start',
};

const sidebarHeaderStyle: React.CSSProperties = {
  margin: '0 0 0.75rem',
  fontSize: '0.95rem',
};

const participantListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const participantItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const avatarStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: '#e0e7ff',
  color: '#2563eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem',
  fontWeight: 600,
  flexShrink: 0,
};

const participantNameStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#374151',
};

const youBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  fontWeight: 400,
};
