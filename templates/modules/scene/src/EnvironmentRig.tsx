// EnvironmentRig: image-based fill and reflections from a local HDRI.
//
// The file comes from Poly Haven (scripts/assets/polyhaven.ts get <id>
// --type hdris --res 1k --format hdr --out apps/web/public/assets/polyhaven)
// or the client, is served by the app itself (CSP connect-src 'self'), and
// never from a CDN or drei's preset URLs.
//
// background stays off: the page stays white-first and the scene sits on a
// real ground (Ground). The HDRI only lights and reflects. A 1k HDR is enough
// for lighting and soft reflections (about 1.5 MB); 2k only when a mirror-like
// product shows the environment sharply.
//
// intensity is the fill knob. Start at 0.4 to 0.7 with a shadow-casting key
// light; the environment alone flattens form. rotation turns the HDRI so its
// brightest softbox sits behind the key, which keeps highlights and shadows
// telling the same story.
import { Environment } from "@react-three/drei";
import { Euler } from "three";
import { useMemo } from "react";

export interface EnvironmentRigProps {
  /** URL of a local .hdr or .exr (served by the app). */
  files: string;
  intensity?: number;
  /** Y rotation in radians. */
  rotationY?: number;
  /** Off by default. Only a contained scene with its own art direction turns it on. */
  background?: boolean;
  backgroundBlurriness?: number;
}

export function EnvironmentRig({ files, intensity = 0.55, rotationY = 0, background = false, backgroundBlurriness = 0.6 }: EnvironmentRigProps) {
  const rotation = useMemo(() => new Euler(0, rotationY, 0), [rotationY]);
  return (
    <Environment
      files={files}
      environmentIntensity={intensity}
      environmentRotation={rotation}
      background={background}
      backgroundRotation={rotation}
      backgroundBlurriness={background ? backgroundBlurriness : 0}
    />
  );
}
