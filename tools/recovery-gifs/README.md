# Recovery exercise GIF renderer

Original, deterministic 3D illustrations for the missing Sunday recovery entries.
No image-generation API or personal character is used. These are visually
compatible grayscale illustrations, not the proprietary Gym visual human model.
The existing wall push-up animation is reused unchanged directly by its media ID.

## Reproduce

Requires Node.js, Playwright, Microsoft Edge, Python and Pillow. Three.js is
vendored locally with its MIT license. Install development dependencies outside
the application or make them available through NODE_PATH:

```powershell
npm install --prefix "$env:TEMP/gym-journal-qa" playwright
$env:NODE_PATH="$env:TEMP/gym-journal-qa/node_modules"
python -m pip install Pillow
node tools/recovery-gifs/render.cjs
```

Outputs 48-frame, 180×180 GIFs and JPEG thumbnails to `videos/` and `images/`:

- `c006`: relaxed walking in place (warm-up illustration).
- `c008`: side-lying open book; knees/pelvis stay stacked while chest/upper arm open.
- `c009`: doorway chest stretch; forearm supported while torso gently turns.
- `c010`: standing, gentle breathing (closing illustration; walking remains in instructions).

`scene.html` defines the procedural mannequin, joint chains, equipment, camera
and motion. `render.cjs` renders fixed time steps in a local browser;
`pack.py` downsamples and assembles a GIF with a shared color palette. Temporary
frames and contact sheets remain in the printed temporary directory for inspection.
These illustrations represent the exercise; they do not measure muscle activation.
