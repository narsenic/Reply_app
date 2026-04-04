interface ReplyLogoProps {
  size?: number;
  color?: string;
  light?: boolean;
  showText?: boolean;
}

/**
 * Reply wordmark logo.
 * The "R" is oversized and contains a small speech-bubble cutout.
 * "eply" follows in lighter weight at smaller size.
 */
export default function ReplyLogo({ size = 32, color = '#6C5CE7', light = false }: ReplyLogoProps) {
  const rSize = size * 1.15;
  const restSize = size * 0.62;
  const textColor = light ? '#fff' : '#1d1d1f';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0, lineHeight: 1, userSelect: 'none' }}>
      {/* Big R with speech bubble */}
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{
          fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
          fontWeight: 700,
          fontSize: rSize,
          color: color,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}>R</span>
        {/* Tiny speech bubble sitting at the leg of the R */}
        <svg
          width={rSize * 0.28}
          height={rSize * 0.24}
          viewBox="0 0 20 18"
          fill="none"
          style={{ position: 'absolute', bottom: rSize * 0.08, right: -rSize * 0.02 }}
        >
          <rect x="0" y="0" width="20" height="14" rx="4" fill={color} opacity="0.25" />
          <polygon points="4,14 8,18 10,14" fill={color} opacity="0.25" />
        </svg>
      </span>
      {/* "eply" in lighter weight */}
      <span style={{
        fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
        fontWeight: 400,
        fontSize: restSize,
        color: textColor,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        opacity: 0.85,
      }}>eply</span>
    </div>
  );
}
