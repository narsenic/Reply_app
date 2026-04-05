interface ReplyLogoProps {
  size?: number;
  light?: boolean;
  showText?: boolean;
}

const BLUE = '#3B5998';
const SF = "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

/**
 * REPLY wordmark — medium blue, Apple SF Pro font.
 * The R is an SVG with a speech bubble counter. EPLY is rendered in the system font.
 */
export default function ReplyLogo({ size = 28, light = false }: ReplyLogoProps) {
  const color = light ? '#fff' : BLUE;
  const rSize = size * 1.18;
  const textSize = size * 0.82;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 0, userSelect: 'none', lineHeight: 1 }}>
      {/* R with speech bubble counter */}
      <svg width={rSize * 0.72} height={rSize} viewBox="0 0 72 100" fill="none" style={{ display: 'block', marginRight: -1 }}>
        {/* R outer */}
        <path d="M0 100V0h38c7 0 13 1.5 18 4.5s8.5 6.5 11 11 3.5 9.5 3.5 15-1.2 10.5-3.5 15-6 8.5-11 11S45 61 38 61H17v39H0z" fill={color} />
        {/* Speech bubble cutout — fills the R bowl */}
        <path d="M17 30.5c0-8.5 7-15.5 15.5-15.5S48 22 48 30.5 41 46 32.5 46c-2.5 0-4.8-.6-6.8-1.6L18 49l4-7c-3.2-3-5-7-5-11.5z" fill={light ? BLUE : '#fff'} />
        {/* R leg */}
        <path d="M38 55l24 45H40L17 55h21z" fill={color} />
      </svg>

      {/* EPLY in SF Pro */}
      <span style={{
        fontFamily: SF,
        fontSize: textSize,
        fontWeight: 700,
        color,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: size * 0.01,
      }}>
        EPLY
      </span>
    </div>
  );
}
