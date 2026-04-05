interface ReplyLogoProps {
  size?: number;
  light?: boolean;
  showText?: boolean;
}

const DARK = '#1a2744';

/**
 * REPLY wordmark — all caps, dark blue.
 * The R's counter (enclosed hole) is shaped as a speech bubble.
 * Single SVG, no floating elements.
 */
export default function ReplyLogo({ size = 28, light = false }: ReplyLogoProps) {
  const color = light ? '#fff' : DARK;
  const h = size;
  const w = h * 4.1;

  return (
    <svg width={w} height={h} viewBox="0 0 410 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Reply">
      {/* R — outer shape */}
      <path d="M0 100V0h42c8 0 15 1.5 20.5 4.5S71.5 11 74 16s3.5 10.5 3.5 16.5S76 44 74 49s-6.5 9-11 12-12.5 4.5-20.5 4.5H19v34.5H0z" fill={color} />
      {/* R counter — speech bubble cutout, sized to fill the R's bowl */}
      <path d="M22 14c0-6 5.5-11 13-11s13 5 13 11-5.5 11-13 11c-2 0-3.8-.4-5.4-1.1L23 28l2.8-5.5C23.4 20.5 22 17.5 22 14z" fill={light ? DARK : '#fff'} />
      {/* R leg */}
      <path d="M42 58l22 42H43L22 58h20z" fill={color} />

      {/* E */}
      <path d="M90 100V0h45v17H109v22h24v17h-24v27h27v17H90z" fill={color} />

      {/* P */}
      <path d="M148 100V0h36c7 0 13 1.5 18 4.5s8.5 7 11 12 3.5 10.5 3.5 16.5-1.2 11.5-3.5 16.5-6 9-11 12-11 4.5-18 4.5h-17V100h-19zm19-51h16c4 0 7.2-1.5 9.5-4.5S196 39 196 33s-1.2-8.5-3.5-11.5S188 17 184 17h-16v32z" fill={color} />

      {/* L */}
      <path d="M230 100V0h19v83h32v17h-51z" fill={color} />

      {/* Y */}
      <path d="M290 0l21 42 21-42h21l-32 56V100h-19V56L270 0h20z" fill={color} />
    </svg>
  );
}
