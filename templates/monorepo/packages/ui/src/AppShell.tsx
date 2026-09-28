// JAL Core app-shell. Every screen renders inside it, so mobile is always a
// real app-shell and never a shrunk desktop page:
//   below 640px   pinned header, independently scrolling content, bottom tab
//                 bar of 3 to 5 destinations (icon over label, 44px+ targets)
//   640px and up  the same destinations move into the header row as top nav
// The shell is a CSS grid sized to the viewport, so the document never
// scrolls and nothing is position: fixed (no content hides under the bar).
// Styles live in ui.css (.shell*). Icons come from koboyo through <Icon>;
// a destination may be label-only.
import type { ReactNode } from "react";

export interface AppShellDestination {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface AppShellProps {
  title: string;
  destinations: AppShellDestination[];
  current: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, destinations, current, actions, children }: AppShellProps) {
  return (
    <div className="shell">
      <header className="shell-header">
        <p className="shell-title">{title}</p>
      </header>
      <div className="shell-actions">{actions}</div>
      <main className="shell-main">{children}</main>
      <nav className="shell-nav" aria-label="Primary">
        {destinations.map((d) => (
          <a
            key={d.id}
            href={d.href}
            className="shell-nav-item"
            aria-current={d.id === current ? "page" : undefined}
          >
            {d.icon ? <span className="shell-nav-icon">{d.icon}</span> : null}
            <span className="shell-nav-label">{d.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
