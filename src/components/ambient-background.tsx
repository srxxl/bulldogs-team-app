/**
 * "Film light leak": slow-breathing red and powder glows with fine grain,
 * fixed behind the app. Pure CSS; animations stop under prefers-reduced-motion.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="ambient">
      <span className="leak leak-red-top" />
      <span className="leak leak-powder-bottom" />
      <span className="leak leak-powder-top" />
      <span className="leak leak-red-bottom" />
      <span className="grain" />
    </div>
  );
}
