---
name: elix-scroll-3d
description: Build scroll-driven 3D web experiences that stay fast, indexable, and genuinely usable on mid-range phones. Use when the work involves scroll animation, parallax 3D effects, a Three.js scene, a GLTF or GLB model on a page, scrollytelling, a product page with 3D rotation, an animated hero, GSAP ScrollTrigger choreography, WebGL stuttering or overheating on mobile, a slow or heavy 3D site, or a canvas that Google sees as empty. Do not use for games, VR or AR, scientific or engineering data visualization, or a straightforward brochure site that does not need 3D at all.
---

# Scroll-driven 3D that does not punish the visitor

Most 3D websites are beautiful and badly built. They stutter on mid-range
hardware, ship tens of megabytes, fail Core Web Vitals, and hand Google an empty
canvas. The effect is real, but so is the bill.

This skill exists to get the effect without the bill. It is specialized: general
SEO, accessibility, and visual identity belong elsewhere. What follows covers only
what is specific to 3D and scroll animation.

Reference stack is Three.js plus GSAP ScrollTrigger, because that is the de facto
standard. The budget, degradation, and fallback principles are written to survive
a change of library.

## Step 0: does 3D earn its place

Ask first: what does 3D add that a photograph or a video would not?

If the honest answer is "it looks impressive", recommend an optimized video or
image instead, and say why. A looping video of the same motion is typically far
cheaper to build, cheaper to load, and works everywhere without a fallback path.

3D is justified when at least one of these is true:

| Condition | Example |
|-----------|---------|
| The object must be examined from several angles | A product the buyer would pick up and turn over |
| The transformation across scroll is itself the content | An assembly separating to show what is inside |
| The navigable space is the product | A venue, a floor plan, a built environment |

Decorative rotation of a closed box fails all three. Detail in
[references/decision.md](references/decision.md).

## Step 1: the mechanic must demonstrate the service

This is the conceptual center of the skill. Before choosing any technique, ask
what the animation proves about the client's business.

A scroll mechanic that only decorates is dead weight. A mechanic that
demonstrates the service is a sales argument that happens to be animated.

| Instead of | Do this |
|------------|---------|
| A painter's site where scroll reveals institutional text | A paint roller that reveals the "after" over the "before" |
| A shooting instructor's site with a spinning logo | A projectile path that introduces each fundamental as it travels, ending at the target |
| A product site that rotates the sealed box | An exploded view that shows the engineering inside |

Two rules that follow:

- **The climax of the animation must coincide with the call to action.** If the
  animation ends and the CTA arrives afterwards, the energy was spent and then
  discarded.
- **The mechanic must not contradict what the client sells.** In any scene
  involving a firearm, the camera never sits in front of the muzzle, because that
  is a basic range safety violation and the specialist audience reads it
  instantly. Domain plausibility beats an attractive framing, every time.

Detail and more worked examples in [references/decision.md](references/decision.md).

## Step 2: which pipeline

Two families of scene, with completely different failure modes. Choose before
writing code.

| Family | What it is | Where the cost sits |
|--------|-----------|---------------------|
| Procedural | Primitive geometry, shaders, masks, particles. No external asset. | Shader work and math |
| Asset-based | One or few loaded models are the subject, scenery built from primitives | Model pipeline: audit, decimation, compression, hierarchy |
| Hybrid | Central asset with a procedural environment | Both, and it is the most common real case |

**Prefer procedural whenever the result is equivalent.** It removes weight,
licensing, and rework in a single decision. Detail in
[references/pipelines.md](references/pipelines.md).

## Step 3: budget before code

Nothing is implemented before these are written down:

- Maximum 3D asset weight per scene, stated separately for desktop and mobile
- Target frame rate, and the minimum acceptable frame rate
- The weakest device that must still run this decently
- Which element is the page LCP, knowing that **the 3D canvas must never be the LCP**

If the budget breaks during construction, the answer is to cut visual scope, not
to accept the overrun. Numbers and tier tables in
[references/budget.md](references/budget.md).

## Step 4: device tiers

Define at least three tiers and what changes in each: pixel ratio, particle
count, texture resolution, shadows, post-processing, object count. The lowest
tier may load no 3D at all and serve the static version.

Detection must be explained and must have a fallback. Never assume phone equals
weak or desktop equals strong: a current flagship phone outruns an old laptop.

## Step 5: asset audit, before download

Only for the asset-based pipeline, and it is where most time is lost in practice.
Check all of this **before downloading**, not after:

| Check | Why it matters |
|-------|----------------|
| Named hierarchy | If a specific part must animate, it must arrive separated and named inside the file. A merged single mesh cannot be fixed in code and forces Blender rework. |
| Triangle count against on-screen size | Assets built for first-person game views are far denser than a website needs. If the object renders small, decimation is mandatory and no compression substitutes for it. |
| Texture resolution against on-screen size | A 4K texture on a small object is invisible waste. |
| Scale and pivot origin | A misplaced origin breaks every rotation. Fix it once in Blender rather than compensating with magic numbers forever. |
| License | CC0 is free for commercial use without attribution. CC-BY requires visible credit. CC-BY-NC does not work for client jobs. |
| Embedded animation | Whether the file ships animation, and whether it is usable, changes the scroll synchronization technique. |

Keep a credits file in the project recording source, author, license, and changes
made. Full procedure in [references/asset-audit.md](references/asset-audit.md).

## Step 6: assets and format

Treated as defaults, not as optional optimization:

- **GLB** is the delivery format. Separate glTF only during development, for inspection.
- **FBX and OBJ are input formats, never delivery.** Convert in Blender.
- **Meshopt** for geometry compression by default: faster decode, better behavior
  with animation. Draco when the file is still too large and the decode cost is acceptable.
- **KTX2** for textures when GPU memory is the bottleneck. Resize plus WebP for simpler cases.
- **`gltf-transform` is a mandatory pipeline stage.** Never ship a raw model.
- Load on demand per section, with Intersection Observer.
- Explicitly dispose geometry, material, and texture when leaving the scene.

Commands and parameters in [references/assets.md](references/assets.md).

## Step 7: scroll choreography

| Pattern | Rule |
|---------|------|
| Standard architecture | Fixed canvas covering the viewport, HTML sections scrolling over it. The 3D does not scroll, the content does. |
| Single timeline | One GSAP timeline with `scrub` driving everything. Never independent animations that can drift apart. Use a numeric `scrub` value rather than `true`, to smooth. |
| Animation and rendering separated | GSAP animates a plain state object. The render loop reads that state and applies it to the scene. Never let GSAP write directly into 3D object properties, or two systems fight over the same property. |
| Camera on a curve | Sample the curve by **arc length**, not by raw parameterization, or the camera speeds up and slows down on its own through curved segments. Pacing belongs in the timeline easing, not in an artifact of the curve geometry. |
| Pacing | Constant speed leaves the middle empty. What works: quick departure, deceleration through the middle where content breathes, acceleration into arrival. |
| Embedded animation | Drive the mixer from a time computed from scroll progress, not from frame delta, so the animation runs forward and backward with the scroll. |
| Text synchronized, not glued | Text blocks sit still, in a comfortable reading position, timed to scene progress. Text that travels with an animated element is unreadable, especially on a phone. The sense of following comes from synchronization, not from moving the text. |
| Text in HTML | All text lives in HTML above the canvas, never rendered into a texture. Sharpness at any size, indexing, and screen reader support. |
| Authoring tool | Build a debug panel with a 0 to 1 control driving the same timeline, early. Tuning poses by dragging a slider saves hours against scrolling the page repeatedly. |
| Limits | Never hijack scroll to the point where the visitor loses control of the page. There is always a clear path to the footer without watching the whole animation. |
| Render loop | Pause when the scene leaves the viewport and when the tab is hidden. No new object allocation inside the loop. Render on demand when the scene is idle. |

Code shapes in [references/choreography.md](references/choreography.md).

## Step 8: mobile is the main case, not an adaptation

- Swipe as the primary interaction, with inertia and a drag limit
- Minimum touch target respected, nothing depending on hover
- **Pixel ratio capped.** This is the most common single cause of frame rate collapse.
- Defined behavior for the address bar appearing and disappearing, which changes viewport height
- Reading direction preserved: if the mechanic depends on horizontal movement, it stays horizontal under vertical scroll
- Battery and heat tested in a long session
- Audio never automatic. Muted by default, with a visible control.

Detail in [references/mobile.md](references/mobile.md).

## Step 9: fallback, accessibility, SEO

- Every piece of text content exists in real HTML, never only drawn into the scene
- `prefers-reduced-motion` honored with an equivalent static version, not merely a
  slower animation. Use `gsap.matchMedia` to build the variants.
- A poster image loads first and the scene takes over afterwards, protecting the LCP
- A keyboard navigation path that does not depend on the scene
- Defined behavior for WebGL unavailable or asset loading failure

Detail in [references/fallback-seo.md](references/fallback-seo.md).

## Step 10: presets by mechanic

Presets are organized by scene mechanic, not by client industry. The mechanic
determines the pipeline, the cost, and the traps. The industry determines nothing.

| Mechanic | Pipeline | Good at demonstrating |
|----------|----------|----------------------|
| Mask reveal | Procedural | Before and after, transformation of a surface |
| Curve travelling | Either | A journey, a sequence, a process with stages |
| Orbited object | Asset | Craft, finish, physical detail worth inspecting |
| Assembly explosion | Asset, named hierarchy required | Internal engineering, what the buyer cannot see |
| Explorable scene | Hybrid, most expensive | Space as the product |
| State transformation | Either | Configurability, before and after on the same object |

Budgets, traps, and mobile degradation per preset in
[references/presets.md](references/presets.md).

## Golden rules

- If the 3D adds no meaning, it is dead weight.
- The mechanic must demonstrate the service, and the climax must coincide with the CTA.
- Procedural whenever the result is equivalent, always.
- No model enters the project without an audit of hierarchy, density, scale, and license.
- The performance budget is set before the first line of code and is not renegotiated afterwards.
- Degrading is mandatory. Stuttering is not acceptable.
- A canvas without equivalent HTML content is a site that is invisible to Google.
- Mobile is not the reduced version of the site. It is the main setting.
- An effect that stops someone reaching what they came for is not design, it is an obstacle.
- Domain plausibility beats attractive framing.
- Never invent a benchmark. If it was not measured, say it is an estimate.

## When to go deeper

| Situation | Read |
|-----------|------|
| Deciding whether 3D belongs here at all, or what the mechanic should prove | [decision.md](references/decision.md) |
| Choosing between procedural and asset-based | [pipelines.md](references/pipelines.md) |
| Setting budgets and device tiers | [budget.md](references/budget.md) |
| Evaluating a model before downloading it | [asset-audit.md](references/asset-audit.md) |
| Exporting, compressing, and shipping a model | [assets.md](references/assets.md) |
| Building the scroll timeline and camera motion | [choreography.md](references/choreography.md) |
| Touch, gesture, and degradation on phones | [mobile.md](references/mobile.md) |
| Reduced motion, no WebGL, indexing | [fallback-seo.md](references/fallback-seo.md) |
| Picking a mechanic and its known traps | [presets.md](references/presets.md) |
| Before delivery | [checklist.md](references/checklist.md) |
