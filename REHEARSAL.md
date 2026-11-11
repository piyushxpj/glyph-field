# Rehearsal: Glyph Field design fixes

Reference: Stageshow `dark-hero`, inspected in source for neutral surface steps, real UI type sizes, hierarchy, and compact layout. No example component was copied: this is an existing functioning application, not a simulated product scene.

Changed:
- Removed oversized intro, numbered section headings, decorative logo, background gradient, and redundant status marks.
- Placed generation and export together in the toolbar, sticky on compact screens.
- Fitted full artwork and recent history into the desktop viewport; inspector scrolls independently on short screens.
- Raised small label sizes, regularized spacing and control dimensions, retained violet as the reference-derived accent.
- Redesigned narrow view around artwork first, then touch controls. Preview height follows the artwork ratio.
- Preserved thumbnail aspect ratios; captions identify seeds.

Captured: `studio-preview.jpg` at 1280 × 900; `studio-mobile.jpg` at 390 × 844 (full-page capture). Also inspected 1280 × 720 and mobile landscape-artwork states.

Verified in the live browser:
- Desktop and mobile generation actions.
- Restoring a previous composition from history.
- Portrait / landscape canvas selection and responsive sizing.
- No horizontal document overflow at 390 px; no document overflow at 1280 × 720.
- Short-screen inspector independently scrolls (656 px viewport, 804 px content).
- No browser warning/error logs during the pass.
- JavaScript syntax check passes.

Review: Removed excess vertical space around mobile artwork after first inspection; rechecked the portrait and landscape views. Kept the complete image visible because this is an editing tool, not a marketing crop.

Gate: Not run. Stageshow's Stage/Act animation and faux-scene film gate do not apply to this static functional UI pass. No loop or new animation was authored.

Not checked this pass: Separate Safari/Firefox runs, assistive-technology session, and re-exporting PNG files. PNG export passed 2K and 4K checks in the previous implementation pass; the renderer and export code were unchanged here.

## SVG export verification

- Downloaded SVG from the toolbar; parsed successfully as XML.
- Sample: 1638 × 2048, viewBox 0 0 1200 1500; 12,566 text elements, 24 paths, no image or script elements.
- Opened the actual exported SVG in the browser and visually inspected it.
- Re-exported PNG successfully after the shared renderer changes.
- SVG format choice survives reload.
- Toolbar checked at 320 px without horizontal overflow; desktop checked at 1280 px.
- No browser warnings or errors; JavaScript syntax check passes.
- Third-party SVG editor import was not tested; text uses the editor’s monospace font.

## DialKit and Motion integration

Installed DialKit 2.2.0 and Motion 14.12.0. Embedded one vanilla DialKit root with real texture values, numeric entry, a collapsible spring/easing editor, and replay. The existing composition store owns texture persistence, reset, history, and export. Motion animates structure selection, new-composition feedback, and newly added history items. The libraries, styles, and licenses ship locally.

Verified:
- npm build (vendor sync), syntax check, dependency listing, and npm's install audit (0 vulnerabilities).
- Keyboard slider adjustment and direct numeric entry; Space on a dial does not generate an image.
- Reset restores slider values and artwork together.
- Motion time/easing modes and replay produce no runtime warnings/errors.
- Turning motion off settles preview opacity to 1 and transform to none.
- Changed glyph size to 10 in DialKit and downloaded SVG; parsed metadata confirms detail=10 and scale=50.
- Current texture values survive reload.
- 390 px mobile layout, including expanded motion controls, has no horizontal overflow.

Not checked: OS reduced-motion emulation, separate Safari/Firefox runs, DialKit version-menu save/restore, and a new PNG download in this pass. Reduced-motion behavior is explicitly wired to the live media query; PNG rendering/export logic was unchanged.

## Emil Kowalski polish (2026-11-11)

See `POLISH.md` for the review table and motion verdict. This pass supersedes the earlier preview/history entrance animations.

- Retested pointer selection, rapid retargeting, keyboard generation, history focus retention, and export focus recovery.
- Checked layouts at 1280 × 720, 1280 × 900, 390 × 844, and 320 × 740. Narrow layouts have no horizontal document overflow.
- Saved updated desktop and mobile screenshots.
- Downloaded PNG: 1638 × 2048. Downloaded SVG: parsed XML, 1638 × 2048, 17,961 text elements, no embedded images.
- Browser warnings/errors: none during the pass. Build and syntax checks pass.
- OS reduced-motion emulation and physical-device testing were not performed; live media-query handling and CSS fallbacks were reviewed.

## shadcn controls, neutral branding, and custom accent picker

- Installed official shadcn Button, Select, Popover, and Slider components; replaced action/structure icons with Lucide.
- Verified ratio selection with Space does not generate a new seed, and history restoration updates the custom ratio control.
- Pointer wheel drag changes hue/saturation; keyboard brightness endpoints work; invalid hex is rejected; valid hex applies with click and Enter.
- Escape closes the picker and restores trigger focus. Custom #22aaff survives reload.
- Checked 320 px and 390 px widths without horizontal overflow. At 390 × 844 the compact picker displays wheel, sliders, and hex input without internal scrolling.
- Downloaded both PNG and SVG with a custom accent for validation. No browser warning/error logs during control testing.
- Added color-conversion, hue-wrap, brightness, and wheel-boundary checks; TypeScript and JavaScript checks pass.
- No physical-device or separate-browser run was performed. The wheel's pointer capture supports touch, and the sliders provide keyboard alternatives.
- Export validation completed: 1638 × 2048 PNG contains 10,461 blue accent pixels; SVG metadata and text fills contain #22aaff with no embedded bitmaps.

## Independent background and glyph colors

- Added a separate Colors section with background, glyph, and accent controls. All use the shared accessible wheel/hex picker with unique field IDs.
- Existing saved states and history without the new fields load the original charcoal background and pale glyph defaults; saved accents remain intact.
- Verified cream background #f3eee3 and navy glyphs #283b56 with the existing violet accent #b980e8. All three survive reload and restore together from history.
- Reset texture preserves colors. Reset colors restores only the palette. Keyboard Escape restores focus to the correct picker trigger.
- Checked the new controls at 390 px with no horizontal overflow; desktop controls and artwork inspected at 1280 × 900.
- SVG background rectangles, glyph/mark colors, accent fills, and metadata follow the chosen palette; accent cutout rectangles use the selected background.
- Exported both SVG and PNG for palette verification. Browser warning/error logs: none. TypeScript, JavaScript, color utility tests, and production build pass.
