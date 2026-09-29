// StickyStory: a scroll story. At 1024 and up a sticky media stage (columns
// 7 to 12) shows the active step's media while the steps (columns 1 to 5)
// scroll past; the step crossing the middle of the scroller becomes active.
// Below 1024 there is no pin: each step shows its own media in flow.
//
// useStickyStory drives it with an IntersectionObserver rooted on the real
// scroller (getScroller from AppShell), so it works on a document shell and
// on a contained shell alike. Under reduced motion the frames swap with no
// travel and no fade (CSS), and without IntersectionObserver the first step
// stays active. Step media renders twice (stage and in flow, one shown per
// width), so it must not carry element ids.
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { getScroller, scrollerRoot } from "../AppShell";
import { Section, SectionHead, type SectionFrame } from "./Page";

export interface StoryStep {
  title: ReactNode;
  body: ReactNode;
  media: ReactNode;
}

export interface StickyStoryState {
  active: number;
  /** Callback ref for step i. */
  stepRef: (index: number) => (el: HTMLElement | null) => void;
}

/** The step nearest the scroller's middle band is active. */
export function useStickyStory(count: number): StickyStoryState {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const refs = useMemo(
    () => Array.from({ length: count }, (_, i) => (el: HTMLElement | null) => {
      nodes.current[i] = el;
    }),
    [count],
  );
  const stepRef = useCallback((index: number) => refs[index], [refs]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const first = nodes.current.find(Boolean);
    if (!first) return;
    const root = scrollerRoot(getScroller(first));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isFinite(index)) setActive(index);
        }
      },
      { root, rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const node of nodes.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  return { active, stepRef };
}

export interface StickyStoryProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  steps: StoryStep[];
}

export function StickyStory({ title, lead, steps, id, tone, rhythm }: StickyStoryProps) {
  const headingId = useId();
  const { active, stepRef } = useStickyStory(steps.length);
  if (steps.length < 2) throw new Error("StickyStory: use at least 2 steps");
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <SectionHead id={headingId} title={title} lead={lead} />
      <div className="kit-story">
        <ol className="kit-story-steps">
          {steps.map((s, i) => (
            <li
              key={i}
              ref={stepRef(i)}
              className="kit-story-step"
              data-index={i}
              data-active={i === active ? "" : undefined}
              aria-current={i === active ? "step" : undefined}
            >
              <h3 className="kit-title">{s.title}</h3>
              <p className="kit-body">{s.body}</p>
              <div className="kit-story-step-media">{s.media}</div>
            </li>
          ))}
        </ol>
        <div className="kit-story-stage">
          <div className="kit-story-frames">
            {steps.map((s, i) => (
              <div key={i} className="kit-story-frame" data-active={i === active ? "" : undefined}>
                {s.media}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
