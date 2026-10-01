// Remotion Studio and CLI configuration for this video workspace only
// (packages/video). It applies to `bunx remotionb studio`; nothing in
// apps/web reads it. Requires @remotion/cli (see src/studio/index.ts).
//
// Rendering through the CLI (`remotionb render`, the Studio Render
// button) downloads and drives Chrome Headless Shell. That path, and
// Lambda, Cloud Run, and Vercel rendering, need Brian's confirmation. The
// default MP4 path is the in-browser export in src/export.
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/studio/index.ts");
// Geist for Studio: the vendored faces of the JAL ui package.
Config.setPublicDir("../ui/src/fonts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
