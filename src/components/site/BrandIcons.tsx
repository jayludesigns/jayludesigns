/**
 * Lucide ya no incluye iconos de marca, así que los que necesitamos van aquí
 * como SVG en línea. Se dibujan con `currentColor` para heredar el color del
 * texto y aceptar el tamaño de la clase que se les pase.
 */

export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3.5 20.5 5 16.3A8 8 0 1 1 8 19.2l-4.5 1.3Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4 1-1v-.9l-1.7-.6-.9.9a4.6 4.6 0 0 1-2-2l.9-.9-.6-1.7h-.9c-.6 0-1 .4-1 1Z" />
    </svg>
  );
}

export function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c.6 2.4 2.2 3.8 4.5 4" />
    </svg>
  );
}
