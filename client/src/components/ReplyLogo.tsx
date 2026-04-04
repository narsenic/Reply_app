interface ReplyLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
}

export default function ReplyLogo({ size = 36, color = '#6C5CE7', showText = false }: ReplyLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Rounded square background */}
        <rect width="100" height="100" rx="22" fill={color} />

        {/* Bold R letterform with speech bubble tail */}
        <path
          d="M30 78V22h22c5.5 0 10 1 13.5 3s6 4.8 7.5 8.2c1.5 3.4 2.3 7 2.3 11 0 4.2-.8 7.8-2.5 11-1.6 3.2-4 5.6-7 7.2-3 1.6-6.8 2.4-11.3 2.4H42.5V78H30zm12.5-25.2h8.8c3.5 0 6.2-1 8-2.8 1.8-1.9 2.7-4.5 2.7-7.8 0-3.2-.9-5.8-2.7-7.6-1.8-1.8-4.4-2.8-7.8-2.8h-9v21z"
          fill="white"
        />

        {/* Speech bubble tail — small triangle at bottom-right */}
        <path
          d="M68 72l10 14l-2-14z"
          fill={color}
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Three dots inside the R's counter space — representing conversation */}
        <circle cx="52" cy="43" r="2.2" fill={color} opacity="0.6" />
        <circle cx="58" cy="43" r="2.2" fill={color} opacity="0.6" />
        <circle cx="64" cy="43" r="2.2" fill={color} opacity="0.6" />
      </svg>

      {showText && (
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: size * 0.45,
          color: '#1a1a1a',
          letterSpacing: '-0.03em',
        }}>
          Reply
        </span>
      )}
    </div>
  );
}
