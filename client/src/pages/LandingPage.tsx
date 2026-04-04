import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReplyLogo from '../components/ReplyLogo';

const P = '#6C5CE7';
const HF = "'Space Grotesk', sans-serif";
const BF = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ background: '#fff', fontFamily: BF, overflowX: 'hidden' }}>
      {/* ─── Floating Nav ─── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0.7rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><ReplyLogo showText size={30} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <a href="#features" style={nl}>Features</a>
            <a href="#method" style={nl}>Method</a>
            {isAuthenticated ? (
              <Link to="/dashboard" style={cta}>Open App</Link>
            ) : (
              <>
                <Link to="/login" style={nl}>Sign in</Link>
                <Link to="/register" style={cta}>Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '8rem 2rem 6rem', background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(108,92,231,0.08) 0%, transparent 70%)' }}>
        <div style={{ marginBottom: '3rem', opacity: 0.9 }}>
          <ReplyLogo size={64} />
        </div>
        <h1 style={{ fontFamily: HF, fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 700, lineHeight: 1.0, color: '#1d1d1f', letterSpacing: '-0.05em', margin: '0 0 1.5rem', maxWidth: 800 }}>
          Learn<br />Luxembourgish.
        </h1>
        <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: '#86868b', lineHeight: 1.6, maxWidth: 520, margin: '0 0 3rem', fontWeight: 400 }}>
          Structured lessons. Real conversations. Your pace.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" style={{ background: P, color: '#fff', padding: '1rem 2.5rem', borderRadius: 980, textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600, transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(108,92,231,0.3)' }}>
            Start for free
          </Link>
          <Link to="/assessment" style={{ background: 'rgba(0,0,0,0.04)', color: '#1d1d1f', padding: '1rem 2.5rem', borderRadius: 980, textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}>
            Test your level
          </Link>
        </div>
      </section>

      {/* ─── Stats ribbon ─── */}
      <section style={{ padding: '4rem 2rem', borderTop: '0.5px solid rgba(0,0,0,0.06)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
          {[['20+', 'Chapters'], ['4', 'Skills'], ['A1 - B2', 'CEFR Levels'], ['Free', 'To Start']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontFamily: HF, fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em' }}>{v}</div>
              <div style={{ fontSize: '0.82rem', color: '#86868b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features — single focus sections ─── */}
      <section id="features">
        {FEATURES.map((f, i) => (
          <div key={i} style={{ padding: 'clamp(4rem, 10vw, 8rem) 2rem', background: i % 2 === 0 ? '#fff' : '#f5f5f7', textAlign: 'center' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: f.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                <span style={{ fontFamily: HF, fontSize: '1.5rem', fontWeight: 700, color: f.color }}>{f.icon}</span>
              </div>
              <h2 style={{ fontFamily: HF, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 1rem' }}>
                {f.title}
              </h2>
              <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: '#86868b', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Method ─── */}
      <section id="method" style={{ padding: 'clamp(5rem, 10vw, 8rem) 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: HF, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.04em', margin: '0 0 1rem' }}>
            How it works.
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#86868b', marginBottom: '4rem' }}>Four steps. One minute to start.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
            {STEPS.map((s, i) => (
              <div key={i}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: P, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: HF, fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>{i + 1}</div>
                <h3 style={{ fontFamily: HF, fontWeight: 700, fontSize: '1.05rem', color: '#1d1d1f', marginBottom: '0.4rem' }}>{s.t}</h3>
                <p style={{ fontSize: '0.9rem', color: '#86868b', lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 2rem', background: '#1d1d1f', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <ReplyLogo size={48} color="#fff" light />
          <h2 style={{ fontFamily: HF, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', margin: '2rem 0 1rem' }}>
            Start learning today.
          </h2>
          <p style={{ color: '#86868b', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Free forever. No credit card.
          </p>
          <Link to="/register" style={{ display: 'inline-block', background: P, color: '#fff', padding: '1rem 3rem', borderRadius: 980, textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600, boxShadow: '0 4px 24px rgba(108,92,231,0.4)' }}>
            Create free account
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: '1.5rem 2rem', borderTop: '0.5px solid rgba(0,0,0,0.06)', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <ReplyLogo showText size={24} />
          <span style={{ fontSize: '0.75rem', color: '#86868b' }}>2026 Reply. Learn Luxembourgish with confidence.</span>
        </div>
      </footer>
    </div>
  );
}

const nl: React.CSSProperties = { color: '#1d1d1f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, opacity: 0.8 };
const cta: React.CSSProperties = { background: '#6C5CE7', color: '#fff', padding: '0.5rem 1.3rem', borderRadius: 980, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 };

const FEATURES = [
  { icon: 'G', title: 'Grammar that clicks.', desc: 'Verb conjugation, articles, word order — with instant feedback and clear explanations in context.', color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)' },
  { icon: 'R', title: 'Read real texts.', desc: 'Dialogues, stories, and everyday scenarios with vocabulary highlights and comprehension questions.', color: '#00B894', bg: 'rgba(0,184,148,0.1)' },
  { icon: 'L', title: 'Listen and understand.', desc: 'Native audio with transcripts, shadowing exercises, and adjustable playback speed.', color: '#0984E3', bg: 'rgba(9,132,227,0.1)' },
  { icon: 'S', title: 'Speak with confidence.', desc: 'Record yourself, compare with native audio, and self-evaluate your pronunciation.', color: '#E17055', bg: 'rgba(225,112,85,0.1)' },
  { icon: 'X', title: 'Track everything.', desc: 'XP, streaks, badges, and a leaderboard. See your progress across every skill and chapter.', color: '#FDCB6E', bg: 'rgba(253,203,110,0.15)' },
  { icon: 'P', title: 'Practice with peers.', desc: 'Find partners at your level for live speaking sessions. Like a classroom, but on your schedule.', color: '#A29BFE', bg: 'rgba(162,155,254,0.12)' },
];

const STEPS = [
  { t: 'Create account', d: 'Sign up in seconds. Completely free.' },
  { t: 'Find your level', d: 'Quick assessment or self-select A1 to B2.' },
  { t: 'Choose your path', d: 'Daily life or Sproochentest preparation.' },
  { t: 'Start learning', d: 'Chapters, quizzes, speaking, and more.' },
];
