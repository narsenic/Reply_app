import type { UserBadge, LockedBadge } from '../types/api';

interface BadgeShelfProps {
  earned: UserBadge[];
  locked: LockedBadge[];
}

export default function BadgeShelf({ earned, locked }: BadgeShelfProps) {
  return (
    <div>
      {earned.length > 0 && (
        <>
          <h3 style={sectionTitle}>Earned Badges ({earned.length})</h3>
          <div style={grid}>
            {earned.map((b) => (
              <div key={b.id} style={badgeCard}>
                <div style={iconCircle}>{b.iconUrl || '🏆'}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>{b.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{b.description}</div>
                <div style={{ fontSize: '0.7rem', color: '#6C5CE7', marginTop: '0.25rem' }}>
                  {new Date(b.earnedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <h3 style={{ ...sectionTitle, marginTop: '1.5rem' }}>Locked Badges ({locked.length})</h3>
          <div style={grid}>
            {locked.map((b) => (
              <div key={b.badgeKey} style={{ ...badgeCard, opacity: 0.5 }}>
                <div style={{ ...iconCircle, background: '#f0f0f0' }}>🔒</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#888' }}>{b.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{b.criteria}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {earned.length === 0 && locked.length === 0 && (
        <p style={{ color: '#999', fontSize: '0.88rem' }}>No badges yet. Keep learning to earn your first badge!</p>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' };
const badgeCard: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: '1rem', textAlign: 'center' as const, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const iconCircle: React.CSSProperties = { width: 48, height: 48, borderRadius: '50%', background: '#F0EDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.5rem' };
