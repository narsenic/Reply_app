interface ReplyLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
  light?: boolean;
}

export default function ReplyLogo({ size = 36, color = '#6C5CE7', showText = false, light = false }: ReplyLogoProps) {
  const textColor = light ? '#fff' : '#1a1a1a';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.22 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Speech bubble shape as background */}
        <path
          d="M10 20C10 11.2 17.2 4 26 4h68c8.8 0 16 7.2 16 16v56c0 8.8-7.2 16-16 16H50l-20 22V92H26c-8.8 0-16-7.2-16-16V20z"
          fill={color}
        />
        {/* Clean bold R */}
        <path
          d="M36 82V28h24c4.8 0 8.8.8 12 2.4 3.2 1.6 5.6 3.8 7.2 6.8 1.6 2.8 2.4 6.2 2.4 10 0 3.8-.8 7.2-2.4 10-1.6 2.8-4 5-7.2 6.6-3.2 1.6-7.2 2.4-12 2.4H50v15.8H36zm14-27h9.6c2.8 0 5-.8 6.4-2.4 1.6-1.6 2.4-3.8 2.4-6.4 0-2.6-.8-4.8-2.4-6.4-1.4-1.6-3.6-2.4-6.4-2.4H50v17.6z"
          fill="white"
        />
        {/* Small globe/arrow accent in the R's counter */}
        <circle cx="66" cy="46" r="5" fill="none" stroke="white" strokeWidth="1.8" opacity="0.5" />
        <path d="M63 46h6M66 43v6" stroke="white" strokeWidth="1.2" opacity="0.4" />
      </svg>
      {showText && (
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: size * 0.5,
          color: textColor,
          letterSpacing: '-0.04em',
        }}>
          Reply
        </span>
      )}
    </div>
  );
}
