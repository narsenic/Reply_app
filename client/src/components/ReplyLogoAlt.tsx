interface ReplyLogoAltProps {
  size?: number;
  color?: string;
  showText?: boolean;
}

export default function ReplyLogoAlt({ size = 36, color = '#6C5CE7', showText = false }: ReplyLogoAltProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Speech bubble shape as the container */}
        <path
          d="M50 4C25.2 4 5 21.5 5 43c0 12.5 6.8 23.6 17.5 30.8L18 88c-.4 2.2 1.8 4 3.8 3l18.5-10.5c3.1.6 6.4 1 9.7 1 24.8 0 45-17.5 45-39S74.8 4 50 4z"
          fill={color}
        />

        {/* Bold R letter centered in the bubble */}
        <path
          d="M33 62V28h16c4 0 7.2.7 9.8 2.2 2.5 1.4 4.3 3.4 5.4 5.9 1.1 2.5 1.6 5.2 1.6 8 0 3-.6 5.7-1.8 8-1.2 2.3-2.9 4-5.2 5.2-2.2 1.2-5 1.8-8.2 1.8H42.5V62H33zm9.5-18.5h6.3c2.5 0 4.4-.7 5.7-2 1.3-1.4 2-3.3 2-5.6 0-2.3-.7-4.1-2-5.5-1.3-1.3-3.2-2-5.6-2h-6.4v15.1z"
          fill="white"
        />
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
