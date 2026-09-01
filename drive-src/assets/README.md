# Art assets (all optional)

Drop files here and run `python drive-src/build.py`. Every slot falls back to
the code-drawn art when the file is missing, so the show always runs.

## Scenery models (.glb)

Buildings and roadside props are placed via `SHOW.props` in `js/00-config.js`:
`{file, x, z, ry, size}` — position on the road (the town runs z −450…−545,
left side is negative x), `ry` in quarter turns, `size` as target width.
Box buildings are auto-cleared where a prop stands (the `CLEAR` list in
`js/03-world.js`).

## 3D car models (.glb)

Any `.glb` here is copied to `assets/` beside the built show. Name a model in
the roster in `js/00-config.js` (fifth field, with an optional quarter-turn
yaw as the sixth) and it replaces that person's box car — auto-scaled to the
right footprint and grounded. Models load over HTTP (Vercel or a local
server); opened straight from disk the show keeps its box cars.

## Images (embedded at build time)

**Magenta trick:** generate images on a pure magenta background (like a chroma
key) and the build keys it out automatically — any pixel close to `#FF00FF`
becomes transparent. Transparent PNGs work too.

| File | What it is | Suggested size |
| --- | --- | --- |
| `mesa-far.png` | far mesa/butte skyline strip, transparent (or magenta) above the silhouette | 2048×256 |
| `mesa-near.png` | nearer, richer mesa strip | 2048×256 |
| `cloud.png` | a single puffy cloud, transparent/magenta around it | 512×256 |
| `car-03.png` … `car-30.png` | rear-view car cutout per person (file name = race number in the roster) | 512×360 |
| `tractor.png` | side view of a tractor, facing right | 512×400 |

Keep files under ~1.5 MB each — they get embedded into the single HTML file.
