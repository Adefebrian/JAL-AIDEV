// RemotionSection: a kit band that holds one Remotion composition.
//
//   <RemotionSection
//     video={productIntro}
//     title="Air you can read." lead="Ten-second samples, one clear next step."
//     label="Hawa product intro: headline, then three figures count up"
//     poster={{ src: "/media/product-intro.webp" }}
//   />
//
// It is a kit Section with data-kit-composition="media" and
// data-variant="video-<mode>", so ui_audit's rhythm, repetition, and
// dead-space rules see it like any other media band, plus an optional
// SectionHead (one heading and one lead, never a kicker) and the
// RemotionFrame on the full grid. Everything about loading, reduced
// motion, scrub, and controls lives in RemotionFrame.
import { useId, type ReactNode } from "react";
import { Section, SectionHead, type SectionFrame } from "@__APP_NAME__/ui";
import { RemotionFrame, type RemotionFrameProps } from "./RemotionFrame";

export interface RemotionSectionProps<P extends Record<string, unknown>> extends Omit<RemotionFrameProps<P>, "tone">, SectionFrame {
  /** The media frame fill. Default the tone that contrasts with the band (surface on a layer band). */
  mediaTone?: "layer" | "surface";
  /** The visible heading; when absent, `label` names the section. */
  title?: ReactNode;
  lead?: ReactNode;
  headLayout?: "split" | "stack";
}

export function RemotionSection<P extends Record<string, unknown>>({
  id,
  tone,
  attached,
  title,
  lead,
  headLayout = "split",
  mediaTone,
  ...frame
}: RemotionSectionProps<P>) {
  const headId = `${useId()}video-head`;
  const mode = frame.mode ?? "autoplay";
  return (
    <Section
      id={id}
      tone={tone}
      attached={attached}
      composition="media"
      variant={`video-${mode}`}
      labelledBy={title ? headId : undefined}
      label={title ? undefined : frame.label}
    >
      {title ? <SectionHead id={headId} title={title} lead={lead} layout={headLayout} /> : null}
      <div className="video-body">
        <RemotionFrame {...frame} tone={mediaTone ?? (tone === "layer" ? "surface" : "layer")} />
      </div>
    </Section>
  );
}
