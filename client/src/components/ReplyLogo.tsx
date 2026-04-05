interface ReplyLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

/**
 * Reply logo — uses the brand logo image directly.
 * Size controls the height. The image scales proportionally.
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
        filter: light ? 'brightness(0) invert(1)' : 'none',
      }}
    />
  );
}
