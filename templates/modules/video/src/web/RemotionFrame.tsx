// RemotionFrame: one Remotion composition as kit media on a JAL page.
//
//   <RemotionFrame video={productIntro} label="Hawa product intro" />
//   <RemotionFrame video={dataStory} mode="scrub" scrollClock={useLenis()} label="..." />
//
// What it guarantees:
//   - No layout shift: the kit media frame holds the composition's aspect
//     ratio from the server HTML on (capped at maxBlockSize tall, so a 9:16
//     cut never runs past the screen).
//   - Poster first: the server and the first paint show the box (and the
//     poster image when given). @remotion/player and the composition load
//     as their own chunks only when the frame comes within nearMargin of
//     the viewport, then a <Thumbnail> at the poster frame takes over, and
//     the <Player> mounts once the frame has been on screen.
//   - Reduced motion: the Thumbnail at posterFrame stays; nothing plays or
//     scrubs on its own, and no clock runs. A play control remains, so the
//     viewer can opt in.
//   - Autoplay is muted, inline, and only on screen: it pauses offscreen
//     and in a hidden tab, and resumes when back (unless the viewer paused).
//   - Scrub: the frame follows scroll progress through the scroller that
//     getScroller() returns after mount; on Lenis's clock when passed.
//   - Controls by policy (policy.ts): a 44px JAL toggle below the media,
//     never over it; a pause control whenever autoplay runs past 5 s. An
//     autoplay piece always reserves the bar's height (reduced motion, known
//     only after hydration, can add a play control), so nothing shifts.
//   - A new video (another video.id) drops the loaded module and starts over
//     from its own poster.
//   - Audits: the figure is kit media (data-kind="canvas", the slot marked
//     data-jal-canvas and labelled), and the composition's own DOM sits in an
//     aria-hidden stage with no pointer events, so ui_audit treats the drawn
//     frame like a canvas and checks the page around it.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PlayerRef } from "@remotion/player";
import { getScroller, scrollerRoot, usePrefersReducedMotion } from "@__APP_NAME__/ui";
import type { z } from "zod";
import { durationInSeconds, loadVideo, resolveProps, type VideoEntry, type VideoModule } from "../compositions/registry";
import {
  clampFrame,
  progressToFrame,
  resolveControls,
  resolveStage,
  scrubProgress,
  shouldPlay,
  viewportBox,
  type ControlsPolicy,
  type ScrubRange,
  type VideoMode,
} from "./policy";
import { watchScroll, type ScrollClock } from "./scroll";

type PlayerLib = typeof import("@remotion/player");
let playerLib: Promise<PlayerLib> | null = null;
/** The Player chunk, loaded once per page. */
export function loadPlayer(): Promise<PlayerLib> {
  playerLib ??= import("@remotion/player");
  return playerLib;
}

export interface PosterImage {
  src: string;
  width?: number;
  height?: number;
  /** The LCP media: eager, fetchpriority high. */
  priority?: boolean;
}

export interface RemotionFrameProps<P extends Record<string, unknown>> {
  video: VideoEntry<P>;
  /** Overrides of the composition's defaultProps, validated by its schema. */
  inputProps?: Partial<P>;
  /** Accessible name of the video, e.g. "Hawa product intro". */
  label: string;
  mode?: VideoMode;
  /** An image of the poster frame, shown before any video code loads (and with no JavaScript). */
  poster?: string | PosterImage;
  /** The still for reduced motion and the thumbnail. Default the entry's posterFrame. */
  posterFrame?: number;
  /** Requested controls; policy.ts may add a pause control. */
  controls?: ControlsPolicy;
  /**
   * Autoplay only. Default false: a JAL composition lands and holds its
   * final frame (a loop that snaps back to frame 0 reads as a glitch). Set
   * it for an ambient piece built to loop seamlessly.
   */
  loop?: boolean;
  scrub?: ScrubRange;
  /** Lenis from packages/motion (useLenis()); null or absent means native scroll. */
  scrollClock?: ScrollClock | null;
  /** The tallest the frame may get. Default "80svh". */
  maxBlockSize?: string;
  /** Load this far before the viewport (an IntersectionObserver rootMargin). Default "50% 0px". */
  nearMargin?: string;
  caption?: ReactNode;
  /** Extra controls in the bar below the media (the MP4 export, a link). */
  actions?: ReactNode;
  tone?: "layer" | "surface";
}

interface Loaded<P extends Record<string, unknown>> {
  /** The video.id this module was loaded for. */
  id: string;
  lib: PlayerLib;
  mod: VideoModule<P>;
  schema: z.ZodType<P> | null;
}

export function RemotionFrame<P extends Record<string, unknown>>({
  video,
  inputProps,
  label,
  mode = "autoplay",
  poster,
  posterFrame,
  controls,
  loop = false,
  scrub,
  scrollClock,
  maxBlockSize = "80svh",
  nearMargin = "50% 0px",
  caption,
  actions,
  tone = "layer",
}: RemotionFrameProps<P>) {
  const figureRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const ownPause = useRef(false);
  const ownPlay = useRef(false);
  const reduced = usePrefersReducedMotion();
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [loadedState, setLoaded] = useState<Loaded<P> | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  // A module loaded for another video is not this video's: back to the poster until its own loads.
  const loaded = loadedState && loadedState.id === video.id ? loadedState : null;
  const failed = failedId === video.id;
  const [userPlay, setUserPlay] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  const still = clampFrame(posterFrame ?? video.posterFrame, video.durationInFrames);
  const policy = resolveControls({ mode, requested: controls, durationInSeconds: durationInSeconds(video), reduced });
  const stage = resolveStage({ mode, loaded: loaded !== null, seen, reduced, userPlay, controls: policy });
  const propsKey = JSON.stringify(inputProps ?? null);
  const props = useMemo(() => {
    if (!loaded) return null;
    const { props: resolved, error } = resolveProps(loaded.mod.defaultProps, inputProps, loaded.schema);
    if (error) console.warn(`[video] ${video.id}: props rejected by its schema, drawing the defaults (${error})`);
    return resolved;
    // propsKey stands in for inputProps, so an inline object does not re-resolve every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, propsKey, video.id]);

  // Near (load the chunks) and on screen (mount, play, pause), observed on
  // the real scroller: a contained shell's main, or the viewport.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      setSeen(true);
      setVisible(true);
      return;
    }
    const root = scrollerRoot(getScroller(el));
    const nearIo = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          nearIo.disconnect();
        }
      },
      { root, rootMargin: nearMargin },
    );
    const viewIo = new IntersectionObserver(
      (entries) => {
        const on = entries[entries.length - 1]?.isIntersecting ?? false;
        setVisible(on);
        if (on) setSeen(true);
      },
      { root, threshold: 0 },
    );
    nearIo.observe(el);
    viewIo.observe(el);
    return () => {
      nearIo.disconnect();
      viewIo.disconnect();
    };
  }, [nearMargin]);

  // Another video: its own run, from its own poster.
  useEffect(() => {
    setEnded(false);
    setUserPlay(false);
    setUserPaused(false);
    figureRef.current?.removeAttribute("data-video-frame");
  }, [video.id]);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (!near || loaded || failed) return;
    let live = true;
    // The schema chunk (zod) comes along only when there are props to validate.
    Promise.all([loadPlayer(), loadVideo(video, inputProps)]).then(
      ([lib, { mod, schema }]) => {
        if (live) setLoaded({ id: video.id, lib, mod, schema });
      },
      (err) => {
        console.error(`[video] ${video.id}: could not load, keeping the poster`, err);
        if (live) setFailedId(video.id);
      },
    );
    return () => {
      live = false;
    };
    // inputProps is read once, on the first load; later changes re-resolve through propsKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, loaded, failed, video.id]);

  // Mirror the Player's own play and pause (its built-in controls, the end of a non-looping run).
  useEffect(() => {
    const p = playerRef.current;
    if (stage !== "player" || !p) return;
    const onPlay = () => {
      setPlaying(true);
      // A play the viewer started (Remotion's own controls) clears their earlier pause.
      if (!ownPlay.current) {
        setUserPaused(false);
        setUserPlay(true);
        setEnded(false);
      }
      ownPlay.current = false;
    };
    const onPause = () => {
      setPlaying(false);
      if (!ownPause.current && policy === "remotion") setUserPaused(true);
      ownPause.current = false;
    };
    // The current frame on the figure (about four times a second while
    // playing, every seek while scrubbing), for tests, audits, and analytics.
    const onTime = ({ detail }: { detail: { frame: number } }) => figureRef.current?.setAttribute("data-video-frame", String(detail.frame));
    const onEnded = () => setEnded(true);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("timeupdate", onTime);
    p.addEventListener("ended", onEnded);
    return () => {
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("timeupdate", onTime);
      p.removeEventListener("ended", onEnded);
    };
  }, [stage, policy]);

  // The clock runs only while it should (policy.ts shouldPlay).
  useEffect(() => {
    const p = playerRef.current;
    if (stage !== "player" || !p || mode === "scrub") return;
    const want = shouldPlay({ mode, reduced, visible, pageVisible, userPlay, userPaused, ended });
    if (want && !p.isPlaying()) {
      if (!loop && p.getCurrentFrame() >= video.durationInFrames - 1) p.seekTo(0);
      ownPlay.current = true;
      p.play();
    } else if (!want && p.isPlaying()) {
      ownPause.current = true;
      p.pause();
    }
  }, [stage, mode, reduced, visible, pageVisible, userPlay, userPaused, ended, loop, video.durationInFrames]);

  // Scrub: frame = scroll progress, one seek per changed frame.
  useEffect(() => {
    const el = frameRef.current;
    const p = playerRef.current;
    if (mode !== "scrub" || stage !== "player" || !el || !p) return;
    const scroller = getScroller(el);
    let last = -1;
    const update = () => {
      const { box, viewportHeight } = viewportBox(el, scroller);
      const frame = progressToFrame(scrubProgress(box, viewportHeight, scrub), video.durationInFrames);
      if (frame === last) return;
      last = frame;
      p.seekTo(frame);
      figureRef.current?.setAttribute("data-video-frame", String(frame));
    };
    return watchScroll(scroller, update, scrollClock);
  }, [mode, stage, scrollClock, scrub?.startAt, scrub?.endAt, video.durationInFrames]);

  const toggle = () => {
    if (playing) {
      setUserPaused(true);
    } else {
      setEnded(false);
      setUserPaused(false);
      setUserPlay(true);
    }
  };
  const toggleText = playing ? "Pause" : ended ? "Replay" : "Play";

  const posterImg = typeof poster === "string" ? { src: poster } : poster;
  const ratio = video.width / video.height;
  const figureStyle = { "--video-ratio": String(ratio), "--video-max-block": maxBlockSize } as CSSProperties;
  const frameStyle = { "--kit-ratio": `${video.width} / ${video.height}` } as CSSProperties;
  const fill: CSSProperties = { width: "100%", height: "100%" };
  const common = loaded && props
    ? {
        component: loaded.mod.component,
        inputProps: props,
        compositionWidth: video.width,
        compositionHeight: video.height,
        durationInFrames: video.durationInFrames,
        fps: video.fps,
        style: fill,
      }
    : null;

  let media: ReactNode = null;
  if (stage === "poster" || !common || !loaded) {
    media = posterImg ? (
      <img
        src={posterImg.src}
        alt=""
        width={posterImg.width ?? video.width}
        height={posterImg.height ?? video.height}
        loading={posterImg.priority ? "eager" : "lazy"}
        fetchPriority={posterImg.priority ? "high" : undefined}
        decoding="async"
      />
    ) : null;
  } else if (stage === "thumbnail") {
    const { Thumbnail } = loaded.lib;
    media = <Thumbnail {...common} frameToDisplay={still} />;
  } else {
    const { Player } = loaded.lib;
    media = (
      <Player
        ref={playerRef}
        {...common}
        loop={mode === "autoplay" ? loop : false}
        autoPlay={false}
        initiallyMuted
        // JAL compositions are silent by default. Shared audio tags would be
        // data: URI <audio> elements, which the JAL CSP (media-src 'self')
        // blocks; a composition with sound passes its own count and the page
        // adds media-src data: on purpose.
        numberOfSharedAudioTags={0}
        controls={policy === "remotion"}
        clickToPlay={policy === "remotion"}
        spaceKeyToPlayOrPause={false}
        doubleClickToFullscreen={false}
        allowFullscreen={false}
        moveToBeginningWhenEnded={false}
        acknowledgeRemotionLicense
      />
    );
  }

  // Autoplay always keeps the bar (empty when it has no control), so the
  // reduced-motion play control appearing after hydration never shifts the page.
  const bar = mode === "autoplay" || policy === "jal" || actions;
  return (
    <figure
      ref={figureRef}
      className="kit-media video-media"
      data-kind="canvas"
      data-tone={tone}
      data-video-id={video.id}
      data-video-mode={mode}
      data-video-stage={stage}
      style={figureStyle}
    >
      <div ref={frameRef} className="kit-media-frame" style={frameStyle}>
        <div className="kit-media-slot" data-jal-canvas="" role="img" aria-label={label}>
          {/* The composition's DOM is a drawn frame, like pixels in a video:
              the slot's label is what assistive tech reads, and the stage is
              a decorative layer (aria-hidden, no pointer events) unless
              Remotion's own controls live in it. */}
          <div className="video-stage" aria-hidden={policy === "remotion" ? undefined : true} data-interactive={policy === "remotion" ? "" : undefined}>
            {media}
          </div>
        </div>
      </div>
      {bar ? (
        <div className="video-bar" data-empty={policy !== "jal" && !actions ? "" : undefined}>
          {policy === "jal" ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={toggle}
              disabled={!loaded}
              aria-label={`${toggleText} ${label}`}
            >
              {toggleText}
            </button>
          ) : null}
          {actions}
        </div>
      ) : null}
      {caption ? <figcaption className="kit-meta">{caption}</figcaption> : null}
    </figure>
  );
}
