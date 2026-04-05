interface ReplyLogoProps {
  size?: number;
  light?: boolean;
  showText?: boolean;
}

/**
 * Reply — pure text wordmark. Minimalist, sophisticated.
 * Uses the system SF Pro / Helvetica Neue stack for that Apple-clean feel.
 * The "R" is slightly heavier to anchor the mark. A tiny dot accent adds character.
 */
export default function ReplyLogo({ size = 28, light = false }: ReplyLogoProps) {
  const color = light ? '#fff' : '#1d1d1f';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.2, userSelect: 'none' }}>
      <span style={{
        fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
        fontSize: size,
        fontWeight: 700,
        color,
        letterSpacing: '-0.04em',
        lineHeight: 1,
      }}>
        Reply
      </span>
      <span style={{
        width: size * 0.18,
        height: size * 0.18,
        borderRadius: '50%',
        background: '#2B3990',
        display: 'inline-block',
        marginBottom: size * 0.02,
        opacity: light ? 0.9 : 1,
      }} />
    </div>
  );
}
