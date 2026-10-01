// The Root registry for Remotion Studio (and for any Remotion render path
// Brian approves later). Every composition is registered here once, with
// its zod schema so Studio offers visual prop editing, and its defaults.
// The sizes and timing come from registry.ts, the same entries the website
// and the in-browser export use.
import { Composition, Folder } from "remotion";
import { DataStory, dataStoryDefaults } from "./DataStory";
import { ProductIntro, productIntroDefaults } from "./ProductIntro";
import { dataStorySchema, productIntroSchema, socialCutSchema } from "./schemas";
import { dataStory, productIntro, socialCut } from "./registry";
import { SocialCut, socialCutDefaults } from "./SocialCut";

const size = (m: { width: number; height: number; fps: number; durationInFrames: number }) => ({
  width: m.width,
  height: m.height,
  fps: m.fps,
  durationInFrames: m.durationInFrames,
});

export function RemotionRoot() {
  return (
    <Folder name="JAL">
      <Composition id={productIntro.id} component={ProductIntro} schema={productIntroSchema} defaultProps={productIntroDefaults} {...size(productIntro)} />
      <Composition id={dataStory.id} component={DataStory} schema={dataStorySchema} defaultProps={dataStoryDefaults} {...size(dataStory)} />
      <Composition id={socialCut.id} component={SocialCut} schema={socialCutSchema} defaultProps={socialCutDefaults} {...size(socialCut)} />
    </Folder>
  );
}
