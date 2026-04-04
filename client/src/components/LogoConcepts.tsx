const NAVY = '#1B2A4A';
const CORAL = '#FF6B6B';
const YELLOW = '#FFD93D';

/** 1. The Connected R — tail curves into a speech bubble */
export function ConnectedR({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Bold R stem */}
      <path d="M22 82V18h24c6 0 10.5 1.2 13.5 3.6 3 2.4 4.5 6 4.5 10.8 0 4.8-1.5 8.4-4.5 10.8-3 2.4-7.5 3.6-13.5 3.6H34v10l18 25.2"
        stroke={NAVY} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Speech bubble growing from the R's tail */}
      <rect x="54" y="58" width="32" height="22" rx="8" fill={CORAL} />
      <polygon points="60,80 56,88 66,80" fill={CORAL} />
      {/* Three dots inside bubble */}
      <circle cx="64" cy="69" r="2" fill="#fff" />
      <circle cx="70" cy="69" r="2" fill="#fff" />
      <circle cx="76" cy="69" r="2" fill="#fff" />
    </svg>
  );
}

/** 2. The Feedback Loop — two overlapping lines, yellow ends in arrow */
export function FeedbackLoopR({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Navy R base stroke */}
      <path d="M24 82V18h22c6 0 10.5 1.2 13.5 3.6 3 2.4 4.5 6 4.5 10.8 0 4.8-1.5 8.4-4.5 10.8-3 2.4-7.5 3.6-13.5 3.6H36"
        stroke={NAVY} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Navy R leg */}
      <path d="M36 47l16 35" stroke={NAVY} strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Yellow guiding line — offset, with arrow tip */}
      <path d="M28 80V22h20c5 0 9 1 12 3.2 2.5 2 3.8 5.2 3.8 9.4 0 4.2-1.3 7.4-3.8 9.4-3 2.2-7 3.2-12 3.2H40"
        stroke={YELLOW} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
      {/* Arrow at the end of yellow line */}
      <path d="M40 47l20 30" stroke={YELLOW} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.85" />
      <polygon points="60,77 56,68 64,72" fill={YELLOW} opacity="0.9" />
    </svg>
  );
}

/** 3. The Conversation Mark — rounded R with chat-icon shaped counter */
export function ConversationMarkR({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Rounded background */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill={NAVY} />
      {/* Thick rounded R */}
      <path d="M28 78V22h22c5.5 0 9.8 1 13 3s5.2 5 5.2 9.5c0 4.5-1.7 7.5-5.2 9.5-3.2 2-7.5 3-13 3H40v31"
        stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M40 47l18 31" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Chat icon in the R's counter (the enclosed space) */}
      <rect x="48" y="26" width="16" height="11" rx="4" fill={CORAL} />
      <polygon points="52,37 50,41 56,37" fill={CORAL} />
      {/* Tiny dots */}
      <circle cx="53" cy="31.5" r="1.2" fill="#fff" />
      <circle cx="56" cy="31.5" r="1.2" fill="#fff" />
      <circle cx="59" cy="31.5" r="1.2" fill="#fff" />
    </svg>
  );
}
