import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReplyLogo from '../components/ReplyLogo';
import { ConnectedR, FeedbackLoopR, ConversationMarkR } from '../components/LogoConcepts';

const P = '#6C5CE7';
const SF = "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
const SFT = "SF Pro Text, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ background: '#fff', fontFamily: SFT, color: '#1d1d1f' }}>
      {/* ─── Nav ─── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(251,251,253,0.8)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 22px', height: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><ReplyLogo size={26} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" style={navLk}>Features</a>
            <a href="#method" style={navLk}>Method</a>
            {isAuthenticated ? (
              <Link to="/dashboard" style={navCta}>Open App</Link>
            ) : (
              <>
                <Link to="/login" style={navLk}>Sign in</Link>
                <Link to="/register" style={navCta}>Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '7rem 24px 5rem' }}>
        <h1 style={{ fontFamily: SF, fontSize: 'clamp(3.2rem, 8vw, 6rem)', fontWeight: 700, lineHeight: 1.03, letterSpacing: '-0.045em', margin: '0 0 24px', color: '#1d1d1f' }}>
          Learn<br />Luxembourgish.
        </h1>
        <p style={{ fontFamily: SFT, fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', fontWeight: 400, color: '#86868b', lineHeight: 1.5, maxWidth: 460, margin: '0 0 40px' }}>
          Structured lessons. Real conversations.<br />Your pace. Completely free.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" style={{ ...pill, background: P, color: '#fff', boxShadow: '0 2px 12px rgba(108,92,231,0.3)' }}>Start for free</Link>
          <Link to="/assessment" style={{ ...pill, background: 'rgba(0,0,0,0.06)', color: '#1d1d1f' }}>Test your level</Link>
        </div>
      </section>

      {/* ─── Logo concepts showcase ─── */}
      <section style={{ padding: 'clamp(60px, 10vw, 100px) 24px', background: '#fbfbfd', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#86868b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Brand Identity</p>
          <h2 style={{ fontFamily: SF, fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#1d1d1f', margin: '0 0 48px' }}>
            The mark behind Reply.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {/* Connected R */}
            <div style={conceptCard}>
              <div style={{ marginBottom: 20 }}><ConnectedR size={72} /></div>
              <h3 style={conceptTitle}>The Connected R</h3>
              <p style={conceptDesc}>The tail curves into a speech bubble. Every word you say is met with a meaningful response.</p>
            </div>
            {/* Feedback Loop */}
            <div style={conceptCard}>
              <div style={{ marginBottom: 20 }}><FeedbackLoopR size={72} /></div>
              <h3 style={conceptTitle}>The Feedback Loop</h3>
              <p style={conceptDesc}>Two overlapping lines — one guiding, one learning. The arrow represents the hand of a tutor.</p>
            </div>
            {/* Conversation Mark */}
            <div style={conceptCard}>
              <div style={{ marginBottom: 20 }}><ConversationMarkR size={72} /></div>
              <h3 style={conceptTitle}>The Conversation Mark</h3>
              <p style={conceptDesc}>A rounded R with a chat icon in its counter. Professional yet energetic on any screen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section style={{ padding: '56px 24px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
          {STATS.map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: SF, fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f' }}>{v}</div>
              <div style={{ fontSize: '0.78rem', color: '#86868b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Value statement ─── */}
      <section style={{ padding: 'clamp(80px, 12vw, 140px) 24px', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SF, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.12, color: '#1d1d1f', margin: '0 0 24px' }}>
            Built for people who actually<br />want to live in Luxembourg.
          </h2>
          <p style={{ fontSize: '1.08rem', fontWeight: 400, color: '#86868b', lineHeight: 1.7, margin: '0 0 32px' }}>
            Whether you just moved to Luxembourg, need to pass the Sproochentest for citizenship, or simply want to connect with your neighbors in their language — Reply gives you a structured path from zero to fluency. No guesswork. No scattered YouTube videos. Just a clear, chapter-by-chapter curriculum built around real Luxembourgish as it is actually spoken.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 24px' }}>
            {['Expats and newcomers', 'Citizenship applicants', 'Cross-border workers', 'Partners and families', 'Language enthusiasts'].map(tag => (
              <span key={tag} style={{ padding: '8px 20px', borderRadius: 980, background: 'rgba(108,92,231,0.06)', color: '#6C5CE7', fontSize: '0.88rem', fontWeight: 500 }}>{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features">
        {FEATURES.map((f, i) => (
          <div key={i} style={{ padding: 'clamp(80px, 12vw, 140px) 24px', background: i % 2 === 0 ? '#fbfbfd' : '#fff', textAlign: 'center' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: f.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <span style={{ fontFamily: SF, fontSize: '1.3rem', fontWeight: 700, color: f.color }}>{f.icon}</span>
              </div>
              <h2 style={{ fontFamily: SF, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '0 0 16px', color: '#1d1d1f' }}>
                {f.title}
              </h2>
              <p style={{ fontSize: '1.05rem', fontWeight: 400, color: '#86868b', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Method ─── */}
      <section id="method" style={{ padding: 'clamp(80px, 12vw, 140px) 24px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: SF, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 12px', color: '#1d1d1f' }}>
            How it works.
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#86868b', marginBottom: 56 }}>Four steps. One minute to start.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem' }}>
            {STEPS.map((s, i) => (
              <div key={i}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: P, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: SF, fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>{i + 1}</div>
                <h3 style={{ fontFamily: SF, fontWeight: 600, fontSize: '1rem', color: '#1d1d1f', marginBottom: 6 }}>{s.t}</h3>
                <p style={{ fontSize: '0.88rem', color: '#86868b', lineHeight: 1.55, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: 'clamp(80px, 12vw, 140px) 24px', background: '#1d1d1f', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SF, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#f5f5f7', margin: '0 0 12px' }}>
            Start learning today.
          </h2>
          <p style={{ color: '#86868b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 40 }}>
            Free forever. No credit card needed.
          </p>
          <Link to="/register" style={{ ...pill, background: P, color: '#fff', boxShadow: '0 2px 16px rgba(108,92,231,0.4)', fontSize: '1.05rem', padding: '14px 40px' }}>
            Create free account
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: '16px 24px', background: '#f5f5f7', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <ReplyLogo size={20} />
          <span style={{ fontSize: '0.72rem', color: '#86868b' }}>2026 Reply. Learn Luxembourgish with confidence.</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Styles ─── */
const navLk: React.CSSProperties = { color: '#1d1d1f', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 400, opacity: 0.8 };
const navCta: React.CSSProperties = { background: '#6C5CE7', color: '#fff', padding: '6px 16px', borderRadius: 980, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 };
const pill: React.CSSProperties = { display: 'inline-block', padding: '12px 32px', borderRadius: 980, textDecoration: 'none', fontSize: '1rem', fontWeight: 500 };
const conceptCard: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '40px 28px 32px', border: '0.5px solid rgba(0,0,0,0.06)', textAlign: 'center' };
const conceptTitle: React.CSSProperties = { fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", fontWeight: 600, fontSize: '1.05rem', color: '#1d1d1f', marginBottom: 8 };
const conceptDesc: React.CSSProperties = { fontSize: '0.88rem', color: '#86868b', lineHeight: 1.55, margin: 0 };

/* ─── Data ─── */
const STATS: [string, string][] = [['20+', 'Chapters'], ['4', 'Skills'], ['A1-B2', 'CEFR'], ['Free', 'To start']];

const FEATURES = [
  { icon: 'G', title: 'Grammar that clicks.', desc: 'Verb conjugation, articles, word order. Instant feedback with clear explanations in context.', color: '#6C5CE7', bg: 'rgba(108,92,231,0.08)' },
  { icon: 'R', title: 'Read real texts.', desc: 'Dialogues, stories, and everyday scenarios. Vocabulary highlights and comprehension questions.', color: '#34C759', bg: 'rgba(52,199,89,0.08)' },
  { icon: 'L', title: 'Listen and understand.', desc: 'Native audio with transcripts. Shadowing exercises and adjustable playback speed.', color: '#007AFF', bg: 'rgba(0,122,255,0.08)' },
  { icon: 'S', title: 'Speak with confidence.', desc: 'Record yourself, compare with native audio, self-evaluate your pronunciation.', color: '#FF6B6B', bg: 'rgba(255,107,107,0.08)' },
  { icon: 'XP', title: 'Track everything.', desc: 'Points, streaks, badges, leaderboard. See your progress across every skill and chapter.', color: '#FF9F0A', bg: 'rgba(255,159,10,0.08)' },
  { icon: 'P', title: 'Practice with peers.', desc: 'Find partners at your level for live speaking sessions. Like a classroom, on your schedule.', color: '#AF52DE', bg: 'rgba(175,82,222,0.08)' },
];

const STEPS = [
  { t: 'Create account', d: 'Sign up in seconds. Free.' },
  { t: 'Find your level', d: 'Quick assessment or self-select.' },
  { t: 'Choose your path', d: 'Daily life or Sproochentest.' },
  { t: 'Start learning', d: 'Chapters, quizzes, speaking.' },
];
