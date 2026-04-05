interface ReplyLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

const BLUE = '#2B3990';

/**
 * Reply logo — exact reproduction of the brand wordmark.
 * Large bold "R" with speech bubble in counter, "EPLY" in smaller caps beside it.
 * All one color, all inline SVG for pixel-perfect rendering at any size.
 */
export default function ReplyLogo({ size = 32, showText = true, light = false }: ReplyLogoProps) {
  // The full wordmark is rendered as a single SVG for exact proportions
  const color = light ? '#fff' : BLUE;
  // Aspect ratio of the full "REPLY" wordmark is roughly 3.8:1
  const w = showText ? size * 3.8 : size * 0.85;
  const h = size;

  if (!showText) {
    // Icon only — just the R with speech bubble
    return (
      <svg width={size * 0.85} height={size} viewBox="0 0 85 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 100V0h44c8 0 14.5 1.5 19.5 4.5S72 11 74.5 16c2.5 5 3.5 10.5 3.5 16.5 0 6-1.2 11.5-3.5 16.5-2.5 5-6 9-10.5 12S54 66 46 66H20v34H0zM20 50h24c5 0 9-1.8 12-5.2 3-3.5 4.5-8 4.5-13.3 0-5.3-1.5-9.8-4.5-13.3C53 14.8 49 13 44 13H20v37z" fill={color} />
        {/* Speech bubble */}
        <path d="M38 24.5c-5.5 0-10 3.5-10 8s4.5 8 10 8c1.5 0 3-.3 4.2-.8l4.8 2.8-1.5-4.5c1.6-1.5 2.5-3.4 2.5-5.5 0-4.5-4.5-8-10-8z" fill={light ? BLUE : '#fff'} />
      </svg>
    );
  }

  return (
    <svg width={w} height={h} viewBox="0 0 380 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* R with speech bubble */}
      <path d="M0 100V0h44c8 0 14.5 1.5 19.5 4.5S72 11 74.5 16c2.5 5 3.5 10.5 3.5 16.5 0 6-1.2 11.5-3.5 16.5-2.5 5-6 9-10.5 12S54 66 46 66H20v34H0zM20 50h24c5 0 9-1.8 12-5.2 3-3.5 4.5-8 4.5-13.3 0-5.3-1.5-9.8-4.5-13.3C53 14.8 49 13 44 13H20v37z" fill={color} />
      {/* Speech bubble in R counter */}
      <path d="M38 24.5c-5.5 0-10 3.5-10 8s4.5 8 10 8c1.5 0 3-.3 4.2-.8l4.8 2.8-1.5-4.5c1.6-1.5 2.5-3.4 2.5-5.5 0-4.5-4.5-8-10-8z" fill={light ? BLUE : '#fff'} />

      {/* E */}
      <path d="M95 100V30h40v13h-24v12h22v13h-22v19h25v13H95z" fill={color} />
      {/* P */}
      <path d="M145 100V30h30c6 0 11 1 15 3.5s7 5.5 9 9.5 3 8.5 3 13.5c0 5-1 9.5-3 13.5s-5 7-9 9.5-9 3.5-15 3.5h-14v17h-16zm16-30h13c3.5 0 6.2-1.2 8.2-3.5 2-2.3 3-5.5 3-9.5s-1-7.2-3-9.5c-2-2.3-4.7-3.5-8.2-3.5h-13v26z" fill={color} />
      {/* L */}
      <path d="M215 100V30h16v57h28v13h-44z" fill={color} />
      {/* Y */}
      <path d="M268 30l18 35 18-35h18l-28 48v22h-16V78l-28-48h18z" fill={color} />
    </svg>
  );
}

export { BLUE };
