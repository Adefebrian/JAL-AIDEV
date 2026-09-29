// JAL Core composition kit. Every JAL page is composed from these; styles
// live in ../kit.css (import after tokens.css and ui.css). The identity
// model, the direction knobs, and the page recipes are in
// skills/jal-design-system/references/identity.md.
export { Page, Section, SectionHead, Figure, DIRECTIONS } from "./Page";
export type { PageProps, SectionProps, SectionHeadProps, FigureProps, SectionFrame, SectionTone, SectionRhythm, DirectionId } from "./Page";
export { Masthead } from "./Masthead";
export type { MastheadProps, MastheadVariant } from "./Masthead";
export { Split } from "./Split";
export type { SplitProps, SplitRatio } from "./Split";
export { BentoGrid, BentoTile, validateBentoLayout } from "./Bento";
export type { BentoGridProps, BentoTileProps, BentoLayout, BentoKind } from "./Bento";
export { SpecRail, SpecTable } from "./Spec";
export type { SpecRailProps, SpecTableProps, SpecRow, SpecGroup } from "./Spec";
export { StatRow } from "./StatRow";
export type { StatRowProps, Stat } from "./StatRow";
export { FeatureGrid } from "./FeatureGrid";
export type { FeatureGridProps, Feature } from "./FeatureGrid";
export { MediaFrame } from "./MediaFrame";
export type { MediaFrameProps, MediaRatio } from "./MediaFrame";
export { Quote } from "./Quote";
export type { QuoteProps } from "./Quote";
export { LogoRow } from "./LogoRow";
export type { LogoRowProps, Logo } from "./LogoRow";
export { FAQ } from "./FAQ";
export type { FAQProps, FAQItem } from "./FAQ";
export { CTABand } from "./CTABand";
export type { CTABandProps } from "./CTABand";
export { PricingTable } from "./PricingTable";
export type { PricingTableProps, Plan, CompareRow } from "./PricingTable";
export { Footer } from "./Footer";
export type { FooterProps, FooterVariant, FooterLink } from "./Footer";
export { StickyStory, useStickyStory } from "./StickyStory";
export type { StickyStoryProps, StoryStep, StickyStoryState } from "./StickyStory";
export { validatePageRecipe, PAGE_RECIPES } from "./recipe";
export type { CompositionId, PageKind } from "./recipe";
