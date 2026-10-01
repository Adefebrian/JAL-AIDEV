# Accessibility for Remotion on a JAL website

What Remotion says about the accessibility of its own products, and the JAL rules that follow for any page with a Player, a Thumbnail or an export button. JAL targets WCAG 2.2 AA on every page; a Remotion section must not lower that.

From: https://www.remotion.dev/docs/accessibility , https://www.remotion.dev/docs/accessibility/dev , https://www.remotion.dev/docs/accessibility/pro , https://www.remotion.dev/docs/player/custom-controls , https://www.remotion.dev/docs/player/media-keys , https://www.remotion.dev/docs/player/player , https://www.remotion.dev/docs/player/autoplay , plus JAL-authored rules (`skills/jal-immersive/references/frames.md` sections 4 and 5, `skills/jal-motion`).

## 1. What Remotion states (product accessibility page, reviewed against WCAG 2.1 AA)

**Remotion Player** is called *partially supportive*:

- Good: play, pause, mute and fullscreen buttons are keyboard operable, have accessible names and a visible focus indicator. Composition content is rendered to real DOM, so text inside a composition is readable by screen readers.
- Gaps: the seek bar and the volume slider are not yet exposed as keyboard-operable sliders with a role, name and value; the mute button does not expose its pressed state; the time display is not exposed to assistive technology.

**Editor Starter**: tries for keyboard navigation, clear focus, labels and contrast, but becomes the customer's code and therefore the customer's accessibility responsibility.

**Remotion Studio**: a developer tool, no guarantees; known issues include dialogs that do not trap focus, a search input with only a placeholder as label, unannounced status messages, and low placeholder contrast.

**User code and templates**: Remotion cannot guarantee the accessibility of the code customers write; templates are excluded from the statement. No accessibility certifications are held (available as an Enterprise add-on on request).

**remotion.dev and remotion.pro** websites (separate statements): aim for WCAG 2.1 AA and RGAA 4.1.2, both "partially conformant". These describe Remotion's own sites, not the products; JAL does not copy them.

Reporting: file an issue in the Remotion repository.

## 2. JAL rules

### 2.1 Reduced motion

Default is: **a paused Thumbnail at the poster frame.**

- Read `prefers-reduced-motion` live (`usePrefersReducedMotion`, or `matchMedia` through the kit's `prefersReducedMotion()`), not once.
- Under `reduce`: no autoplay, no loop, no scroll scrub, no auto-advancing steps. Show the poster frame (stage 1 in `website-integration.md`) with a clear play button if the piece is meant to be playable.
- Pressing play is user-initiated and allowed; the Player may then run, with a visible pause control.
- If reduce turns on during playback, pause and jump to the poster frame.
- Server HTML and no-JS show the static poster, which equals the reduced-motion view.
- `ui_audit`'s `reduced-motion` rule should pass because a paused Player runs no animation loop.

### 2.2 Controls

- A composition longer than **5 seconds** and playing without a user's press needs a **pause** control reachable by keyboard (WCAG 2.2.2).
- Because the built-in seek bar and volume are not exposed as sliders, ship **custom controls** for any Player with controls. Build them from kit parts and real form elements:
  - Play/Pause: a `<button>` whose accessible name changes ("Play video" / "Pause video"), with `aria-pressed` omitted (the name carries the state).
  - Seek: `<input type="range" min=0 max=durationInFrames-1 step=1>` with `aria-label="Seek"` and `aria-valuetext` such as "0:12 of 0:30" (update on `timeupdate`, not every frame); on input call `seekTo`.
  - Volume: `<input type="range" min=0 max=1 step=0.05>` with `aria-label="Volume"`; mute `<button aria-pressed>`.
  - Time: text updated at a modest rate, with `aria-live="off"`; do not make it chatty.
  - Fullscreen: feature-detect; label "Enter full screen".
  - Targets 44 px or larger, focus ring from the tokens, contrast per the kit.
  - Keep them as siblings of the Player and pass the `ref` (`player.md` section 7), so they do not re-render the video.
- Use `renderCustomControls`, `renderPlayPauseButton`, `renderMuteButton` or `renderVolumeSlider` only if the markup you return meets the same bar. `renderVolumeSlider` has a default implementation that is vertical and keyboard navigable through Tab; read it before replacing it.
- Keyboard: Space toggles play only when the Player or its controls have focus (`spaceKeyToPlayOrPause`); never capture Space globally. Do not rely on `doubleClickToFullscreen` (it is not for mobile).
- **Media keys**: leave the default (`prevent-media-session`) unless this one Player should answer the hardware keys (`register-media-session`); never more than one.
- Fullscreen is unavailable on iOS Safari; do not promise it.

### 2.3 Text alternatives

- **Informative composition** (a product demo, a data story): put the message as real text beside it (a heading, a paragraph, a list of the steps); for a long piece add a transcript or a captions track. The Player's composition DOM text is readable by assistive technology, but an animated, mid-state read is confusing, so do not rely on it alone.
- **Decorative composition** (ambient loop): mark the host `aria-hidden="true"` and keep it out of the tab order (no controls, `clickToPlay={false}`), and add no meaningful information that exists only there.
- A `<Thumbnail>` poster used as an image: give the host `role="img"` and an `aria-label` that says what the still shows, or use the static `<img alt>` for stage 0.
- Do not nest interactive controls inside an `aria-hidden` region.

### 2.4 Audio, captions and flashing

- Autoplaying compositions are silent. Sound begins only from a press (`player.md` section 9).
- A composition with speech has captions (a WebVTT `<track>` for a real `<video>`, or an on-canvas caption component such as the Recorder's captions, `recorder.md`) and a transcript. Music-only needs a text description.
- Nothing flashes more than 3 times per second (WCAG 2.3.1), and large flashing areas are banned.
- Keep contrast of any text in the composition at 4.5:1 (3:1 for large text) at the poster frame and at the darkest frame.
- Provide a real text size at small widths: a 1920 wide composition scaled to a phone shrinks type (`player.md` section 6); check the smallest legible size (16 px equivalent) or ship a phone variant.

### 2.5 Scroll-driven sections

- A scrubbed, pinned section must not trap the keyboard or the focus: all content inside the pinned stage stays tabbable in order, and a skip link to after the section exists when the track is long.
- The section's information is available without scrolling through the animation (steps listed as text, or the end-state Thumbnail plus a list).
- Respect `scroll-behavior`; Lenis must pause when reduced motion is set (Lenis off, native scroll on).
- Provide a way to skip: the pinned track should never be longer than about 4 viewports, and the heading before it describes what follows.

### 2.6 Export and long tasks

- The Export button has a text label ("Download MP4"), not an icon alone.
- Progress uses a `<progress>` (or `role="progressbar"` with values) and a polite `role="status"` message for start, done and error; a Cancel button is focusable throughout.
- Do not move focus away from the button when the render starts; return focus to it when done.
- Error text says what to do ("This browser cannot export video. Use a recent Chrome, Firefox or Safari 26, or download the poster image.").
- The saved file's own accessibility (captions embedded or a sidecar file) is the author's job.

### 2.7 Drag and drop and pointer interactions

If a composition is interactive (draggable items), provide a keyboard path: arrow keys to move the selected item, Delete to remove, Escape to clear selection, an accessible list of items with their positions, and visible focus. Pointer-only interaction fails WCAG 2.1.1.

## 3. Test checklist (add to `ui_audit` runs and manual passes)

1. Reduced motion emulation on: Player never moves, Thumbnail shows the poster frame, scrub off.
2. Keyboard only: reach play, seek, volume, mute, fullscreen, export; operate each; focus visible; no trap.
3. Screen reader pass (VoiceOver on Safari at least): names and states are announced, the time is not noisy, the transcript is reachable.
4. Zoom 200 percent and 320 CSS px width: controls reflow, nothing overlaps (the no-overlap law applies to the control row).
5. Contrast check at the poster frame and one dark frame.
6. Autoplay silent loop has a visible pause after 5 seconds; pause works from the keyboard.
7. Turn off JavaScript: the poster, the text and the transcript remain.
8. Note in the build report that the default Remotion controls were replaced for the reasons in section 1, and who owns the follow-up if Remotion fixes them.
