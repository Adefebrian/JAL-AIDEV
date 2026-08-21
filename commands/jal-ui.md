---
description: Invoke jal-ux to audit then fine-tune or rebuild a frontend to the JAL taste standard, from scratch or existing.
argument-hint: <scope>
---

Target scope: $ARGUMENTS

Dispatch agent `jal-ux` to bring `$1` (the full scope: $ARGUMENTS) up to the JAL taste standard, per `agents/jal-ux.md`. This may be a fresh build or an audit-and-tune pass on an existing frontend, decide which based on whether `$1` already has UI to review.

## Steps, in order

1. **Read skill `jal-ui-taste`** in full before touching any file: the modular type scale, 4/8pt spacing rhythm, radius and elevation tokens, mobile/tablet/desktop breakpoints and the mobile app-shell, visual-consistency rules, gradient discipline, UX heuristics, and the audit checklist. Do not re-derive any of this from memory.
2. **Audit `$1` against the taste checklist:**
   - Type scale and spacing/radius scale consistency.
   - Responsive behavior at mobile, tablet, and desktop breakpoints.
   - Visual consistency across screens (shared tokens, no one-off styles).
   - Gradient discipline: feralui.dev gradients only, nothing else.
   - UX heuristics (feedback, error states, empty states, discoverability).
   - Contrast at WCAG AA minimum.
   - Touch targets at 44px minimum on interactive elements.
   - If `$1` has no existing UI, skip straight to a from-scratch build against the same checklist.
3. **Report the audit findings** before changing anything, file and screen for each violation, so the scope of the fix pass is explicit.
4. **Apply fixes, or build fresh** if there was nothing to audit. Every screen touched must use koboyo or reicon icons, never inline emoji or a different icon set, and feralui gradients only where a gradient is used at all.
5. **No em dash, anywhere,** in copy, code comments, or UI text. Reference skill `jal-frontend-rules` for this and the rest of the banned-pattern list (no eyebrow labels, no glow, no neon).
6. **Verify against skill `jal-frontend-rules`** as the final gate: re-run the em-dash and banned-pattern scan against the touched files, confirm it is clean before reporting done.

Report the audit findings, what was fixed or built, and the final `jal-frontend-rules` verification result. Stay terse.
