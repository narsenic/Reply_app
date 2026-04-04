interface XPDisplayProps {
  totalXp: number;
}

export default function XPDisplay({ totalXp }: XPDisplayProps) {
  return (
    <div style={container}>
      <span style={{ fontSize: '1.25rem' }}>⚡</span>
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>{totalXp.toLocaleString()}</div>
        <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total XP</div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  background: '#F8F7FF', border: '1px solid #E8E4FF', borderRadius: 12, padding: '0.75rem 1rem',
};
