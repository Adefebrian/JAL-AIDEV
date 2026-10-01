// Social cut, 9:16, 7 s at 30 fps. Three scenes joined by
// @remotion/transitions on the one curve: a hook, three numbered points,
// and an end card. Content stays inside the platform safe area (240 px
// top, 320 px bottom), where the app's own UI never covers it.
//
//   scene      frames  transition out
//   hook        66     slide from the bottom, 12 frames
//   points      84     fade, 12 frames
//   end card    84
//   total = 66 + 84 + 84 - 12 - 12 = 210
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { SocialCutProps } from "./schemas";
import { ease, Hairline, MaskLine, riseStyle } from "./parts";
import { color, curve, font, stagger } from "./tokens";

export const socialCutDefaults: SocialCutProps = {
  hook: ["Your meeting", "room is at", "1,400 ppm."],
  points: [
    "Above 1,000 ppm, decisions slow down.",
    "Hawa flags the room before anyone feels it.",
    "Open a window and the number falls in minutes.",
  ],
  cta: "Read your air.",
  handle: "hawa.example",
};

export const SOCIAL_SCENES = { hook: 66, points: 84, end: 84, transition: 12 } as const;
export const SOCIAL_DURATION = SOCIAL_SCENES.hook + SOCIAL_SCENES.points + SOCIAL_SCENES.end - 2 * SOCIAL_SCENES.transition;

const SAFE: CSSProperties = { padding: "240px 96px 320px", display: "flex", flexDirection: "column", fontFamily: font.sans, color: color.ink };
const timing = linearTiming({ durationInFrames: SOCIAL_SCENES.transition, easing: curve });

function Hook({ lines }: { lines: string[] }) {
  return (
    <AbsoluteFill style={{ ...SAFE, backgroundColor: color.page, justifyContent: "center" }}>
      {lines.map((line, i) => (
        <MaskLine key={i} start={4 + i * stagger * 2} style={{ fontSize: 120, lineHeight: "128px", fontWeight: 600, letterSpacing: "-0.025em" }}>
          {line}
        </MaskLine>
      ))}
    </AbsoluteFill>
  );
}

function Points({ points }: { points: string[] }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ ...SAFE, backgroundColor: color.layer1, justifyContent: "center", gap: 48 }}>
      {points.map((text, i) => {
        const start = 8 + i * stagger * 3;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {i > 0 ? <Hairline color={color.borderStrong} /> : null}
            <div style={{ ...riseStyle(ease(frame, start), 32), display: "flex", gap: 40, alignItems: "baseline" }}>
              <span style={{ fontFamily: font.mono, fontSize: 40, lineHeight: "48px", color: color.inkSubtle, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 60, lineHeight: "72px", fontWeight: 500, letterSpacing: "-0.01em" }}>{text}</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function EndCard({ cta, handle }: { cta: string; handle: string }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ ...SAFE, backgroundColor: color.surface, justifyContent: "center", alignItems: "flex-start", gap: 56 }}>
      <MaskLine start={6} style={{ fontSize: 112, lineHeight: "120px", fontWeight: 600, letterSpacing: "-0.025em" }}>
        {cta}
      </MaskLine>
      <div
        style={{
          ...riseStyle(ease(frame, 18), 16),
          fontFamily: font.mono,
          fontSize: 40,
          lineHeight: "48px",
          padding: "24px 44px",
          border: `1px solid ${color.ink}`,
          borderRadius: 9999,
        }}
      >
        {handle}
      </div>
    </AbsoluteFill>
  );
}

export function SocialCut({ hook, points, cta, handle }: SocialCutProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SOCIAL_SCENES.hook}>
        <Hook lines={hook} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SOCIAL_SCENES.points}>
        <Points points={points} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SOCIAL_SCENES.end}>
        <EndCard cta={cta} handle={handle} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
