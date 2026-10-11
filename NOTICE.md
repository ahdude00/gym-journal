# Media Attribution & License

## Workout Guide SVG illustrations

Selected, **unmodified** SVG frames from [Workout Guide](https://github.com/bryllim/workout-guide)
are stored in `assets/workout-guide/`. Artwork by **Bryl Lim**, based in part on
[Everkinetic](https://github.com/everkinetic/data), is licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Original attribution, frame provenance and the pinned source revision are retained
in `assets/workout-guide/sources.json`; the upstream asset license and attribution
documents are included alongside it. CSS displays the original white artwork on
a dark surface and cycles its three frames; the SVG files themselves are unchanged.
Only reviewed matches are used. Notes explain single-arm and grip differences;
unmatched exercises retain their existing illustration or instruction fallback.
Use `tools/import-workout-guide.cjs` to reproduce the import from a source checkout.

The Gym visual terms below apply to the remaining Gym visual files, not these SVGs.

The exercise **media** (thumbnail images and animation GIFs) in this repository
is the property of **Gym visual** and is redistributed here **with permission**.

> **© Gym visual — https://gymvisual.com/**

## Terms

Per the rights holder's permission, the media is included under the following terms:

- **Resolution:** distributed at **180×180** only.
- **Attribution:** every use must carry the copyright indication
  **© Gym visual — https://gymvisual.com/**. Each record in
  [`data/exercises.json`](data/exercises.json) also carries an `attribution`
  field with this notice.

If you use this media, keep the attribution intact and respect the 180×180
resolution limit.

## Reuse & licensing

The media is included here with the rights holder's **separate written
permission** (the mechanism Gym visual's terms require for redistribution). It
remains the property of Gym visual, and its use and reuse are governed by
**Gym visual's Terms & Conditions of Use**:

> **https://gymvisual.com/content/3-terms-and-conditions-of-use**

If you want to use this media in your own project, review those terms and, where
required, obtain your own license directly from Gym visual. **This repository
does not grant you any rights to the media beyond what Gym visual's terms
allow** — cloning this repo is not a license.

## Custom records (`c001`–`c005`)

Five exercises have no record of their own in the dataset and are added by
[`data/custom.js`](data/custom.js). They fall into two groups:

- **`c001`, `c002` — derived from Gym visual media.** Their poses occur *inside*
  other dataset animations, so the frames were extracted from those
  (`tools/ozel-gif-uret.py`). These remain **© Gym visual** and everything above
  applies to them unchanged.
- **`c003`, `c004`, `c005` — original drawings.** Cat-cow, wall slide and chin
  tuck do not appear anywhere in the dataset, and no dataset animation contains
  their poses, so no frame could be extracted. They are drawn from scratch as
  stick figures by [`tools/cop-adam-uret.py`](tools/cop-adam-uret.py).
  **These three are not Gym visual media and the notice above does not apply to
  them.**

## Dataset (non-media)

The exercise **data** (names, categories, body parts, equipment, targets,
muscle groups, and multilingual instructions) is separate from the media and
is released under the MIT License — see [`LICENSE`](LICENSE).
