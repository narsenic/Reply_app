import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{ width: 36, height: 36, borderRadius: 12, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: '1rem' }}>💬</span>
    </div>
    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}>Reply</span>
  </div>
);

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #f0f0f0', zIndex: 100 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a href="#skills" style={nl}>Skills</a>
            <a href="#how" style={nl}>How it works</a>
            <a href="#testimonials" style={nl}>Reviews</a>
            {isAuthenticated ? (
              <Link to="/dashboard" style={pb}>Dashboard</Link>
            ) : (
              <><Link to="/login" style={nl}>Log in</Link><Link to="/register" style={pb}>Start free</Link></>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(170deg, #fafafa 0%, #F0EDFF 40%, #E8E4FF 70%, #fafafa 100%)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '6rem 1.5rem 5rem', display: 'flex', gap: '3.5rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ flex: '1 1 440px' }}>
            <div style={{ display: 'inline-block', background: '#fff', color: '#6C5CE7', padding: '0.35rem 1rem', borderRadius: 24, fontSize: '0.78rem', fontWeight: 600, marginBottom: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>✨ Free to start · CEFR A1–C2</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.4rem, 5vw, 3.4rem)', fontWeight: 700, lineHeight: 1.08, color: '#1a1a1a', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
              Learn Luxembourgish.<br /><span style={{ color: '#6C5CE7' }}>Your way.</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#666', lineHeight: 1.75, marginBottom: '2.25rem', maxWidth: 480 }}>
              Structured lessons in Grammar, Reading, Listening & Speaking — solo or with a group. Like a real classroom, but on your schedule.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '2.5rem' }}>
              <Link to="/register" style={{ background: '#6C5CE7', color: '#fff', padding: '0.85rem 2rem', borderRadius: 14, textDecoration: 'none', fontSize: '0.95rem', fontWeight: 700, boxShadow: '0 4px 16px rgba(108,92,231,0.25)' }}>Get started free →</Link>
              <Link to="/assessment" style={{ background: '#fff', color: '#1a1a1a', padding: '0.85rem 2rem', borderRadius: 14, textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, border: '1.5px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>Test your level</Link>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: '1.25rem' }}>Trusted by learners worldwide 🌍</p>
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' as const }}>
              {[['A1–C2', 'CEFR levels'], ['4', 'Skill areas'], ['Solo + Group', 'Modes']].map(([n, l]) => (
                <div key={l}><div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.1rem' }}>{n}</div><div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 2 }}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 340px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 310, borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 60px rgba(108,92,231,0.12), 0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', background: '#fff' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6C5CE7', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#A29BFE', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DDD', display: 'inline-block' }} />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.75rem', fontWeight: 600 }}>📝 Grammar · A1</p>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.3rem' }}>Complete the sentence:</p>
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '1.25rem' }}>"Ech ___ Lëtzebuergesch."</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem 0.85rem', border: '1.5px solid #6C5CE7', borderRadius: 12, fontSize: '0.88rem', color: '#6C5CE7', background: '#F8F7FF', fontWeight: 600 }}>schwätzen ✓</div>
                  <div style={{ padding: '0.6rem 0.85rem', border: '1.5px solid #f0f0f0', borderRadius: 12, fontSize: '0.88rem', color: '#888' }}>schwätzt</div>
                  <div style={{ padding: '0.6rem 0.85rem', border: '1.5px solid #f0f0f0', borderRadius: 12, fontSize: '0.88rem', color: '#888' }}>geschwat</div>
                </div>
                <div style={{ background: '#F0EDFF', borderRadius: 12, padding: '0.6rem 0.85rem', fontSize: '0.78rem', color: '#6C5CE7', fontWeight: 500 }}>✓ Correct! "Schwätzen" = to speak</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' as const }}>
          {[
            { icon: '🎓', text: 'CEFR-aligned curriculum' },
            { icon: '🔒', text: 'Free forever to start' },
            { icon: '⭐', text: '4 skill areas covered' },
            { icon: '🌐', text: 'Learn anytime, anywhere' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.82rem', color: '#888', fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section id="skills" style={{ padding: '5rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' as const }}>FOUR PILLARS</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>Master every skill</h2>
          <p style={{ textAlign: 'center' as const, color: '#888', fontSize: '0.95rem', marginBottom: '3rem', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>Build real fluency across all four language skills with structured, CEFR-aligned lessons.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {skills.map(s => (
              <div key={s.name} style={{ background: '#fafafa', borderRadius: 16, padding: '1.75rem', border: '1px solid #f0f0f0', transition: 'box-shadow 0.2s, transform 0.2s' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a' }}>{s.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#777', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" style={{ padding: '5rem 0', background: '#fafafa' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' as const }}>SIMPLE</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>Start in 4 steps</h2>
          <p style={{ textAlign: 'center' as const, color: '#888', fontSize: '0.95rem', marginBottom: '3rem', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>Getting started takes less than a minute. No credit card required.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', maxWidth: 920, margin: '0 auto' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' as const, background: '#fff', borderRadius: 16, padding: '2rem 1.5rem', border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#6C5CE7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 700, fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif" }}>{i + 1}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem', color: '#1a1a1a' }}>{s.t}</h3>
                <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.55, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: '5rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' as const }}>WHAT LEARNERS SAY</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '3rem' }}>Loved by language learners</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: '#fafafa', borderRadius: 16, padding: '1.75rem', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', gap: '0.15rem', marginBottom: '1rem' }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= t.stars ? '#F59E0B' : '#ddd', fontSize: '0.95rem' }}>★</span>)}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.7, marginBottom: '1.25rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff', fontWeight: 700 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#999' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 0', background: '#fafafa' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem' }}>
          <p style={{ textAlign: 'center' as const, fontSize: '0.72rem', fontWeight: 700, color: '#6C5CE7', letterSpacing: '0.12em', marginBottom: '0.5rem', textTransform: 'uppercase' as const }}>WHY REPLY</p>
          <h2 style={{ textAlign: 'center' as const, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '3rem' }}>Built for real learners</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {feats.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: 16, background: '#fff', border: '1px solid #f0f0f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{f.i}</div>
                <div><h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem', color: '#1a1a1a' }}>{f.t}</h4><p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.55, margin: 0 }}>{f.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '5rem 1.5rem', textAlign: 'center' as const }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Ready to start?</h2>
        <p style={{ color: '#999', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>Join thousands of learners mastering Luxembourgish. Free forever — no credit card needed.</p>
        <Link to="/register" style={{ display: 'inline-block', background: '#6C5CE7', color: '#fff', padding: '0.9rem 2.5rem', borderRadius: 14, textDecoration: 'none', fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 24px rgba(108,92,231,0.35)' }}>Create free account →</Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '1.5rem', background: '#fafafa' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '0.75rem' }}>
          <Logo />
          <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0 }}>© 2026 Reply. Learn Luxembourgish with confidence.</p>
        </div>
      </footer>
    </div>
  );
}

const nl: React.CSSProperties = { color: '#666', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 };
const pb: React.CSSProperties = { background: '#6C5CE7', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: 12, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 };

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

const testimonials = [
  { name: 'Sophie M.', role: 'Expat in Luxembourg', stars: 5, quote: 'Reply made learning Luxembourgish so much easier. The structured approach and instant feedback keep me motivated every day.', color: '#6C5CE7' },
  { name: 'Thomas K.', role: 'Language enthusiast', stars: 5, quote: 'The group sessions are fantastic. Learning with others makes it feel like a real classroom experience.', color: '#E17055' },
  { name: 'Maria L.', role: 'Student', stars: 4, quote: 'I went from zero to B1 in just a few months. The CEFR-aligned curriculum really works.', color: '#00B894' },
];

const feats = [
  { i: '🎯', t: 'CEFR-aligned', d: 'Curriculum organized by European standards.' },
  { i: '👥', t: 'Group learning', d: 'Live sessions with real-time chat.' },
  { i: '📊', t: 'Progress tracking', d: 'Visual dashboards for every skill.' },
  { i: '🌍', t: 'Multi-language', d: 'Starting with Luxembourgish, expanding soon.' },
  { i: '📚', t: 'Rich content', d: 'PDFs, audio, video, and text materials.' },
  { i: '⚡', t: 'Instant feedback', d: 'Know immediately if you got it right.' },
];
