// Product intro, 16:9, 6 s at 30 fps. Staggered type, then the data:
// the headline lines rise from their masks one stagger apart, the lead
// follows, then a surface panel arrives and its three figures count up.
// Ink on the page white, one tonal step for the panel, the one curve.
//
//   frame   0  headline line 1 rises (line 2 and 3 one stagger each later)
//          18  lead rises
//          42  data panel rises, hairlines draw
//          54  figures count up, a stagger apart
//         150  the poster frame: everything finished
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ProductIntroProps } from "./schemas";
import { countAt, ease, Hairline, MaskLine, riseStyle } from "./parts";
import { color, dur, font, radius, stagger } from "./tokens";

export const productIntroDefaults: ProductIntroProps = {
  product: "Hawa",
  headline: ["Air you can read,", "room by room."],
  lead: "Hawa measures CO2, PM2.5, and humidity every ten seconds and tells the room what to do next.",
  stats: [
    { value: 10, decimals: 0, unit: "s", label: "Sample interval" },
    { value: 3, decimals: 0, unit: "sensors", label: "In every unit" },
    { value: 18, decimals: 0, unit: "months", label: "On one battery" },
  ],
};

export function ProductIntro({ product, headline, lead, stats }: ProductIntroProps) {
  const frame = useCurrentFrame();
  const leadIn = ease(frame, 18);
  const panelIn = ease(frame, 42);
  const markIn = ease(frame, 30);
  return (
    <AbsoluteFill style={{ backgroundColor: color.page, color: color.ink, fontFamily: font.sans, padding: "96px 128px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 1360 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {headline.map((line, i) => (
            <MaskLine key={i} start={i * stagger * 2} style={{ fontSize: 112, lineHeight: "120px", fontWeight: 600, letterSpacing: "-0.02em" }}>
              {line}
            </MaskLine>
          ))}
        </div>
        <div style={{ ...riseStyle(leadIn), fontSize: 40, lineHeight: "56px", color: color.inkMuted, maxWidth: 1080 }}>{lead}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          ...riseStyle(panelIn, 32),
          display: "flex",
          backgroundColor: color.surface,
          border: `1px solid ${color.borderStrong}`,
          borderRadius: radius.frame,
          padding: "48px 0",
        }}
      >
        {stats.map((s, i) => {
          const start = 54 + i * stagger * 2;
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, display: "flex" }}>
              {i > 0 ? <div style={{ width: 2, backgroundColor: color.border }} /> : null}
              <div style={{ flex: 1, minWidth: 0, padding: "0 56px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                  <span style={{ fontFamily: font.mono, fontSize: 96, lineHeight: "104px", fontWeight: 500, letterSpacing: "-0.02em" }}>
                    {countAt(frame, start, s.value, dur.d800 + dur.d400, s.decimals)}
                  </span>
                  <span style={{ fontSize: 32, lineHeight: "40px", color: color.inkMuted }}>{s.unit}</span>
                </div>
                <Hairline start={start} color={color.border} />
                <div style={{ fontSize: 32, lineHeight: "40px", color: color.inkMuted }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...riseStyle(markIn, 12), marginTop: 40, fontSize: 28, lineHeight: "36px", fontWeight: 600 }}>{product}</div>
    </AbsoluteFill>
  );
}
