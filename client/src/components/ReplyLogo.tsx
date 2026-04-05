interface ReplyLogoProps {
  size?: number;
  light?: boolean;
  showText?: boolean;
}

const DARK_BLUE = '#1a2744';

/**
 * Reply wordmark — dark blue, minimalist.
 * A tiny speech bubble sits subtly above the R's shoulder, very light opacity.
 * No dot, no extra shapes. Just the word and a whisper of conversation.
 */
export default function ReplyLogo({ size = 28, light = false }: ReplyLogoProps) {
  const color = light ? '#fff' : DARK_BLUE;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-start', position: 'relative', userSelect: 'none' }}>
      {/* Speech bubble — sits above the R, very subtle */}
      <svg
        width={size * 0.32}
        height={size * 0.28}
        viewBox="0 0 20 17"
        fill="none"
        style={{
          position: 'absolute',
          top: -size * 0.18,
          left: size * 0.12,
          opacity: 0.2,
        }}
      >
        <rect x="0" y="0" width="20" height="13" rx="5" fill={color} />
        <path d="M5 13 L3 17 L9 13Z" fill={color} />
      </svg>

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
    </div>
  );
}
