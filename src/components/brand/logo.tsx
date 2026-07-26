import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <Link className={cn("brand-logo", className)} href="/dashboard" aria-label="AniSuba, ir al inicio">
      <Image className="brand-mark" src="/brand/anisuba-mark.svg" alt="" width={36} height={36} priority />
      {!compact && (
        <span className="brand-name">
          Ani<span>Suba</span>
        </span>
      )}
    </Link>
  );
}
