// Preview-only art for the kit preview: a lit 2D canvas render of the sample
// product (a desk air monitor), a live-looking day readout, a week strip,
// and an authored SVG wordmark. Canvas drawing follows the jal-immersive
// canvas zone: lighting and shading on one drawn form, a soft contact
// shade, transparent over the page white, no bloom or glow.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Figure } from "../Page";

export interface DeviceProps {
  reading?: string;
  unit?: string;
  line?: string;
  advice?: string;
  level?: number;
  /** Horizontal center of the device, 0 to 1 of the canvas width. */
  focus?: number;
  label: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDevice(ctx: CanvasRenderingContext2D, w: number, h: number, p: DeviceProps) {
  ctx.clearRect(0, 0, w, h);
  const dh = Math.min(h * 0.66, (w * 0.62) / 0.74);
  const dw = dh * 0.74;
  const depth = dw * 0.16;
  const x = Math.min(Math.max(w * (p.focus ?? 0.5) - (dw + depth) / 2, 0), w - dw - depth);
  const y = (h - dh) / 2 - h * 0.03;
  const r = dw * 0.14;

  // Soft contact shade on the desk, lit from the upper left.
  const sx = x + dw * 0.55 + depth * 0.5;
  const sy = y + dh + dh * 0.02;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, 0.14);
  const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, dw * 0.78);
  shade.addColorStop(0, "rgba(34, 30, 26, 0.30)");
  shade.addColorStop(0.55, "rgba(34, 30, 26, 0.12)");
  shade.addColorStop(1, "rgba(34, 30, 26, 0)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, dw * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Extruded body: stacked slices from back to front give the side face.
  const steps = 28;
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    const ox = depth * t;
    const oy = -depth * 0.32 * t;
    const tone = 176 + Math.round((1 - t) * 18);
    ctx.fillStyle = `rgb(${tone}, ${tone - 4}, ${tone - 10})`;
    roundRect(ctx, x + ox, y + oy, dw, dh, r);
    ctx.fill();
  }

  // Front face: matte stone, key light from the upper left.
  const face = ctx.createLinearGradient(x, y, x + dw, y + dh);
  face.addColorStop(0, "#f4f2ee");
  face.addColorStop(0.55, "#e6e3dd");
  face.addColorStop(1, "#d3cfc7");
  ctx.fillStyle = face;
  roundRect(ctx, x, y, dw, dh, r);
  ctx.fill();

  // Rim light along the lit edge.
  ctx.save();
  roundRect(ctx, x, y, dw, dh, r);
  ctx.clip();
  const rim = ctx.createLinearGradient(x, y, x + dw * 0.4, y + dh * 0.4);
  rim.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  rim.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1, dw * 0.012);
  roundRect(ctx, x + 1, y + 1, dw - 2, dh - 2, r);
  ctx.stroke();
  ctx.restore();

  // E-paper display, slightly recessed.
  const mx = dw * 0.1;
  const px = x + mx;
  const py = y + mx;
  const pw = dw - mx * 2;
  const ph = dh * 0.56;
  const pr = r * 0.5;
  ctx.fillStyle = "#c9c5bd";
  roundRect(ctx, px - 1, py - 1, pw + 2, ph + 2, pr + 1);
  ctx.fill();
  const paper = ctx.createLinearGradient(px, py, px, py + ph);
  paper.addColorStop(0, "#dedbd3");
  paper.addColorStop(0.18, "#e9e7e0");
  paper.addColorStop(1, "#eeece6");
  ctx.fillStyle = paper;
  roundRect(ctx, px, py, pw, ph, pr);
  ctx.fill();

  const ink = "#2b2a27";
  const mono = "ui-monospace, Menlo, Consolas, monospace";
  const sans = "system-ui, -apple-system, sans-serif";
  ctx.fillStyle = ink;
  ctx.textBaseline = "alphabetic";
  if (p.advice) {
    const fs = pw * 0.13;
    ctx.font = `600 ${fs}px ${sans}`;
    const lines = p.advice.split("\n");
    lines.forEach((l, i) => ctx.fillText(l, px + pw * 0.09, py + ph * 0.36 + i * fs * 1.15));
    ctx.font = `400 ${pw * 0.075}px ${mono}`;
    ctx.fillStyle = "#55534e";
    ctx.fillText(p.line ?? "", px + pw * 0.09, py + ph * 0.86);
  } else {
    const fs = pw * 0.32;
    ctx.font = `500 ${fs}px ${mono}`;
    ctx.fillText(p.reading ?? "", px + pw * 0.08, py + ph * 0.56);
    ctx.font = `500 ${pw * 0.08}px ${sans}`;
    ctx.fillStyle = "#55534e";
    ctx.fillText(p.unit ?? "", px + pw * 0.09, py + ph * 0.72);
    ctx.fillText(p.line ?? "", px + pw * 0.09, py + ph * 0.86);
  }

  // Level segments under the display.
  const segs = 5;
  const gy = py + ph + dh * 0.07;
  const gw = (pw - (segs - 1) * pw * 0.035) / segs;
  for (let i = 0; i < segs; i++) {
    ctx.fillStyle = i < (p.level ?? 2) ? "#3a3935" : "#c4c0b8";
    roundRect(ctx, px + i * (gw + pw * 0.035), gy, gw, dh * 0.018, dh * 0.009);
    ctx.fill();
  }

  // Perforated grille, each hole shaded on its upper edge.
  const cols = 9;
  const rows = 3;
  const hx = px + pw * 0.06;
  const hy = gy + dh * 0.08;
  const step = (pw * 0.88) / (cols - 1);
  const hr = Math.max(1, dw * 0.011);
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const cx = hx + c * step;
      const cy = hy + row * step * 0.75;
      ctx.fillStyle = "rgba(60, 56, 50, 0.55)";
      ctx.beginPath();
      ctx.arc(cx, cy, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(cx, cy + hr * 0.6, hr * 0.5, 0, Math.PI);
      ctx.fill();
    }
  }
}

/** The sample product, drawn to fill its frame at the device pixel ratio. */
export function Device(props: DeviceProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { reading, unit, line, advice, level, focus } = props;
  useEffect(() => {
    const canvas = ref.current;
    const box = canvas?.parentElement;
    if (!canvas || !box) return;
    const paint = () => {
      const rect = box.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawDevice(ctx, rect.width, rect.height, { reading, unit, line, advice, level, focus, label: "" });
    };
    paint();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(paint);
    ro.observe(box);
    return () => ro.disconnect();
  }, [reading, unit, line, advice, level, focus]);
  return <canvas ref={ref} className="pv-canvas" role="img" aria-label={props.label} />;
}

// A workday of CO2 readings, every 30 minutes from 08:00 to 18:00.
const DAY = [520, 560, 610, 680, 740, 790, 820, 860, 900, 880, 760, 800, 930, 1080, 1240, 980, 820, 760, 700, 650, 612];
const MAX = 1500;

/** A live-looking readout of one day, built from kit roles and a flat SVG plot. */
export function DayReadout({ compact = false }: { compact?: boolean }) {
  const n = DAY.length - 1;
  const pts = DAY.map((v, i) => `${((i / n) * 100).toFixed(2)},${(100 - (v / MAX) * 100).toFixed(2)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L100,100 L0,100 Z`;
  const limit = 100 - (1000 / MAX) * 100;
  return (
    <div className="pv-readout" role="group" aria-label="CO2 today: from 520 to a peak of 1240 ppm at 15:00, then down to 612 ppm by 18:00" data-compact={compact ? "" : undefined}>
      <div className="pv-readout-head">
        <p className="kit-meta">CO2 today, desk by the window</p>
        <p className="pv-readout-now">
          <Figure value="612" unit="ppm" />
        </p>
      </div>
      <div className="pv-axis" aria-hidden="true">
        <span className="kit-meta kit-num">1500</span>
        <span className="kit-meta kit-num">1000</span>
        <span className="kit-meta kit-num">500</span>
      </div>
      <div className="pv-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <line x1="0" x2="100" y1="33.33" y2="33.33" className="pv-grid" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1="66.67" y2="66.67" className="pv-grid" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1={limit} y2={limit} className="pv-limit" vectorEffect="non-scaling-stroke" />
          <path d={area} className="pv-area" />
          <path d={line} className="pv-line" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="pv-ticks" aria-hidden="true">
        {["08", "10", "12", "14"].map((t) => (
          <span key={t} className="kit-meta kit-num">
            {t}:00
          </span>
        ))}
        <span className="pv-ticks-last">
          <span className="kit-meta kit-num">16:00</span>
          <span className="kit-meta kit-num">18:00</span>
        </span>
      </div>
      {compact ? null : (
        <p className="kit-meta pv-readout-note">Peak 1240 ppm at 15:00. Window opened 15:05, back under 800 by 15:40.</p>
      )}
    </div>
  );
}

const WEEK = [
  { d: "Mon", h: 2.5 },
  { d: "Tue", h: 1.8 },
  { d: "Wed", h: 3.1 },
  { d: "Thu", h: 1.2 },
  { d: "Fri", h: 0.6 },
  { d: "Sat", h: 0.2 },
  { d: "Sun", h: 0.4 },
];

/** Hours above 1000 ppm per day this week. */
export function WeekStrip() {
  return (
    <div className="pv-week" role="img" aria-label="Hours above 1000 ppm this week: highest Wednesday at 3.1 hours, lowest Saturday at 0.2">
      <div className="pv-week-bars" aria-hidden="true">
        {WEEK.map((w, i) => (
          <div key={w.d} className="pv-week-col">
            <span className="kit-meta kit-num">{w.h.toFixed(1)}</span>
            <span className="pv-bar" data-today={i === 4 ? "" : undefined} style={{ blockSize: `${(w.h / 3.2) * 100}%` }} />
            <span className="kit-meta">{w.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** An authored wordmark: set once, then the viewBox is fitted to the drawn
    glyphs so it scales to its region without stretching a letter. */
export function Wordmark({ label }: { label: string }) {
  const ref = useRef<SVGTextElement | null>(null);
  const [box, setBox] = useState("0 0 640 250");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.getBBox !== "function") return;
    const b = el.getBBox();
    if (b.width > 0) setBox(`${Math.floor(b.x) - 2} ${Math.floor(b.y) - 2} ${Math.ceil(b.width) + 4} ${Math.ceil(b.height) + 4}`);
  }, []);
  return (
    <svg className="kit-wordmark" viewBox={box} role="img" aria-label={label}>
      <text ref={ref} x="0" y="220" fill="currentColor" fontSize="300" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-14">
        hawa
      </text>
    </svg>
  );
}
