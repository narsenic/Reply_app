import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={navInner}>
          <Link to="/" style={logoLink}>
            <div style={logoCircle}>Lë</div>
            <span style={logoText}>Schwätzen</span>
          </Link>
          <div style={navLinks}>
            <a href="#skills" style={navLink}>Skills</a>
            <a href="#how" style={navLink}>How it works</a>
            {isAuthenticated ? (
              <Link to="/dashboard" style={navBtnPrimary}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={navLink}>Log in</Link>
                <Link to="/register" style={navBtnPrimary}>Get started — it's free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={heroSection}>
        <div style={heroInner}>
          <div style={heroLeft}>
            <div style={heroPill}>🇱🇺 The #1 way to learn Luxembourgish</div>
            <h1 style={heroH1}>Schwätzen.<br /><span style={heroAccent}>Speak Luxembourgish</span><br />with confidence.</h1>
            <p style={heroP}>Structured lessons in Grammar, Reading, Listening & Speaking — tailored to your CEFR level. Learn solo or join a group, just like a real classroom.</p>
            <div style={heroCtas}>
              <Link to="/register" style={ctaPrimary}>Start learning for free</Link>
              <Link to="/assessment" style={ctaSecondary}>Take a level test</Link>
            </div>
            <div style={heroStats}>
              <div style={stat}><span style={statNum}>A1–C2</span><span style={statLabel}>CEFR levels</span></div>
              <div style={statDivider} />
              <div style={stat}><span style={statNum}>4</span><span style={statLabel}>Skill areas</span></div>
              <div style={statDivider} />
              <div style={stat}><span style={statNum}>Solo + Group</span><span style={statLabel}>Learning modes</span></div>
            </div>
          </div>
          <div style={heroRight}>
            <div style={mockCard}>
              <div style={mockHeader}><span style={mockDot('#58cc02')} /><span style={mockDot('#ffc800')} /><span style={mockDot('#ff4b4b')} /></div>
              <div style={mockBody}>
                <p style={mockSkill}>📝 Grammar · Level A1</p>
                <p style={mockQ}>Complete the sentence:</p>
                <p style={mockPrompt}>"Ech ___ Lëtzebuergesch."</p>
                <div style={mockOpts}>
                  <div style={mockOptCorrect}>schwätzen ✓</div>
                  <div style={mockOpt}>schwätzt</div>
                  <div style={mockOpt}>geschwat</div>
                </div>
                <div style={mockFeedback}>Correct! "Schwätzen" means "to speak".</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" style={sectionWrap}>
        <div style={sectionInner}>
          <p style={sectionEyebrow}>FOUR PILLARS</p>
          <h2 style={sectionH2}>Master every aspect of the language</h2>
          <div style={skillsGrid}>
            {skillsData.map(s => (
              <div key={s.name} style={{ ...skillCard, borderTop: `4px solid ${s.color}` }}>
                <div style={{ ...skillIcon, background: s.bg }}>{s.icon}</div>
                <h3 style={skillTitle}>{s.name}</h3>
                <p style={skillDesc}>{s.desc}</p>
                <div style={skillTags}>{s.tags.map(t => <span key={t} style={skillTag}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ ...sectionWrap, background: '#fff' }}>
        <div style={sectionInner}>
          <p style={sectionEyebrow}>SIMPLE PROCESS</p>
          <h2 style={sectionH2}>Start speaking in 4 steps</h2>
          <div style={stepsRow}>
            {stepsData.map((step, i) => (
              <div key={i} style={stepItem}>
                <div style={stepCircle}>{i + 1}</div>
                {i < stepsData.length - 1 && <div style={stepLine} />}
                <h3 style={stepH3}>{step.title}</h3>
                <p style={stepP}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={sectionWrap}>
        <div style={sectionInner}>
          <p style={sectionEyebrow}>WHY SCHWÄTZEN</p>
          <h2 style={sectionH2}>Built for real language learners</h2>
          <div style={featuresGrid}>
            {featuresData.map((f, i) => (
              <div key={i} style={featureCard}>
                <div style={featureIcon}>{f.icon}</div>
                <h4 style={featureTitle}>{f.title}</h4>
                <p style={featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={ctaSection}>
        <div style={ctaInner}>
          <h2 style={ctaH2}>Moien! Ready to learn Luxembourgish?</h2>
          <p style={ctaP}>Free to start. No credit card needed. Join learners worldwide.</p>
          <Link to="/register" style={ctaFinalBtn}>Create your free account →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerInner}>
          <div style={footerLeft}>
            <div style={{ ...logoCircle, width: '28px', height: '28px', fontSize: '0.7rem' }}>Lë</div>
            <span style={{ fontWeight: 700, color: '#44403c' }}>Schwätzen</span>
          </div>
          <p style={footerCopy}>© 2026 Schwätzen. Learn Luxembourgish with confidence.</p>
        </div>
      </footer>
    </div>
  );
}

/* ---- Data ---- */
const skillsData = [
  { name: 'Grammar', icon: '📝', color: '#58cc02', bg: '#e8f5e1', desc: 'Master verb conjugation, articles, word order, and sentence structure.', tags: ['Exercises', 'Instant feedback', 'Explanations'] },
  { name: 'Reading', icon: '📖', color: '#ce82ff', bg: '#f3e8ff', desc: 'Build comprehension with texts, vocabulary highlights, and guided questions.', tags: ['Passages', 'Vocabulary', 'Comprehension'] },
  { name: 'Listening', icon: '🎧', color: '#ffc800', bg: '#fff8e1', desc: 'Train your ear with native audio, transcripts, and comprehension challenges.', tags: ['Audio', 'Transcripts', 'Replay'] },
  { name: 'Speaking', icon: '🗣️', color: '#ff4b4b', bg: '#ffe8e8', desc: 'Practice pronunciation with recording, reference audio, and instant scoring.', tags: ['Record', 'Compare', 'Score'] },
];

const stepsData = [
  { title: 'Sign up', desc: 'Create your free account in seconds.' },
  { title: 'Find your level', desc: 'Take a quick assessment or self-select A1–C2.' },
  { title: 'Learn your way', desc: 'Solo lessons or live group sessions with chat.' },
  { title: 'Level up', desc: 'Track progress and advance through CEFR levels.' },
];

const featuresData = [
  { icon: '🎯', title: 'CEFR-aligned', desc: 'Curriculum organized by A1–C2 European standards.' },
  { icon: '👥', title: 'Group learning', desc: 'Join live sessions with real-time chat.' },
  { icon: '📊', title: 'Progress tracking', desc: 'Visual dashboards for every skill area.' },
  { icon: '🌍', title: 'Multi-language', desc: 'Starting with Luxembourgish, expanding soon.' },
  { icon: '📚', title: 'Rich curriculum', desc: 'Upload PDFs, audio, video, and text materials.' },
  { icon: '⚡', title: 'Instant feedback', desc: 'Know immediately if your answer is correct.' },
];

/* ---- Styles ---- */
const navStyle: React.CSSProperties = { position: 'sticky', top: 0, background: 'rgba(250,250,249,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e7e5e4', zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: '1120px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoLink: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' };
const logoCircle: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #58cc02, #46a302)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '-0.02em' };
const logoText: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 800, color: '#1c1917', letterSpacing: '-0.03em' };
const navLinks: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1.5rem' };
const navLink: React.CSSProperties = { color: '#57534e', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 };
const navBtnPrimary: React.CSSProperties = { background: '#58cc02', color: '#fff', padding: '0.55rem 1.3rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700, border: '2px solid #46a302' };

const heroSection: React.CSSProperties = { background: 'linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)' };
const heroInner: React.CSSProperties = { maxWidth: '1120px', margin: '0 auto', padding: '5rem 1.5rem 4rem', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' };
const heroLeft: React.CSSProperties = { flex: '1 1 440px' };
const heroPill: React.CSSProperties = { display: 'inline-block', background: '#e8f5e1', color: '#2d7a00', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' };
const heroH1: React.CSSProperties = { fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.12, color: '#1c1917', marginBottom: '1.5rem', letterSpacing: '-0.03em' };
const heroAccent: React.CSSProperties = { color: '#58cc02' };
const heroP: React.CSSProperties = { fontSize: '1.1rem', color: '#57534e', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '480px' };
const heroCtas: React.CSSProperties = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' };
const ctaPrimary: React.CSSProperties = { background: '#58cc02', color: '#fff', padding: '0.85rem 2rem', borderRadius: '14px', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700, border: '2px solid #46a302', boxShadow: '0 4px 14px rgba(88,204,2,0.3)' };
const ctaSecondary: React.CSSProperties = { background: '#fff', color: '#1c1917', padding: '0.85rem 2rem', borderRadius: '14px', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600, border: '2px solid #d6d3d1' };
const heroStats: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' };
const stat: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const statNum: React.CSSProperties = { fontWeight: 800, fontSize: '1rem', color: '#1c1917' };
const statLabel: React.CSSProperties = { fontSize: '0.75rem', color: '#a8a29e', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const statDivider: React.CSSProperties = { width: '1px', height: '30px', background: '#d6d3d1' };
const heroRight: React.CSSProperties = { flex: '1 1 340px', display: 'flex', justifyContent: 'center' };

const mockCard: React.CSSProperties = { width: '320px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.12)', border: '1px solid #e7e5e4', background: '#fff' };
const mockHeader: React.CSSProperties = { display: 'flex', gap: '6px', padding: '12px 16px', background: '#fafaf9', borderBottom: '1px solid #f5f5f4' };
const mockDot = (c: string): React.CSSProperties => ({ width: '10px', height: '10px', borderRadius: '50%', background: c, display: 'inline-block' });
const mockBody: React.CSSProperties = { padding: '1.25rem' };
const mockSkill: React.CSSProperties = { fontSize: '0.8rem', color: '#a8a29e', marginBottom: '0.75rem', fontWeight: 600 };
const mockQ: React.CSSProperties = { fontSize: '0.85rem', color: '#78716c', marginBottom: '0.35rem' };
const mockPrompt: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', marginBottom: '1rem' };
const mockOpts: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' };
const mockOpt: React.CSSProperties = { padding: '0.6rem 0.85rem', border: '2px solid #e7e5e4', borderRadius: '12px', fontSize: '0.9rem', color: '#57534e' };
const mockOptCorrect: React.CSSProperties = { padding: '0.6rem 0.85rem', border: '2px solid #58cc02', borderRadius: '12px', fontSize: '0.9rem', color: '#2d7a00', background: '#e8f5e1', fontWeight: 600 };
const mockFeedback: React.CSSProperties = { background: '#e8f5e1', borderRadius: '10px', padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#2d7a00', fontWeight: 500 };

const sectionWrap: React.CSSProperties = { padding: '5rem 0' };
const sectionInner: React.CSSProperties = { maxWidth: '1120px', margin: '0 auto', padding: '0 1.5rem' };
const sectionEyebrow: React.CSSProperties = { textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#58cc02', letterSpacing: '0.12em', marginBottom: '0.5rem' };
const sectionH2: React.CSSProperties = { textAlign: 'center', fontSize: '1.85rem', fontWeight: 800, color: '#1c1917', marginBottom: '3rem', letterSpacing: '-0.02em' };

const skillsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' };
const skillCard: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e7e5e4' };
const skillIcon: React.CSSProperties = { width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' };
const skillTitle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.5rem' };
const skillDesc: React.CSSProperties = { fontSize: '0.88rem', color: '#78716c', lineHeight: 1.6, marginBottom: '1rem' };
const skillTags: React.CSSProperties = { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' };
const skillTag: React.CSSProperties = { background: '#f5f5f4', color: '#78716c', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 };

const stepsRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxWidth: '900px', margin: '0 auto' };
const stepItem: React.CSSProperties = { textAlign: 'center', position: 'relative' };
const stepCircle: React.CSSProperties = { width: '48px', height: '48px', borderRadius: '50%', background: '#58cc02', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 800, fontSize: '1.15rem', border: '3px solid #46a302' };
const stepLine: React.CSSProperties = { display: 'none' };
const stepH3: React.CSSProperties = { fontWeight: 700, color: '#1c1917', marginBottom: '0.4rem', fontSize: '1rem' };
const stepP: React.CSSProperties = { fontSize: '0.85rem', color: '#78716c', lineHeight: 1.5 };

const featuresGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' };
const featureCard: React.CSSProperties = { display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '14px', background: '#fff', border: '1px solid #e7e5e4' };
const featureIcon: React.CSSProperties = { fontSize: '1.5rem', flexShrink: 0, width: '44px', height: '44px', background: '#f5f5f4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const featureTitle: React.CSSProperties = { fontWeight: 700, color: '#1c1917', marginBottom: '0.2rem', fontSize: '0.95rem' };
const featureDesc: React.CSSProperties = { fontSize: '0.85rem', color: '#78716c', lineHeight: 1.5, margin: 0 };

const ctaSection: React.CSSProperties = { background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)', padding: '5rem 1.5rem', textAlign: 'center' };
const ctaInner: React.CSSProperties = { maxWidth: '600px', margin: '0 auto' };
const ctaH2: React.CSSProperties = { fontSize: '1.85rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em' };
const ctaP: React.CSSProperties = { fontSize: '1.05rem', color: '#a8a29e', marginBottom: '2rem' };
const ctaFinalBtn: React.CSSProperties = { display: 'inline-block', background: '#58cc02', color: '#fff', padding: '0.9rem 2.25rem', borderRadius: '14px', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700, border: '2px solid #46a302', boxShadow: '0 4px 20px rgba(88,204,2,0.35)' };

const footerStyle: React.CSSProperties = { borderTop: '1px solid #e7e5e4', padding: '1.5rem', background: '#fafaf9' };
const footerInner: React.CSSProperties = { maxWidth: '1120px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' };
const footerLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const footerCopy: React.CSSProperties = { fontSize: '0.78rem', color: '#a8a29e', margin: 0 };
