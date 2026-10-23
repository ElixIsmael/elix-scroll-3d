# Delivery checklist

Each item either passes, or becomes a finding with the code that causes it.

## Decision, revisited

- [ ] 3D adds something an image or video would not, and it is written down
- [ ] The mechanic demonstrates the service, not just the aesthetic
- [ ] The climax of the animation coincides with the call to action
- [ ] Nothing in the scene contradicts what the client sells
- [ ] A domain specialist would not flinch at any framing

## Budget

- [ ] Budget was written before implementation and is on record
- [ ] Actual asset weight measured and inside budget, desktop and mobile separately
- [ ] Frame rate measured on the named reference device, not estimated
- [ ] Sustained frame rate holds after a long session, not just at start
- [ ] Any figure that was not measured is labelled an estimate

## Assets, if the pipeline uses models

- [ ] Every model passed the audit before download
- [ ] Hierarchy supports the mechanic, with parts named
- [ ] Triangle count is proportionate to on-screen size
- [ ] Texture resolution is proportionate to on-screen size
- [ ] Pivot origin and scale corrected in Blender, not with magic numbers
- [ ] Delivered as GLB, processed by `gltf-transform`, never raw
- [ ] Compression chosen deliberately, and the decoder counted in the budget
- [ ] Unused animation clips, materials, and nodes stripped
- [ ] Credits file committed with source, author, license, and changes
- [ ] No CC-BY-NC or unlicensed asset in a commercial delivery

## Choreography

- [ ] One timeline with numeric `scrub`, not several independent animations
- [ ] GSAP animates a state object, never 3D properties directly
- [ ] Camera curve sampled by arc length (`getPointAt`, not `getPoint`)
- [ ] Pacing has a slow middle, not constant velocity
- [ ] Embedded animation driven by scroll-derived time, running both directions
- [ ] Text is fixed and timed, not travelling with the animation
- [ ] All text is HTML above the canvas, none rendered into a texture
- [ ] Objects that carry text or are product UI are DOM elements in CSS 3D, not canvas textures
- [ ] Debug slider exists and is gated behind a query parameter
- [ ] Scroll is never hijacked past the point of visitor control
- [ ] The footer is reachable without watching the whole animation
- [ ] A pinned section counts progress from its entry, and no pinned screen shows an empty stage

## Look

- [ ] The scene uses the page's own two or three tones, with state shown by lightness rather than by hue
- [ ] Where the canvas sits over a patterned background, it clears to transparent and its edge is invisible

## Render loop

- [ ] Pauses when the scene leaves the viewport
- [ ] Pauses when the tab is hidden
- [ ] No object allocation inside the loop
- [ ] Renders on demand when the scene is idle
- [ ] No post-processing unless the design needs a specific pass, and that pass is multisampled
- [ ] The scene is prepared before it is visible: library loaded on idle or approach, shaders compiled, first frame drawn
- [ ] Geometry, materials, textures, and render targets disposed on teardown
- [ ] No memory growth across a long session

## Device tiers

- [ ] At least three tiers defined, with the levers documented
- [ ] Detection has a fallback for missing signals, defaulting to medium
- [ ] Detection does not assume phone equals weak
- [ ] Frame rate measured at runtime and the tier adjusted downward if needed
- [ ] The low tier path was actually tested, not just written

## Mobile

- [ ] Pixel ratio capped per tier, with a pixel budget on top
- [ ] Post-processing removed before the pixel ratio was lowered
- [ ] No pinned stage on phones: the section scrolls and the scene plays once on entry
- [ ] Swipe works, with inertia and a drag limit
- [ ] Nothing depends on hover
- [ ] Touch targets meet the minimum
- [ ] Address bar appearing and disappearing does not cause jumps or resizes
- [ ] Mechanic direction preserved under vertical scroll
- [ ] Ten minute session tested for heat and frame rate decline
- [ ] Audio muted by default with a visible control, if present at all
- [ ] Tested on real hardware, not only in device emulation

## Fallback, accessibility, SEO

- [ ] All text content present in the HTML with JavaScript disabled
- [ ] `prefers-reduced-motion` serves an equivalent static version, not a slower one
- [ ] The reduced version carries the same information, including the argument
- [ ] Poster image is the LCP candidate, and the canvas is not
- [ ] Canvas dimensions reserved, no layout shift on mount
- [ ] Keyboard path complete, with visible focus, and no focus trap
- [ ] No WebGL: static version, no error surfaced to the visitor
- [ ] No WebGL: pinned sections unpin and show every text step
- [ ] Model fetch failure: static version, logged for the developer
- [ ] `webglcontextlost` handled with a restore attempt and a fallback
- [ ] `saveData` honored as an explicit request for less

## Core Web Vitals

Thresholds from web.dev, measured at the 75th percentile.

- [ ] LCP 2.5 s or less
- [ ] INP 200 ms or less
- [ ] CLS 0.1 or less
- [ ] Measured on the reference device and on a throttled connection, not only on the development machine

## Verification

- [ ] Every scroll state captured at phone and desktop widths, in Chromium and in Firefox (`tools/README.md`)
- [ ] Headless captures used as layout evidence only, never as frame rate evidence

## Final

- [ ] The page still makes its argument with the scene removed entirely
- [ ] Nothing in the delivery is an unlabelled guess
