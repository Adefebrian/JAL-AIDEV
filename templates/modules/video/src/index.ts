// Video module (opt-in): Remotion compositions on JAL pages, and MP4 out of
// the browser. Copy into packages/video; see README.md.
//
// This barrel has no Remotion code at its top level: the registry is
// metadata plus import() loaders, RemotionFrame loads @remotion/player on
// approach, and exportMp4 loads @remotion/web-renderer on the first export.
// Studio's entry (src/studio/index.ts) and Root.tsx are not exported here;
// they belong to the optional Studio workspace path.
export { RemotionSection } from "./web/RemotionSection";
export type { RemotionSectionProps } from "./web/RemotionSection";
export { RemotionFrame, loadPlayer } from "./web/RemotionFrame";
export type { RemotionFrameProps, PosterImage } from "./web/RemotionFrame";
export {
  resolveStage,
  shouldPlay,
  resolveControls,
  scrubProgress,
  progressToFrame,
  clampFrame,
  clamp01,
  viewportBox,
} from "./web/policy";
export type { VideoMode, VideoStage, ControlsPolicy, ScrubRange, Box, StageInput, PlayInput, ControlsInput } from "./web/policy";
export { watchScroll } from "./web/scroll";
export type { ScrollClock, FrameScheduler } from "./web/scroll";
export { VIDEOS, productIntro, dataStory, socialCut, durationInSeconds, resolveProps, loadVideo } from "./compositions/registry";
export type { VideoEntry, VideoMeta, VideoModule } from "./compositions/registry";
export type { ProductIntroProps, DataStoryProps, SocialCutProps } from "./compositions/schemas";
export { exportMp4, checkMp4Support, downloadBlob, loadRenderer } from "./export/mp4";
export type { Mp4ExportOptions, Mp4ExportResult, Mp4Support, ExportProgress, FrameRange } from "./export/mp4";
export { Mp4Export, useMp4Export } from "./export/Mp4Export";
export type { Mp4ExportProps, ExportState } from "./export/Mp4Export";
export { hasWebCodecs, framesIn, mp4FileName, formatBytes, MP4_CODECS, NO_WEBCODECS } from "./export/support";
export type { Mp4Codec, CodecGlobals } from "./export/support";
