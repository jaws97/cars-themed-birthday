#!/usr/bin/env python3
"""Concatenate drive-src into the single-file show: ../route08_drive.html

Images in drive-src/assets/ are embedded as data URIs so the built file
stays a true single file (works offline, from file://, no server needed).
"""
import base64
import json
import pathlib

root = pathlib.Path(__file__).resolve().parent

MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
assets = {}
assets_dir = root / "assets"
if assets_dir.exists():
    for f in sorted(assets_dir.iterdir()):
        mime = MIME.get(f.suffix.lower())
        if mime:
            assets[f.stem] = f"data:{mime};base64," + base64.b64encode(f.read_bytes()).decode()

# 3D models and video are copied beside the show rather than embedded (binary and big)
import shutil

big = [f for f in sorted(assets_dir.iterdir()) if f.suffix.lower() in (".glb", ".mp4", ".webm")] if assets_dir.exists() else []
# portraits live in assets/photos/ at whatever size they came: copied, never embedded
photos_dir = assets_dir / "photos"
photos = [f for f in sorted(photos_dir.iterdir()) if MIME.get(f.suffix.lower())] if photos_dir.exists() else []
if big or photos:
    out_assets = root.parent / "assets"
    out_assets.mkdir(exist_ok=True)
    for f in big:
        shutil.copy2(f, out_assets / f.name)
    if photos:
        (out_assets / "photos").mkdir(exist_ok=True)
        for f in photos:
            shutil.copy2(f, out_assets / "photos" / f.name)

# exact byte sizes for the preloader's progress bar (models, video, photos)
sizes = {f.name: f.stat().st_size for f in big}
sizes.update({"photos/" + f.name: f.stat().st_size for f in photos})

js = "const ASSETS=" + json.dumps(assets) + ";\nconst ASSET_SIZES=" + json.dumps(sizes) + ";\n\n"
js += "\n\n".join(f.read_text(encoding="utf-8") for f in sorted((root / "js").glob("*.js")))
css = (root / "show.css").read_text(encoding="utf-8")
tpl = (root / "index.tpl.html").read_text(encoding="utf-8")

out = tpl.replace("/*{{CSS}}*/", css).replace("//{{JS}}", js)
target = root.parent / "route08_drive.html"
target.write_text(out, encoding="utf-8")
# index.html is the same show, named for static hosts (Vercel, GitHub Pages)
(root.parent / "index.html").write_text(out, encoding="utf-8")

# the phone controller page, with the roster injected from 00-config.js
import re

config = (root / "js" / "00-config.js").read_text(encoding="utf-8")
people = re.search(r"const people=\[.*?\];", config, re.S).group(0)
play = (root / "play.tpl.html").read_text(encoding="utf-8").replace("//{{PEOPLE}}", people)
play_dir = root.parent / "play"
play_dir.mkdir(exist_ok=True)
(play_dir / "index.html").write_text(play, encoding="utf-8")
print(f"wrote {target} ({len(out):,} bytes, {len(assets)} embedded assets), index.html, play/index.html")
