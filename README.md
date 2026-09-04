# ROUTE 08 · the drive

A cinematic, single-file birthday show built with vanilla Three.js — no
framework, no build server, no network needed. You sit in the driver's seat
for a seven-minute drive through Cars-country: desert daylight, a wrong turn
at dusk, a neon town ceremony at night, and a sunrise race called
**The August 500** — one beat per clicker press, made to celebrate the
August birthdays on a projector.

> Open `route08_drive.html` in Chrome or Edge. Press `F` for fullscreen.
> Drive with Space.

## The show

| Mile | Act |
| --- | --- |
| 0 | Attract cinema — the landing video plays with sound under a "20 Years of Cars" title while people walk in (falls back to a roster loop if no video is present) |
| 1 | The arrival — one press drives the whole highway: dusk falls, each neon sign ignites as you pass it, and you roll to a stop under the welcome board |
| 2 | The town takes you in — one press per person; tractors interrupt halfway |
| 3 | The August 500 — two laps of a real stadium oval at sunrise, raced live from phones, with bumping, skid marks and dust |
| 4 | Finish photo, then the trophy and confetti |
| 5 | Credits |
| 6 | The open desert — everyone drives at once from their phones, no rails, watched on the speedway's big screen: an arcade car with headlights, dust and skid marks, cones to flatten, one checkpoint per guest to find across the town and the circuit, a lap clock under the arch with a leaderboard that lasts all night, a director cam that hops between drivers, a minimap, and things that happen to the world every ninety seconds. One more press is last call: the cars come home to the arch, the lamps go out, the board says goodnight |

## Keys

| Key | Does |
| --- | --- |
| Space · Right arrow · Enter · click | Next beat (standard clicker keys) |
| Left arrow · Page Up | Previous beat |
| 0–6 | Jump straight to a mile |
| W A S D | Drive a spare car yourself in the open desert |
| F | Fullscreen |
| B or . | Blackout, press again to resume |
| H | Honk (tips the tractors; sounds the horn in the open desert) |
| M | Mute the synthesized sound |
| R | Restart from the attract loop |

## Make it yours

Everything a presenter edits lives in
[`drive-src/js/00-config.js`](drive-src/js/00-config.js): the roster (one
line per person — race number, name, team, colour) and the show copy (the
welcome board, the race name and the finish-photo scrawl). Rebuild after
editing:

```bash
python drive-src/build.py
```

## Multiplayer (optional)

The August 500 is a real race on a real track: a stadium oval (two straights,
two 180° turns) that the cars lap while the cockpit camera chases the pack
through the corners. Every car runs live physics — nothing is choreographed.

Guests can drive: serve the folder over HTTP(S) (see deploying, below) and a
QR code appears on the starting-grid beat. Scan it, pick a car, and when the
lights go green, mash the big button to accelerate and hold ◀ ▶ to steer;
the projector page hosts the race over peer-to-peer WebRTC
([PeerJS](https://peerjs.com)). Steering is rate-based (hold to drift across
the track), so phone lag can't ruin it.

Steering matters: every race scatters a fresh set of cones and oil slicks
down the track (cones scrub your speed, oil sends you sliding), a tractor
ambles across the back straight on the final lap, and the corners have real
geometry — hugging the inside line is genuinely shorter. Unclaimed cars are
driven by AI pacers that hunt the racing line and dodge the cones, but not
perfectly. Real finishing order lands in the finish photo, and dropped
phones auto-reconnect and keep their car. With no phones joined (or no
internet) the same race runs between the AI drivers — the show never
depends on the network. Race physics integrate wall-clock time, so a
stuttering projector can't slow the race down.

## Deploying

The whole thing is static. Push to GitHub, import the repo in
[Vercel](https://vercel.com) (free tier, no configuration — `index.html` is
the show, `play/` is the controller, `assets/` holds the car models), or run
it locally:

```bash
python -m http.server 8123
```

On party night: open the show, let the tank fill, press `F` for fullscreen,
then any key to start. The show starts from an actual key press, so the
attract cinema always plays with sound (browsers refuse unmuted autoplay on
a page nobody has touched).

## Art assets (optional)

Every visual falls back to code-drawn art, so the show always runs. To
upgrade the look, drop files into [`drive-src/assets/`](drive-src/assets/README.md)
and rebuild:

- **`.glb` car models** — name one per person in the roster and it replaces
  their drawn car, auto-scaled and grounded (loads over HTTP; from plain
  `file://` the drawn cars are used)
- **Images** — mesa skylines, clouds, car cutouts, a tractor; generate them on
  a **pure magenta background** and the build keys it out automatically.
  Images are embedded as data URIs, so the show file stays self-contained.

## How it works

- `drive-src/js/` — small source modules concatenated by `build.py`:
  config → tween engine → preloader → canvas textures → 3D world → beats → overlays → loop → controls
- A pit-stop loading screen downloads every model and the landing video
  (with a byte-accurate progress bar — `build.py` bakes in the file sizes)
  before the show starts, so nothing pops in mid-show; models are parsed
  straight from the downloaded buffers, and on `file://` or any failure the
  show starts anyway on the drawn fallbacks.
- One beats array is the whole show: each beat is a waypoint on a straight
  desert road with a `night` value (0 = daylight, 1 = dark), and `go(i)`
  tweens the car, the time of day, the lights and the overlays to match.
- The cars are low-poly 3D models built from boxes; the neon, the mesas,
  the crowd and every sign are canvas-drawn textures, so the file has zero
  image dependencies.
- Fonts and Three.js load from CDNs; everything else is inline.

## Roadmap

- [ ] Meshy-generated GLB car models via GLTFLoader (slots already isolated in `buildCar`)
- [ ] Synthesised engine/neon/crowd sound
