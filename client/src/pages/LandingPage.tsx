import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReplyLogo from '../components/ReplyLogo';

const PURPLE = '#6C5CE7';
const HF = "'Space Grotesk', sans-serif";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><ReplyLogo showText size={34} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#skills" style={navLink}>Skills</a>
            <a href="#how" style={navLink}>How it works</a>
            {isAuthenticated ? (
              <Link to="/dashboard" style={ctaBtn}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={navLink}>Log in</Link>
                <Link to="/register" style={ctaBtn}>Start free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '8rem 2rem 6rem', textAlign: 'center' as const, background: 'linear-gradient(180deg, #fff 0%, #F8F7FF 100%)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#F0EDFF', color: PURPLE, padding: '0.4rem 1.2rem', borderRadius: 24, fontSize: '0.82rem', fontWeight: 600, marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
            Free to start. CEFR A1 to C2.
          </div>
          <h1 style={{ fontFamily: HF, fontSize: 'clamp(2.8rem, 6vw, 4.2rem)', fontWeight: 700, lineHeight: 1.05, color: '#1a1a1a', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            Learn Luxembourgish.
            <br />
            <span style={{ color: PURPLE }}>Your way.</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#777', lineHeight: 1.7, marginBottom: '3rem', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            Grammar, Reading, Listening, and Speaking — structured lessons that feel like having a personal tutor. Solo or with peers.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: '4rem' }}>
            <Link to="/register" style={{ background: PURPLE, color: '#fff', padding: '1rem 2.5rem', borderRadius: 14, textDecoration: 'none', fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 20px rgba(108,92,231,0.3)', transition: 'transform 0.15s' }}>
              Get started free
            </Link>
            <Link to="/assessment" style={{ background: '#fff', color: '#1a1a1a', padding: '1rem 2.5rem', borderRadius: 14, textDecoration: 'none', fontSize: '1rem', fontWeight: 600, border: '1.5px solid #e8e8e8' }}>
              Test your level
            </Link>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' as const }}>
            {[['20+', 'Chapters'], ['4', 'Skill areas'], ['A1-C2', 'CEFR levels'], ['Free', 'To start']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: HF, fontWeight: 700, fontSize: '1.5rem', color: '#1a1a1a' }}>{n}</div>
                <div style={{ fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" style={{ padding: '7rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: PURPLE, letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' }}>Four pillars</p>
            <h2 style={{ fontFamily: HF, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.03em' }}>Master every skill</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {SKILLS.map(s => (
              <div key={s.name} style={{ padding: '2rem', borderRadius: 20, background: '#fafafa', border: '1px solid #f0f0f0', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem' }}>{s.icon}</div>
                <h3 style={{ fontFamily: HF, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>{s.name}</h3>
                <p style={{ fontSize: '0.88rem', color: '#888', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: '7rem 2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: PURPLE, letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' }}>Simple</p>
            <h2 style={{ fontFamily: HF, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.03em' }}>Start in 4 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' as const }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: PURPLE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 700, fontSize: '1.1rem', fontFamily: HF }}>{i + 1}</div>
                <h3 style={{ fontFamily: HF, fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', marginBottom: '0.4rem' }}>{s.t}</h3>
                <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '7rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: PURPLE, letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' }}>Why Reply</p>
            <h2 style={{ fontFamily: HF, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.03em' }}>Built for real learners</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: 16, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{f.i}</div>
                <div>
                  <h4 style={{ fontFamily: HF, fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '0.3rem' }}>{f.t}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: 1.6, margin: 0 }}>{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1a1a1a', padding: '7rem 2rem', textAlign: 'center' as const }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: HF, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 700, color: '#fff', marginBottom: '1rem', letterSpacing: '-0.03em' }}>Ready to start?</h2>
          <p style={{ color: '#888', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Join learners mastering Luxembourgish. Free forever — no credit card needed.
          </p>
          <Link to="/register" style={{ display: 'inline-block', background: PURPLE, color: '#fff', padding: '1rem 3rem', borderRadius: 14, textDecoration: 'none', fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 24px rgba(108,92,231,0.4)' }}>
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '1.5rem 2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '0.75rem' }}>
          <ReplyLogo showText size={28} />
          <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0 }}>2026 Reply. Learn Luxembourgish with confidence.</p>
        </div>
      </footer>
    </div>
  );
}

const navLink: React.CSSProperties = { color: '#777', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 };
const ctaBtn: React.CSSProperties = { background: PURPLE, color: '#fff', padding: '0.55rem 1.4rem', borderRadius: 12, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 };

const SKILLS = [
  { name: 'Grammar', icon: 'G', bg: '#F0EDFF', desc: 'Verb conjugation, articles, word order with instant feedback.' },
  { name: 'Reading', icon: 'R', bg: '#E8F5E9', desc: 'Texts with vocabulary highlights and comprehension questions.' },
  { name: 'Listening', icon: 'L', bg: '#FFF8E1', desc: 'Native audio with transcripts and comprehension challenges.' },
  { name: 'Speaking', icon: 'S', bg: '#FCE4EC', desc: 'Record, compare with reference audio, self-evaluate.' },
];

const STEPS = [
  { t: 'Sign up', d: 'Create your free account in seconds.' },
  { t: 'Find your level', d: 'Quick assessment or self-select A1 to C2.' },
  { t: 'Learn your way', d: 'Solo lessons, chapters, or peer practice.' },
  { t: 'Level up', d: 'Track progress, earn XP, climb the leaderboard.' },
];

const FEATURES = [
  { i: 'T', t: 'CEFR-aligned', d: 'Curriculum organized by European standards from A1 to C2.' },
  { i: 'P', t: 'Peer practice', d: 'Find partners at your level for speaking sessions.' },
  { i: 'C', t: 'Chapter quizzes', d: 'Test your knowledge after each chapter with scored quizzes.' },
  { i: 'X', t: 'XP and streaks', d: 'Earn points, maintain streaks, unlock badges.' },
  { i: 'S', t: 'Sproochentest prep', d: 'Dedicated practice for the Luxembourg citizenship test.' },
  { i: 'M', t: 'Study planner', d: 'Get a personalized plan based on your goals and pace.' },
];
