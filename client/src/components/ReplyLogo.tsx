interface ReplyLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

const BLUE = '#1B3FBF';

/**
 * Reply logo — bold blue wordmark.
 * Oversized "R" with a speech bubble cutout in its counter space.
 * "EPLY" follows in smaller uppercase.
 */
export default function ReplyLogo({ size = 32, showText = true, light = false }: ReplyLogoProps) {
  const color = light ? '#fff' : BLUE;
  const rHeight = size;
  const eplySize = size * 0.58;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 0, lineHeight: 1, userSelect: 'none' }}>
      {/* Big R with speech bubble cutout */}
      <svg width={rHeight * 0.82} height={rHeight} viewBox="0 0 82 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* R body */}
        <path
          d="M0 100V0h42c7.5 0 14 1.4 19.5 4.2 5.5 2.8 9.8 6.8 12.8 12 3 5.2 4.5 11.2 4.5 18 0 6.8-1.5 12.8-4.5 18-3 5.2-7.3 9.2-12.8 12C56 67 49.5 68.4 42 68.4H18V100H0zM18 52h22c5.5 0 9.8-1.6 13-4.8 3.2-3.2 4.8-7.6 4.8-13.2 0-5.6-1.6-10-4.8-13.2C49.8 17.6 45.5 16 40 16H18v36z"
          fill={color}
        />
        {/* Speech bubble cutout in the R's counter */}
        <ellipse cx="40" cy="34" rx="12" ry="10" fill={light ? BLUE : '#fff'} />
        {/* Bubble tail */}
        <polygon points="32,42 28,50 38,43" fill={light ? BLUE : '#fff'} />
      </svg>

      {/* EPLY text */}
      {showText !== false && (
        <span style={{
          fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
          fontWeight: 800,
          fontSize: eplySize,
          color,
          letterSpacing: '0.02em',
          lineHeight: 1,
          textTransform: 'uppercase',
          marginBottom: size * 0.01,
        }}>
          EPLY
        </span>
      )}
    </div>
  );
}

export { BLUE };
