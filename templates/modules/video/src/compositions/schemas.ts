// The zod schema of every composition's props, in one chunk of its own.
// The prop types are inferred from these schemas (the one source of
// truth), and the components import them as types only, so a page that
// plays a composition with its defaults never downloads zod. The schema
// chunk loads when a page passes inputProps (they are validated before a
// frame is drawn), on an export with props, and in Studio, whose prop
// editor is driven by these schemas. Remotion requires a z.object() at the
// top level.
import { z } from "zod";

export const productIntroSchema = z.object({
  product: z.string().min(1).max(32),
  headline: z.array(z.string().min(1).max(40)).min(1).max(3),
  lead: z.string().min(1).max(110),
  stats: z
    .array(
      z.object({
        value: z.number().finite(),
        decimals: z.number().int().min(0).max(2),
        unit: z.string().max(12),
        label: z.string().min(1).max(32),
      }),
    )
    .min(2)
    .max(4),
});
export type ProductIntroProps = z.infer<typeof productIntroSchema>;

export const dataStorySchema = z
  .object({
    title: z.string().min(1).max(48),
    note: z.string().min(1).max(72),
    unit: z.string().max(12),
    series: z
      .array(z.object({ label: z.string().min(1).max(6), value: z.number().finite().nonnegative() }))
      .min(3)
      .max(12),
    highlight: z.number().int().min(0),
    delta: z.object({ value: z.number().finite(), unit: z.string().max(4), label: z.string().min(1).max(32) }),
  })
  .refine((p) => p.highlight < p.series.length, { message: "highlight must index into series", path: ["highlight"] });
export type DataStoryProps = z.infer<typeof dataStorySchema>;

export const socialCutSchema = z.object({
  hook: z.array(z.string().min(1).max(24)).min(1).max(3),
  points: z.array(z.string().min(1).max(64)).length(3),
  cta: z.string().min(1).max(32),
  handle: z.string().min(1).max(32),
});
export type SocialCutProps = z.infer<typeof socialCutSchema>;
