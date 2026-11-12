# Emil Kowalski design and motion pass

Applied the installed `emil-design-eng` principles and `review-animations` bar to the existing working studio. The renderer and visual output remain unchanged.

| Before | After | Why |
| --- | --- | --- |
| Every generation and restoration fades/scales the artwork | Instant rendering, no history entrance animation (`app.js:233`) | Frequent exploration should be immediate |
| Keyboard input can trigger selection and preview motion | Input modality settles active motion and disables transitions (`app.js:23`, `style.css:175`) | Keyboard actions stay fast and predictable |
| Highlight restarts on every state sync | Only changed positions animate; 180 ms custom ease-out; size changes snap (`app.js:38`) | Less incidental motion, correct geometry |
| History is emptied and rebuilt on every render | Reuse keyed buttons, preserve focus, expose selected state (`app.js:210`) | Keyboard users can continue navigating after restoration |
| Export label replacement changes button content abruptly | Fixed-width, 160 ms transform/opacity feedback (`style.css:45`) | Clear progress and completion without layout movement |
| Export temporarily loses keyboard focus | Restore focus if the user has not moved elsewhere (`app.js:269`) | Continued keyboard operation without stealing focus |
| Unconditional hover treatments and tiny mobile buttons | Fine-pointer hover gating; 44 px toolbar and swatch heights | Avoid sticky hover and improve touch ergonomics |
| Tall text list and seed-only history | Compact structure icons and descriptions; form/seed captions | Easier scanning and restoration |

## Motion review verdict

**Approve** for the authored app interactions: repeated rendering is immediate; pointer selection is interruptible and limited to 180 ms; export transitions affect only opacity and transform; keyboard input suppresses motion; reduced-motion preference settles Motion and disables CSS movement. Deliberate Replay remains a user-controlled animation sandbox, so its configured duration can exceed the routine UI timing budget. DialKit's internals are upstream code and were not rewritten.

Verified in the browser: rapid structure selection finishes aligned; keyboard generation leaves artwork at opacity 1 with no transform; history restoration keeps focus; keyboard export returns focus to the button; no horizontal overflow at 320/390 px; downloaded PNG dimensions and SVG XML structure; no warning/error logs.

Not tested: physical touch hardware, separate Firefox/Safari runs, or changing the operating-system reduced-motion setting. Reduced-motion paths were reviewed in source. No frame-by-frame performance trace was captured.

## Neutral branding and custom artwork colors

| Before | After | Why |
| --- | --- | --- |
| Tinted interface selection/focus colors | Neutral black, white, and gray chrome | Matches the monochrome branding direction |
| Native ratio/export selectors and mixed icons | Official shadcn Select/Button sources with Lucide icons | Consistent geometry, keyboard behavior, and focus treatment |
| Preset accent colors only | Presets plus shadcn Popover/Slider color wheel | Artwork can use any RGB accent without changing the interface brand |
| Default component-wide transitions | Explicit transforms/opacity; keyboard and reduced-motion overrides | Preserves the prior motion rules |

The artwork keeps Monochrome, Violet, Sage, Ember, and Ice presets. Existing saved colors are preserved; there is no color-removal migration. The custom picker supports pointer capture, keyboard hue/saturation adjustment, three labeled sliders, validated hex input, Escape dismissal, and trigger focus restoration. Preset and custom accent colors are reflected in PNG and SVG exports.

Source components are copied from the official shadcn registry and customized locally. The renderer remains the state owner; native controls and a synchronization event bridge the small React roots. Local UI bundles and upstream notices are included in the offline package.


## UI Skills layout and baseline review — November 12, 2026

Used `npx ui-skills start`, then selected `pbakaus/layout` and `ibelick/baseline-ui` from the CLI catalog. The spatial goal is a stable art workspace with direct access to three tasks: pattern, artwork colors, and canvas/export settings. Keep the neutral studio identity and all existing artwork palettes.

| Finding | Implemented change | Evidence |
| --- | --- | --- |
| Spiral settings push colors and export settings far below the fold | Pattern / Colors / Canvas navigation using Radix Tabs | All three sections reachable directly; arrow keys change selection and focus |
| Browser-default circle and spiral sliders have heavy tracks and mismatched thumbs | Shared thin tracks, neutral thumbs, readable numeric values | Desktop and mobile rendered review |
| History consumes 136 px and crops artwork thumbnails | Compact 108 px history region with contained thumbnails and truncated captions | Desktop portrait preview grows from 400 to 428 px tall at 1280×720 |
| Mobile aspect-ratio constraints leave the artwork off-center | Explicit stage width with contained canvas | Centered at 320 and 390 px; no document horizontal overflow |
| Form names use 11 px text and competing fine print | 12 px desktop structure labels, grouped navigation, tighter intra-control rhythm | 1280, 820, 390, and 320 px review |
| Mobile focus order visits inspector before the preview shown above it | Preview precedes inspector in DOM; desktop uses named grid areas | Source order follows mobile reading order; preview remains primary |
| Updates can combine new HTML with cached old assets | Version changed CSS and UI/app scripts | Reload presents the current inspector |

Spacing follows the existing 4 px rhythm: 4/8 inside controls, 16/24 between tasks. The preview leads, inspector supports, and history stays secondary. Related settings share one panel instead of one long scroll. Panels remain mounted so the native renderer bridge, color pickers, and DialKit preserve state. No new animation was added; existing keyboard and reduced-motion overrides remain.

Mechanical inspection covered grid minimums, overflow, hidden panels, focus outlines, sticky stacking, safe-area insets, text truncation, and touch targets. The CLI-delivered layout document references an `impeccable detect` script through an unresolved `{{scripts_path}}` placeholder; that executable was not supplied by ui-skills, so no detector result is claimed. Source inspection and rendered DOM measurements were used instead.

Verified: build, TypeScript/syntax, existing color and geometry/export tests; color-wheel hex application, preserved accent after tab switches, background hex application and reload persistence, transparency toggle, circle/spiral switching, canvas ratio selection, arrow-key tabs, and 44 px mobile tab targets. At 320 and 820 px, document scroll width equals viewport width. Mobile picker stays within the viewport. Long history titles truncate while full names remain in accessible labels/tooltips. No renderer or export implementation changes were made. Physical touch hardware, separate Firefox/Safari runs, OS reduced-motion switching, and localization were not tested.
