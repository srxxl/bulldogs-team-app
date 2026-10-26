import Image from "next/image";
import crest from "../../public/brand/crest.png";

export function Crest({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src={crest}
      alt="Brentwood Booragoon Bulldogs crest"
      width={size}
      height={Math.round(size * 0.975)}
      className={className}
      style={{ height: "auto" }}
      priority
    />
  );
}
