interface ReplyLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

/**
 * Reply logo — uses the brand logo image.
 * mix-blend-mode: multiply removes the light background from the PNG.
 * For dark backgrounds, use light=true to invert to white.
 */
export default function ReplyLogo({ size = 32, light = false }: ReplyLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Reply"
      style={{
        height: size,
        width: 'auto',
        display: 'block',
        mixBlendMode: light ? 'screen' : 'multiply',
      }}
    />
  );
}
