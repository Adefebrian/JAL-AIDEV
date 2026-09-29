// LogoRow: real customers or real platforms only, one monochrome treatment,
// every mark aligned to one height, separated by gap alone (no cell
// borders). A one-line label names the relationship ("Works with",
// "Used by"); it sits beside the marks at 1024 and up and above them below,
// and is never a heading kicker.
import type { CSSProperties, ReactNode } from "react";
import { Section, type SectionFrame } from "./Page";

export interface Logo {
  name: string;
  /** An SVG or img mark. Without one, the name is set as a text mark. */
  mark?: ReactNode;
}

export interface LogoRowProps extends SectionFrame {
  label: string;
  logos: Logo[];
}

export function LogoRow({ label, logos, id, tone, rhythm = "tight" }: LogoRowProps) {
  const style = { "--kit-logo-count": String(Math.min(logos.length, 6)) } as CSSProperties;
  return (
    <Section id={id} tone={tone} rhythm={rhythm} label={label}>
      <div className="kit-logos">
        <p className="kit-meta">{label}</p>
        <ul className="kit-logo-list" style={style}>
          {logos.map((l) => (
            <li key={l.name} className="kit-logo">
              {l.mark ?? <span className="kit-title">{l.name}</span>}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
