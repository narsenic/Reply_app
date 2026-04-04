interface StreakCounterProps {
  currentStreak: number;
  longestStreak?: number;
}

export default function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  return (
    <div style={container}>
      <span style={{ fontSize: '1.25rem' }}>🔥</span>
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</div>
        <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Streak{longestStreak !== undefined ? ` · Best: ${longestStreak}` : ''}
        </div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: '0.75rem 1rem',
};
