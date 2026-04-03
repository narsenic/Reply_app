import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '0.9rem' }}>💬</span>
    </div>
    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1a1a1a' }}>Reply</span>
  </div>
);

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(250,250,250,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eee', zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0.7rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <a href="#skills" style={nl}>Skills</a>
            <a href="#how" style={nl}>How it works</a>
            {isAuthenticated ? (
              <Link to="/dashboard" style={pb}>Dashboard</Link>
            ) : (
              <><Link to="/login" style={nl}>Log in</Link><Link to="/register" style={pb}>Start free</Link></>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '5rem 1.5rem 4rem', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
        <div style={{ flex: '1 1 420px' }}>
          <div style={{ display: 'inline-block', background: '#F0EDFF', color: '#6C5CE7', padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, marginBottom: '1.5rem' }}>✨ Free to start · CEFR A1–C2</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1, color: '#1a1a1a', marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
            Learn Luxembourgish.<br /><span style={{ color: '#6C5CE7' }}>Your way.</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 460 }}>
            Structured lessons in Grammar, Reading, Listening & Speaking — solo or with a group. Like a real classroom, but on your schedule.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '2rem' }}>
            <Link to="/register" style={{ background: '#6C5CE7', color: '#fff', padding: '0.8rem 1.75rem', borderRadius: 12, textDecoration: 'none', fontSize: '1rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(108,92,231,0.25)' }}>Get started free →</Link>
            <Link to="/assessment" style={{ background: '#fff', color: '#1a1a1a', padding: '0.8rem 1.75rem', borderRadius: 12, textDecoration: 'none', fontSize: '1rem', fontWeight: 600, border: '1.5px solid #ddd' }}>Test your level</Link>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' as const }}>
            {[['A1–C2', 'CEFR levels'], ['4', 'Skill areas'], ['Solo + Group', 'Modes']].map(([n, l]) => (
              <div key={l}><div style={{ fontWeight: 700, color: '#1a1a1a' }}>{n}</div><div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 300, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', border: '1px solid #eee', background: '#fff' }}>
            <div style={{ padding: '0.75rem 1rem', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6C5CE7', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#A29BFE', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DDD', display: 'inline-block' }} />
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.75rem', fontWeight: 600 }}>📝 Grammar · A1</p>
              <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.3rem' }}>Complete the sentence:</p>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '1rem' }}>"Ech ___ Lëtzebuergesch."</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.55rem 0.75rem', border: '1.5px solid #6C5CE7', borderRadius: 10, fontSize: '0.88rem', color: '#6C5CE7', background: '#F8F7FF', fontWeight: 600 }}>schwätzen ✓</div>
                <div style={{ padding: '0.55rem 0.75rem', border: '1.5px solid #eee', borderRadius: 10, fontSize: '0.88rem', color: '#888' }}>schwätzt</div>
                <div style={{ padding: '0.55rem 0.75rem', border: '1.5px solid #eee', borderRadius: 10, fontSize: '0.88rem', color: '#888' }}>geschwat</div>
              </div>
              <div style={{ background: '#F0EDFF', borderRadius: 10, padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#6C5CE7', fontWeight: 500 }}>✓ Correct! "Schwätzen" = to speak</div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" style={{ padding: '4.5rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' as const }}>FOUR PILLARS</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '2.5rem' }}>Master every skill</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
            {skills.map(s => (
              <div key={s.name} style={{ background: '#fafafa', borderRadius: 16, padding: '1.5rem', border: '1px solid #f0f0f0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{s.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#777', lineHeight: 1.55 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" style={{ padding: '4.5rem 0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' as const }}>SIMPLE</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '2.5rem' }}>Start in 4 steps</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', maxWidth: 860, margin: '0 auto' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' as const }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontWeight: 700, fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}>{i + 1}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.95rem' }}>{s.t}</h3>
                <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4.5rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' as const }}>WHY REPLY</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '2.5rem' }}>Built for real learners</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {feats.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem', borderRadius: 14, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{f.i}</div>
                <div><h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.15rem' }}>{f.t}</h4><p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.5, margin: 0 }}>{f.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1a1a1a', padding: '4.5rem 1.5rem', textAlign: 'center' as const }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>Ready to start?</h2>
        <p style={{ color: '#888', fontSize: '1rem', marginBottom: '2rem' }}>Free forever. No credit card needed.</p>
        <Link to="/register" style={{ display: 'inline-block', background: '#6C5CE7', color: '#fff', padding: '0.85rem 2.25rem', borderRadius: 12, textDecoration: 'none', fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 20px rgba(108,92,231,0.3)' }}>Create free account →</Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #eee', padding: '1.25rem 1.5rem', background: '#fafafa' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <Logo />
          <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0 }}>© 2026 Reply. Learn Luxembourgish with confidence.</p>
        </div>
      </footer>
    </div>
  );
}

const nl: React.CSSProperties = { color: '#666', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 };
const pb: React.CSSProperties = { background: '#6C5CE7', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: 10, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 };

const skills = [
  { name: 'Grammar', icon: '📝', bg: '#F0EDFF', desc: 'Verb conjugation, articles, word order — with instant feedback.' },
  { name: 'Reading', icon: '📖', bg: '#E8F5E9', desc: 'Texts with vocabulary highlights and comprehension questions.' },
  { name: 'Listening', icon: '🎧', bg: '#FFF8E1', desc: 'Native audio with transcripts and comprehension challenges.' },
  { name: 'Speaking', icon: '🗣️', bg: '#FCE4EC', desc: 'Record, compare with reference audio, get scored instantly.' },
];

const steps = [
  { t: 'Sign up', d: 'Create your free account in seconds.' },
  { t: 'Find your level', d: 'Quick assessment or self-select A1–C2.' },
  { t: 'Learn your way', d: 'Solo lessons or live group sessions.' },
  { t: 'Level up', d: 'Track progress across all skills.' },
];

const feats = [
  { i: '🎯', t: 'CEFR-aligned', d: 'Curriculum organized by European standards.' },
  { i: '👥', t: 'Group learning', d: 'Live sessions with real-time chat.' },
  { i: '📊', t: 'Progress tracking', d: 'Visual dashboards for every skill.' },
  { i: '🌍', t: 'Multi-language', d: 'Starting with Luxembourgish, expanding soon.' },
  { i: '📚', t: 'Rich content', d: 'PDFs, audio, video, and text materials.' },
  { i: '⚡', t: 'Instant feedback', d: 'Know immediately if you got it right.' },
];
