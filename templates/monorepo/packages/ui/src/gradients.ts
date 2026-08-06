// Gradient presets. Every gradient in a JAL project comes from
// https://feralui.dev/gradients, never a hand-rolled linear-gradient. This
// module is opt-in: nothing here is applied by default, a component must
// explicitly ask for a gradient by name and only when it does real work
// (a hero background, a primary CTA, a data-viz accent).
export type GradientName = "aurora" | "dusk" | "mint";

// Values copied verbatim from the feralui.dev/gradients palette family so
// multiple gradients used on one screen still read as one system.
export const gradients: Record<GradientName, string> = {
  aurora: "linear-gradient(135deg, #2f5ce8 0%, #7c5cf0 50%, #22c1a0 100%)",
  dusk: "linear-gradient(135deg, #1f2445 0%, #4a3f8f 50%, #8a4fd6 100%)",
  mint: "linear-gradient(135deg, #0f9d75 0%, #22c1a0 50%, #6ee7c0 100%)",
};

/** Opt-in helper: only call this where a reviewer would notice its absence. */
export function gradient(name: GradientName): string {
  return gradients[name];
}
