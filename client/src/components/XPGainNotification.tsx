import { useState, useEffect } from 'react';

interface XPGainNotificationProps {
  amount: number;
  description: string;
  onDone?: () => void;
}

export default function XPGainNotification({ amount, description, onDone }: XPGainNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDone?.(); }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div style={toast}>
      <span style={{ fontSize: '1.1rem' }}>⚡</span>
      <div>
        <div style={{ fontWeight: 700, color: '#6C5CE7', fontSize: '0.92rem' }}>+{amount} XP</div>
        <div style={{ fontSize: '0.78rem', color: '#888' }}>{description}</div>
      </div>
    </div>
  );
}

const toast: React.CSSProperties = {
  position: 'fixed', top: 20, right: 20, zIndex: 1000,
  display: 'flex', alignItems: 'center', gap: '0.75rem',
  background: '#fff', border: '1px solid #E8E4FF', borderRadius: 14,
  padding: '0.85rem 1.25rem', boxShadow: '0 8px 24px rgba(108,92,231,0.15)',
  animation: 'slideIn 0.3s ease',
};
