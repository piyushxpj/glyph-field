# Glyph Field

A fast, offline studio for generating organic ASCII artwork. Open `index.html` in a modern browser. The included browser bundles work without an install, API key, server, or network requests.

![Glyph Field studio](studio-preview.jpg)

[Open the live studio](https://glyph-field.vercel.app) · [Download the offline tool](glyph-field-offline.zip) · [Example SVG](examples/mycelium-978573.svg)

## Use

- Choose Mycelium, Archipelago, Currents, Contours, or Cellular.
- Click **New composition** (**New** on mobile) or press **Space** outside a control for a fresh composition.
- Adjust form scale, coverage, glyph size, and accent quantity with the embedded DialKit controls. Arrow keys adjust a focused slider; Enter opens numeric entry.
- Open **Preview Motion** to tune a time-based spring, physics spring, or easing curve, replay the preview, or turn preview motion off. Motion feedback honors the system reduced-motion preference. Color swatches remain beneath the controls.
- Pick portrait, square, landscape, or story format.
- Choose **PNG** or **SVG** beside **Export** in the toolbar. The format choice is remembered.
- PNG exports have a 2048 px or 4096 px longest edge. SVG uses that nominal size with a scalable viewBox, editable text, vector marks, a vector grain pattern, and a gradient vignette. It contains no embedded bitmap.
- SVG glyphs remain text rather than outlined paths, so font appearance can vary across editors and operating systems. Composition settings are included in SVG metadata.
- Revisit up to eight recent compositions. Settings and history persist locally when browser storage is available.
- Enter a seed to repeat a composition. Exact reproduction requires the same seed and all the same controls. Font rendering can vary between browsers and operating systems.

## Style study

The reference combines a near-black charcoal ground; irregular, branching positive shapes; tiny monospaced texture zones; thick, pale `@` and ring-like edge glyphs; sparse enlarged violet letter fragments; and occasional crosshairs or dot arrays in the negative space. Composition is cropped at the edges, with substantial breathing room. This implementation approximates that visual language procedurally rather than reproducing the source pixel for pixel.

The renderer creates seeded, domain-warped noise fields, classifies foreground cells, finds their boundaries, stamps cached glyphs, and adds sparse accents and grain. Five field functions produce distinct families within the same visual language. Generation time is measured and shown beneath the preview. Export rerenders at the chosen resolution.

## Files

- `index.html` — accessible studio controls and preview
- `style.css` — responsive layout
- `app.js` — seeded renderer, export, local history, DialKit binding, and Motion feedback
- `vendor/` — local DialKit 2.2.0 and Motion 14.12.0 browser bundles, styles, and licenses
- `scripts/sync-vendor.mjs` — rebuilds browser bundles from the installed npm packages

To serve locally, run `python3 -m http.server 4187` from this directory and open `http://localhost:4187`.

## Design verification

The studio applies Stageshow’s framing and spacing guidance, with an Emil Kowalski design-engineering pass for interaction polish. See `DESIGN-PLAN.md`, `POLISH.md`, and `REHEARSAL.md` for scope and verification.

## Development

`npm install` installs DialKit and Motion. Run `npm run build` to refresh the offline bundles and create the static `dist/` deployment, `npm run check` for JavaScript syntax validation, and `npm start` to serve the app. The plain-JavaScript adapters preserve direct `index.html` use; no React conversion or build server is needed to use the tool.

Generation, texture changes, and history restoration update immediately without fading the artwork. Pointer-driven structure selection uses an interruptible 180 ms highlight; keyboard actions remain instant. The export button keeps a fixed width through preparing and completed states. History buttons keep their DOM identity and keyboard focus. Motion settings persist alongside the composition. DialKit's version menu supports comparing parameter sets within the session; recent image compositions continue to persist in the app's own history.

## Vercel deployment

`vercel.json` uses `npm ci`, runs `npm run build`, and publishes only `dist/`. The build includes the app, its local libraries, examples, and the offline download. Source control metadata, installed npm packages, and local settings stay outside the deployment output.
