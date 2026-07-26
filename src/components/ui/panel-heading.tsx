import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type PanelHeadingProps = {
  icon: LucideIcon;
  title: string;
  meta?: ReactNode;
  tone?: string;
};

export function PanelHeading({ icon: Icon, meta, title, tone = "#a855f7" }: PanelHeadingProps) {
  return (
    <header className="panel-heading" style={{ "--panel-tone": tone } as CSSProperties}>
      <div>
        <span className="panel-heading-icon"><Icon aria-hidden="true" size={15} /></span>
        <h2>{title}</h2>
      </div>
      {meta && <span className="panel-heading-meta">{meta}</span>}
    </header>
  );
}
