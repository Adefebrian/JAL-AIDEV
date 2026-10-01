# Sound effects (@remotion/sfx)

From:
- https://www.remotion.dev/docs/sfx/
- https://www.remotion.dev/docs/audio/sfx
- Per-sound pages, one each under https://www.remotion.dev/docs/sfx/: anime-wow, bone-crack, bruh, ding, dramatic-boomer, fah, illuminati-confirmed, loading-lag, mac-quack, minecraft-hurt, mouse-click, nelly-ahh, oh-my-god-vine, omg-hell-nah, page-turn, price-is-right-fail, record-scratch, romance-meme, sanctuary-guardian-what, shutter-modern, shutter-old, skedaddle, snapchat-notification, spongebob-fail, triggered, ui-switch, vine-boom, whip, whoosh, wilhelm-scream, windows-xp-error, yippee

Remotion version this was written against: `remotion` 4.0.532, `@remotion/sfx` 4.0.429 (docs read 2026-10-01). The package code is MIT; each sound has its own licence.

## What it is

32 ready sound effects. Each export is a string URL to a WAV on the remotion.media CDN (`https://remotion.media/<name>.wav`), peak-normalised to -3 dB. They can be used without attribution, but attribution is printed on each sound's page. Drag a sound's waveform into Studio to import it. Each page also links the remotion.dev/convert tool.

```tsx
import {whoosh, whip} from '@remotion/sfx';
import {Audio} from '@remotion/media';
<Audio from={0} durationInFrames={30} src={whip} />
<Audio from={30} durationInFrames={30} src={whoosh} />
```

Or skip the package: `<Audio src="https://remotion.media/whoosh.wav" />`. Install with `bunx remotion add @remotion/sfx`.

## When a JAL agent uses it

Scene cuts, text reveals, UI clicks, page flips, camera shutter on photo moments. The brand voice of JAL work is professional, so the default palette is the first table below and nothing else.

## JAL policy: licence tiers

The docs are explicit that only some sounds have a clear licence. JAL turns that into two tiers.

### Tier 1 default allowed

Seven sounds. The CC0-only default (decided 2026-10-01) allows these in every JAL project.

| Name (import) | URL | Seconds | Use |
|---|---|---|---|
| `whoosh` | https://remotion.media/whoosh.wav | 0.154 | Fast whoosh: slides, wipes, element entrances |
| `whip` | https://remotion.media/whip.wav | 0.173 | Whip swish: quick pans, snap cuts |
| `pageTurn` | https://remotion.media/page-turn.wav | 0.4 | Page turn: document and story steps |
| `uiSwitch` | https://remotion.media/ui-switch.wav | 0.33 | UI switch: toggles, state changes in product demos |
| `mouseClick` | https://remotion.media/mouse-click.wav | 0.397 | Mouse click: cursor and button demos |
| `shutterModern` | https://remotion.media/shutter-modern.wav | 0.489 | Modern camera shutter: photo and screenshot moments |
| `shutterOld` | https://remotion.media/shutter-old.wav | 0.314 | Vintage camera shutter: retro photo moments |

Sources named on the pages:
- whoosh: Woosh by 1bob - freesound.org/s/831936
- whip: SWSH_Badminton Racquet_Recording_01_JW Audio by JW_Audio - freesound.org/s/838766
- page-turn: Draw Knife 1 by kenney.nl - kenney.nl
- ui-switch: UI Audio - Switch 35 by kenney.nl - kenney.nl
- mouse-click: Mouse Click Sound.mp3 by Pixeliota - freesound.org/s/678248
- shutter-modern: DSLR Shutter fast 006.wav by ristooooo1 - freesound.org/s/539136
- shutter-old: Werra.wav by hmilleo - freesound.org/s/409093

### Tier 2 brief only

Twenty-five sounds taken from myinstants.com. Their pages say the sound is not explicitly released under a free licence, "probably fine" because it is widely used, and that Remotion takes no responsibility. That is not clearance. The CC0-only default excludes them: use one only when Brian says yes for the project, and note the choice in the project README.

| Name (import) | Seconds | What it is | Source note |
|---|---|---|---|
| `animeWow` | 4.17959 | anime "wow" | myinstants page, no explicit free licence |
| `boneCrack` | 1.06812 | bone crack | myinstants page, no explicit free licence |
| `bruh` | 0.629 | "bruh" meme | myinstants page, no explicit free licence |
| `ding` | 1.4 | notification ding | myinstants page, no explicit free licence |
| `dramaticBoomer` | 1.33224 | dramatic boom | myinstants page, no explicit free licence |
| `fah` | 1.92723 | "fah" meme | myinstants page, no explicit free licence |
| `illuminatiConfirmed` | 7.8378 | "Illuminati confirmed" meme | myinstants page, no explicit free licence |
| `loadingLag` | 2.69352 | lagging loading | myinstants page, no explicit free licence |
| `macQuack` | 0.348821 | Mac quack | myinstants page, no explicit free licence |
| `minecraftHurt` | 0.365714 | game hurt grunt | myinstants page, no explicit free licence |
| `nellyAhh` | 1.46286 | "Nelly ahh" meme | myinstants page, no explicit free licence |
| `ohMyGodVine` | 1.61528 | "oh my god" Vine | myinstants page, no explicit free licence |
| `omgHellNah` | 4.40163 | "oh my god bro hell nah" meme | myinstants page, no explicit free licence |
| `priceIsRightFail` | 4.51918 | game-show fail horn | myinstants page, no explicit free licence |
| `recordScratch` | 1.2624 | record scratch | myinstants page, no explicit free licence |
| `romanceMeme` | 5.81 | romance meme | myinstants page, no explicit free licence |
| `sanctuaryGuardianWhat` | 9.00934 | "what" meme (Sanctuary Guardian) | myinstants page, no explicit free licence |
| `skedaddle` | 6.54803 | "skedaddle" | myinstants page, no explicit free licence |
| `snapchatNotification` | 0.218821 | Snapchat-style notification | myinstants page, no explicit free licence |
| `spongebobFail` | 3.38401 | cartoon fail jingle | myinstants page, no explicit free licence |
| `triggered` | 0.696599 | "triggered" meme | myinstants page, no explicit free licence |
| `vineBoom` | 1.255 | Vine boom | myinstants page, no explicit free licence |
| `wilhelmScream` | 2.0898 | Wilhelm scream | myinstants page, no explicit free licence |
| `windowsXpError` | 0.993 | Windows XP error | myinstants page, no explicit free licence |
| `yippee` | 2.64708 | "yippee" | myinstants page, no explicit free licence |

Several are internet memes and clash with a professional brand voice anyway.

## Use rules

- **Copy, do not hotlink.** The URL form makes every render and every page view depend on a third-party CDN. For Tier 1 (CC0, redistributable) download the WAV once into `public/sfx/` and use `staticFile('sfx/whoosh.wav')`. This also keeps the browser renderer deterministic and offline.
- **Align to the visual hit.** Place the sound with `from={Math.round(hitSeconds * fps)}`; the durations above tell you how long the clip occupies (a whoosh is 0.154 s, so on 30 fps that is about 5 frames; do not stretch it).
- **Keep it quiet.** SFX peak at -3 dB already; set `volume` around 0.4 to 0.7 under voice and ramp with `interpolate()` if two overlap (see `audio.md`).
- **One sound per beat.** Do not stack effects on every cut; sound design that is felt, not noticed.
- Music and other effects: free CC0 sources named by the docs are freesound.org (filter CC0), kenney.nl (all CC0) and soundcn.xyz (curated UI sounds, check each licence). Generating sound with ElevenLabs is paid and optional (see `elevenlabs.md`). Record the source and licence of every non-Remotion sound in the README.
- Contributing a new sound to Remotion is possible through their contributing guide; JAL does not need it.
