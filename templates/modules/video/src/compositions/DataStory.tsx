// Data story, 16:9, 8 s at 30 fps. A bar chart that tells one fact: the
// bars grow one stagger apart on the one curve, then the story focuses
// (the other bars step back to a quiet tone, the highlighted bar turns
// ink and shows its value), then the headline figure counts to its delta.
// Text is HTML, never SVG text, so the in-browser renderer draws it with
// the page's own Geist faces.
//
//   frame   0  title rises from its mask, the note follows
//          18  baseline draws
//          24  bars grow, one stagger apart
//          84  focus: others step back, the highlight turns ink
//          96  the highlight's value rises above its bar
//         108  the delta counts up
//         200  the poster frame: everything finished
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import type { DataStoryProps } from "./schemas";
import { countAt, ease, formatFigure, Hairline, MaskLine, riseStyle } from "./parts";
import { color, dur, font, stagger } from "./tokens";

export const dataStoryDefaults: DataStoryProps = {
  title: "Meeting room CO2, eight weeks",
  note: "Weekly average in parts per million. Hawa installed in week 4.",
  unit: "ppm",
  series: [
    { label: "W1", value: 1180 },
    { label: "W2", value: 1150 },
    { label: "W3", value: 1210 },
    { label: "W4", value: 990 },
    { label: "W5", value: 870 },
    { label: "W6", value: 820 },
    { label: "W7", value: 790 },
    { label: "W8", value: 760 },
  ],
  highlight: 7,
  delta: { value: -36, unit: "%", label: "Since week 1" },
};

const CHART_HEIGHT = 520;
const FOCUS = 84;

export function DataStory({ title, note, unit, series, highlight, delta }: DataStoryProps) {
  const frame = useCurrentFrame();
  const max = Math.max(...series.map((s) => s.value), 1) * 1.08;
  const valueIn = ease(frame, FOCUS + 12);
  const deltaIn = ease(frame, FOCUS + 24);
  const quiet = interpolateColors(frame, [FOCUS, FOCUS + dur.d600], [color.inkSubtle, color.borderStrong]);
  const lit = interpolateColors(frame, [FOCUS, FOCUS + dur.d600], [color.inkSubtle, color.ink]);
  return (
    <AbsoluteFill style={{ backgroundColor: color.page, color: color.ink, fontFamily: font.sans, padding: "96px 128px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <MaskLine start={0} style={{ fontSize: 64, lineHeight: "72px", fontWeight: 600, letterSpacing: "-0.015em" }}>
            {title}
          </MaskLine>
          <div style={{ ...riseStyle(ease(frame, 9)), fontSize: 32, lineHeight: "40px", color: color.inkMuted }}>{note}</div>
        </div>
        <div style={{ ...riseStyle(deltaIn), display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: font.mono, fontSize: 120, lineHeight: "120px", fontWeight: 500, letterSpacing: "-0.03em" }}>
              {countAt(frame, FOCUS + 24, delta.value)}
            </span>
            <span style={{ fontFamily: font.mono, fontSize: 56, lineHeight: "64px", color: color.inkMuted }}>{delta.unit}</span>
          </div>
          <div style={{ fontSize: 28, lineHeight: "36px", color: color.inkMuted }}>{delta.label}</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: CHART_HEIGHT }}>
        {series.map((s, i) => {
          const grow = ease(frame, 24 + i * stagger, dur.d800);
          const isLit = i === highlight;
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "stretch" }}>
              {isLit ? (
                <div style={{ ...riseStyle(valueIn, 16), fontFamily: font.mono, fontSize: 36, lineHeight: "44px", textAlign: "center", marginBottom: 16 }}>
                  {formatFigure(s.value)} {unit}
                </div>
              ) : null}
              <div
                style={{
                  height: Math.round((s.value / max) * (CHART_HEIGHT - 60) * grow),
                  backgroundColor: isLit ? lit : quiet,
                  borderRadius: "12px 12px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>
      <Hairline start={18} color={color.borderStrong} />
      <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
        {series.map((s, i) => (
          <div
            key={i}
            style={{
              ...riseStyle(ease(frame, 24 + i * stagger), 8),
              flex: 1,
              minWidth: 0,
              textAlign: "center",
              fontFamily: font.mono,
              fontSize: 24,
              lineHeight: "32px",
              color: i === highlight ? color.ink : color.inkSubtle,
            }}
          >
            {s.label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

