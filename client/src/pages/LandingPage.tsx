import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={navInner}>
          <Link to="/" style={logoStyle}>
            <span style={logoIcon}>🇱🇺</span>
            <span style={logoText}>Schwätzen</span>
          </Link>
          <div style={navLinks}>
            {isAuthenticated ? (
              <Link to="/dashboard" style={navBtnPrimary}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={navLink}>Login</Link>
                <Link to="/register" style={navBtnPrimary}>Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={heroStyle}>
        <div style={heroContent}>
          <span style={heroBadge}>🎓 CEFR Levels A1 – C2</span>
          <h1 style={heroTitle}>Learn Luxembourgish<br />the way it's actually spoken</h1>
          <p style={heroSub}>
            Master Grammar, Reading, Listening, and Speaking through structured lessons 
            that feel like real classroom learning — solo or with a group.
          </p>
          <div style={heroBtns}>
            <Link to="/register" style={heroBtn}>Start Learning Free →</Link>
            <Link to="/assessment" style={heroBtnOutline}>Test Your Level</Link>
          </div>
          <p style={heroNote}>No credit card required. Join learners from around the world.</p>
        </div>
        <div style={heroVisual}>
          <div style={heroCard}>
            <div style={heroCardHeader}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <span style={heroCardTitle}>Grammar · A1</span>
            </div>
            <div style={heroCardBody}>
              <p style={heroCardQ}>Select the correct verb form:</p>
              <p style={heroCardPrompt}>"Ech ___ Lëtzebuergesch."</p>
              <div style={heroCardOpts}>
                <div style={heroOptCorrect}>✓ schwätzen</div>
                <div style={heroOpt}>schwätzt</div>
                <div style={heroOpt}>schwätze</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Four pillars of language mastery</h2>
        <p style={sectionSub}>Each skill area has dedicated lessons, exercises, and progress tracking</p>
        <div style={skillGrid}>
          {skills.map(s => (
            <div key={s.name} style={skillCard}>
              <div style={{ ...skillIconWrap, background: s.bg }}><span style={{ fontSize: '2rem' }}>{s.icon}</span></div>
              <h3 style={skillName}>{s.name}</h3>
              <p style={skillDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...sectionStyle, background: '#f8fafc' }}>
        <h2 style={sectionTitle}>How it works</h2>
        <div style={stepsGrid}>
          {steps.map((step, i) => (
            <div key={i} style={stepCard}>
              <div style={stepNum}>{i + 1}</div>
              <h3 style={stepTitle}>{step.title}</h3>
              <p style={stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Built for serious learners</h2>
        <div style={featGrid}>
          {features.map((f, i) => (
            <div key={i} style={featCard}>
              <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
              <div>
                <h4 style={featTitle}>{f.title}</h4>
                <p style={featDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={ctaSection}>
        <h2 style={ctaTitle}>Ready to start speaking Luxembourgish?</h2>
        <p style={ctaSub}>Join now and get your proficiency level assessed in minutes.</p>
        <Link to="/register" style={ctaBtn}>Create Free Account</Link>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerInner}>
          <div style={footerBrand}>
            <span style={logoIcon}>🇱🇺</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Schwätzen</span>
          </div>
          <p style={footerText}>© 2026 Schwätzen. Learn Luxembourgish with confidence.</p>
        </div>
      </footer>
    </div>
  );
}

/* ---- Data ---- */
const skills = [
  { name: 'Grammar', icon: '📝', bg: '#eff6ff', desc: 'Master verb conjugation, articles, word order, and sentence structure through interactive exercises.' },
  { name: 'Reading', icon: '📖', bg: '#f0fdf4', desc: 'Build comprehension with Luxembourgish texts, vocabulary highlights, and guided questions.' },
  { name: 'Listening', icon: '🎧', bg: '#fef3c7', desc: 'Train your ear with native audio, transcripts, and comprehension challenges.' },
  { name: 'Speaking', icon: '🗣️', bg: '#fce7f3', desc: 'Practice pronunciation with recording, reference audio, and instant feedback.' },
];

const steps = [
  { title: 'Create your account', desc: 'Sign up in seconds with just your email.' },
  { title: 'Assess your level', desc: 'Take a quick test or self-select your CEFR level (A1–C2).' },
  { title: 'Start learning', desc: 'Access structured lessons tailored to your level across all 4 skills.' },
  { title: 'Track your progress', desc: 'Watch your skills grow with visual progress tracking and level-up milestones.' },
];

const features = [
  { icon: '🎯', title: 'CEFR-aligned curriculum', desc: 'Content organized by A1–C2 levels, matching European language standards.' },
  { icon: '👥', title: 'Solo & group modes', desc: 'Learn at your own pace or join live group sessions with real-time chat.' },
  { icon: '📊', title: 'Progress dashboard', desc: 'Visual progress bars for each skill, lesson history, and level-up notifications.' },
  { icon: '🌍', title: 'Multi-language ready', desc: 'Starting with Luxembourgish, expanding to French, English, and more.' },
  { icon: '📱', title: 'Responsive design', desc: 'Learn on any device — desktop, tablet, or mobile.' },
  { icon: '🔒', title: 'Secure accounts', desc: 'Email verification, encrypted passwords, and account protection.' },
];

/* ---- Styles ---- */
const navStyle: React.CSSProperties = { position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e5e7eb', zIndex: 100 };
const navInner: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#1a1a2e' };
const logoIcon: React.CSSProperties = { fontSize: '1.5rem' };
const logoText: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' };
const navLinks: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem' };
const navLink: React.CSSProperties = { color: '#555', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 };
const navBtnPrimary: React.CSSProperties = { background: '#2563eb', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 };

const heroStyle: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem 3rem', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' };
const heroContent: React.CSSProperties = { flex: '1 1 400px' };
const heroBadge: React.CSSProperties = { display: 'inline-block', background: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' };
const heroTitle: React.CSSProperties = { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.15, color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.02em' };
const heroSub: React.CSSProperties = { fontSize: '1.1rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '520px' };
const heroBtns: React.CSSProperties = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' };
const heroBtn: React.CSSProperties = { background: '#2563eb', color: '#fff', padding: '0.8rem 1.75rem', borderRadius: '10px', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 };
const heroBtnOutline: React.CSSProperties = { background: '#fff', color: '#2563eb', padding: '0.8rem 1.75rem', borderRadius: '10px', textDecoration: 'none', fontSize: '1rem', fontWeight: 600, border: '2px solid #2563eb' };
const heroNote: React.CSSProperties = { fontSize: '0.8rem', color: '#94a3b8' };
const heroVisual: React.CSSProperties = { flex: '1 1 320px', display: 'flex', justifyContent: 'center' };
const heroCard: React.CSSProperties = { background: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', width: '320px', overflow: 'hidden' };
const heroCardHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' };
const heroCardTitle: React.CSSProperties = { fontWeight: 600, fontSize: '0.9rem', color: '#334155' };
const heroCardBody: React.CSSProperties = { padding: '1.25rem' };
const heroCardQ: React.CSSProperties = { fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' };
const heroCardPrompt: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' };
const heroCardOpts: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const heroOpt: React.CSSProperties = { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', color: '#475569' };
const heroOptCorrect: React.CSSProperties = { ...heroOpt, borderColor: '#22c55e', background: '#f0fdf4', color: '#166534', fontWeight: 600 };

const sectionStyle: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem' };
const sectionTitle: React.CSSProperties = { fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', color: '#0f172a', marginBottom: '0.5rem' };
const sectionSub: React.CSSProperties = { textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem' };

const skillGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' };
const skillCard: React.CSSProperties = { padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' };
const skillIconWrap: React.CSSProperties = { width: '60px', height: '60px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' };
const skillName: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' };
const skillDesc: React.CSSProperties = { fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 };

const stepsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' };
const stepCard: React.CSSProperties = { textAlign: 'center', padding: '1.25rem' };
const stepNum: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 700, fontSize: '1.1rem' };
const stepTitle: React.CSSProperties = { fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' };
const stepDesc: React.CSSProperties = { fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 };

const featGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' };
const featCard: React.CSSProperties = { display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e5e7eb' };
const featTitle: React.CSSProperties = { fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a', fontSize: '0.95rem' };
const featDesc: React.CSSProperties = { fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, margin: 0 };

const ctaSection: React.CSSProperties = { textAlign: 'center', padding: '4rem 1.5rem', background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)', color: '#fff' };
const ctaTitle: React.CSSProperties = { fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' };
const ctaSub: React.CSSProperties = { fontSize: '1.05rem', opacity: 0.9, marginBottom: '2rem' };
const ctaBtn: React.CSSProperties = { display: 'inline-block', background: '#fff', color: '#2563eb', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 };

const footerStyle: React.CSSProperties = { borderTop: '1px solid #e5e7eb', padding: '2rem 1.5rem' };
const footerInner: React.CSSProperties = { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' };
const footerBrand: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const footerText: React.CSSProperties = { fontSize: '0.8rem', color: '#94a3b8', margin: 0 };
