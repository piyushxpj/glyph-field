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
