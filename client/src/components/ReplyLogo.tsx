interface ReplyLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

const TEAL = '#0D9488';
const ORANGE = '#F97316';

/**
 * Reply logo — two abstract figures forming an "R".
 * Teal figure (left) + orange figure (right) overlapping.
 * Matches the brand image: two rounded people shapes creating the R letterform.
 */
export default function ReplyLogo({ size = 40, showText = false, light = false }: ReplyLogoProps) {
  const textColor = light ? '#fff' : TEAL;

  return (
    <div style={{ display: 'inline-flex', flexDirection: showText ? 'column' : 'row', alignItems: 'center', gap: showText ? size * 0.15 : size * 0.25 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Teal figure — left person (forms R stem + arm) */}
        <circle cx="35" cy="14" r="14" fill={TEAL} />
        <path d="M21 32 L21 96 Q21 100 25 100 L35 100 Q39 100 39 96 L39 58 Q39 46 50 42 L54 41 Q46 50 39 58" fill={TEAL} />
        <rect x="21" y="30" width="18" height="70" rx="9" fill={TEAL} />
        {/* Teal arm curving right */}
        <path d="M39 30 C39 30 39 44 52 48 L52 48 Q39 52 39 52 L39 30Z" fill={TEAL} />

        {/* Orange figure — right person (forms R bowl) */}
        <circle cx="62" cy="16" r="13" fill={ORANGE} />
        <path d="M52 34 Q52 30 60 30 Q78 30 78 48 Q78 66 60 66 L50 66 Q48 66 46 62 L52 34Z" fill={ORANGE} />
        {/* Orange leg kicking down-right */}
        <path d="M50 62 Q48 66 44 78 L36 96 Q34 100 38 100 L48 100 Q52 100 54 96 L64 72 Q66 68 62 66 L50 66 L50 62Z" fill={ORANGE} />
      </svg>

      {showText && (
        <span style={{
          fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
          fontWeight: 700,
          fontSize: size * 0.42,
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          Reply
        </span>
      )}
    </div>
  );
}

export { TEAL, ORANGE };
