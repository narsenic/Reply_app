const BLUE = '#0D9488';
const ORANGE = '#F97316';

/** 1. The Connected R — clean R with tail curving into a minimal speech bubble */
export function ConnectedR({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Minimal bold R */}
      <path d="M24 84V16h20c10 0 18 3 22 8s6 11 6 18c0 7-2 13-6 18s-12 8-22 8H38v16"
        stroke={BLUE} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M38 60l22 24" stroke={BLUE} strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* Minimal speech bubble at the R's kick */}
      <rect x="62" y="64" width="26" height="16" rx="6" fill={ORANGE} />
      <polygon points="66,80 63,86 72,80" fill={ORANGE} />
    </svg>
  );
}

/** 2. The Feedback Loop — single-stroke R with orange guide arrow */
export function FeedbackLoopR({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Blue R — clean single stroke */}
      <path d="M26 84V16h18c10 0 17 3 21 8s5 10 5 16c0 6-2 12-5 16s-11 8-21 8H40v20"
        stroke={BLUE} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M40 56l20 28" stroke={BLUE} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Orange arrow — the guiding line */}
      <path d="M44 56 Q52 56 58 64 L72 84" stroke={ORANGE} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Arrow head */}
      <path d="M68 76 L74 86 L78 78" stroke={ORANGE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** 3. The Conversation Mark — rounded square with R, chat icon in counter */
export function ConversationMarkR({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Rounded square */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill={BLUE} />
      {/* White R */}
      <path d="M28 78V22h18c8 0 14 2.5 18 7s5 9 5 15c0 6-2 11-5 15s-10 7-18 7H42v12"
        stroke="#fff" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M42 58l16 20" stroke="#fff" strokeWidth="7.5" strokeLinecap="round" fill="none" />
      {/* Orange chat bubble in the R's counter */}
      <rect x="50" y="28" width="14" height="10" rx="4" fill={ORANGE} />
      <polygon points="54,38 52,42 58,38" fill={ORANGE} />
    </svg>
  );
}
