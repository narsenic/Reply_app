interface ReplyLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

const BLUE = '#0D9488';
const ORANGE = '#F97316';

/**
 * Reply logo — two abstract figures forming an "R" shape.
 * Blue figure on left (learner), orange figure on right (tutor/response).
 * Together they represent conversation and connection.
 */
export default function ReplyLogo({ size = 36, showText = false, light = false }: ReplyLogoProps) {
  const textColor = light ? '#fff' : BLUE;
  const iconSize = size;
  const textSize = size * 0.52;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.25 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Blue figure — left person forming the R's stem and arm */}
        {/* Head */}
        <circle cx="34" cy="16" r="13" fill={BLUE} />
        {/* Body — vertical stem + curved arm reaching right */}
        <path d="M27 30 L27 92 Q27 96 31 96 L37 96 Q41 96 41 92 L41 62 L41 48 Q41 38 52 36 L56 35"
          stroke={BLUE} strokeWidth="0" fill={BLUE} />
        {/* Simplified: stem rectangle + arm curve */}
        <rect x="24" y="28" width="16" height="68" rx="8" fill={BLUE} />
        <path d="M40 28 Q40 28 40 42 Q40 52 54 52 L40 52 L40 28z" fill={BLUE} />
        
        {/* Orange figure — right person forming the R's bowl/bump */}
        {/* Head */}
        <circle cx="62" cy="18" r="12" fill={ORANGE} />
        {/* Body — curved shape that creates the R's counter */}
        <path d="M54 32 Q54 32 68 32 Q82 32 82 48 Q82 64 68 64 Q56 64 52 58 L40 92 Q38 96 42 96 L50 96 Q52 96 54 92 L62 72 Q64 68 68 64"
          fill={ORANGE} />
      </svg>

      {showText && (
        <span style={{
          fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
          fontWeight: 700,
          fontSize: textSize,
          color: textColor,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          Reply
        </span>
      )}
    </div>
  );
}

export { BLUE, ORANGE };
