# Presets by mechanic

Organized by scene mechanic, not by client industry. The mechanic determines the
pipeline, the cost, and the traps. The industry determines none of those.

All budget figures below are starting points, not measurements. See
[budget.md](budget.md).

## 1. Mask reveal

A surface is progressively uncovered as the visitor scrolls.

| | |
|---|---|
| **Good at demonstrating** | Before and after. Transformation of a surface. The result of a service applied to something. |
| **Pipeline** | Procedural, almost always |
| **Budget** | Very low. Often a shader on a plane with two textures. |
| **Mobile** | Excellent. Fill rate bound, not geometry bound. |

Build: two textures and a progress uniform, with a noise texture shaping the
boundary between them.

**Trap: a perfect edge announces the effect.** A clean geometric wipe reads as a
CSS transition. Irregularity is what sells it: a noise-driven boundary, a soft
gradient, and texture along the edge. For a paint roller, the edge should have
the accumulation and slight unevenness of real application.

Second trap: the two states must be genuinely aligned. Any parallax between
before and after breaks the illusion instantly.

## 2. Curve travelling

The camera follows a defined path and content appears along it.

| | |
|---|---|
| **Good at demonstrating** | A journey, a sequence, a process with stages, a narrative with order |
| **Pipeline** | Either. Procedural environments work well. |
| **Budget** | Medium. Depends entirely on what lines the path. |
| **Mobile** | Good, if the environment is procedural and the path is short |

**Trap: arc length sampling.** Use `getPointAt`, not `getPoint`. Covered in
detail in [choreography.md](choreography.md). Getting this wrong produces a
camera that accelerates through curves on its own, which reads as a bug and
overrides your pacing.

**Trap: pacing.** Constant velocity leaves the middle of the journey empty. Fast
departure, slow middle, accelerating arrival.

Third trap: motion sickness. This mechanic is the one most likely to trigger it.
The reduced motion path is not optional here. See
[fallback-seo.md](fallback-seo.md).

## 3. Orbited object

A central object is examined from several angles.

| | |
|---|---|
| **Good at demonstrating** | Craft, finish, physical detail worth inspecting. Form that a photograph flattens. |
| **Pipeline** | Asset-based |
| **Budget** | Medium to high. One model dominates the payload. |
| **Mobile** | Good, if the model was decimated honestly |

**Trap: model weight.** This is the mechanic where an unaudited download does the
most damage, because the object is the entire scene and there is nothing to hide
behind. Audit before downloading, per [asset-audit.md](asset-audit.md).

**Trap: lighting cost.** The instinct is to add lights until it looks good. A
studio setup with three real-time lights and shadows costs more than the model.
Prefer an environment map, which gives believable reflection and ambient light
for one texture.

Third trap: the orbit must have a reason to stop. An object that spins forever
gives no sense of progress. Tie rotation to scroll and let it rest at a
considered final angle.

## 4. Assembly explosion

Components separate to reveal internal structure, and reassemble.

| | |
|---|---|
| **Good at demonstrating** | Internal engineering. What the buyer cannot see. Why the expensive version costs more. |
| **Pipeline** | Asset-based, **named hierarchy required** |
| **Budget** | High. Multiple parts, each with its own geometry. |
| **Mobile** | Medium. Reduce the number of separated parts before reducing anything else. |

**Trap: a merged mesh has no fix in code.** This mechanic is the one where the
hierarchy audit is not optional. If the parts do not arrive separated and named,
the mechanic is impossible without Blender rework. Verify before downloading.

**Trap: explosion direction.** Parts flying along global axes look mechanical.
Displace each part along the vector from the assembly centroid to that part's own
centroid, so the object opens outward the way a real exploded diagram does.

Third trap: the reassembly must be the same animation reversed, driven by the
same progress value, or the two directions will not match.

## 5. Explorable scene

A navigable space rather than a fixed path.

| | |
|---|---|
| **Good at demonstrating** | Space as the product. Venues, interiors, built environments. |
| **Pipeline** | Hybrid |
| **Budget** | The highest of the six. |
| **Mobile** | Hardest case. The low tier here is frequently "serve the static tour". |

**Trap: scope.** Freedom to explore means every angle must hold up, which
multiplies the work against a fixed path where you control the framing. Consider
whether a curve travelling would deliver the same argument for a fraction of the
cost.

**Trap: the visitor gets lost.** Full freedom with no guidance produces people
staring at a wall. Constrain movement, provide waypoints, and always offer a way
back to the intended route.

Third trap: this is the mechanic where the low tier matters most, because it is
the one that will genuinely be unusable on weak hardware. Define the static
version first, not last.

## 6. State transformation

One object changes form, material, or configuration across the scroll.

| | |
|---|---|
| **Good at demonstrating** | Configurability. Options. Before and after on the same object. |
| **Pipeline** | Either. Material changes are cheap, geometry changes are not. |
| **Budget** | Low for material transitions, high for morph targets |
| **Mobile** | Good for material, medium for geometry |

**Trap: geometry morphing is expensive.** Morph targets multiply vertex data by
the number of states. If the transformation is a colour, a finish, or a
configuration of visible parts, do it with materials and visibility, not with
morph targets.

**Trap: intermediate states must be coherent.** Scrolling stops anywhere,
including halfway through. Every intermediate frame is a frame someone will look
at. A transition that only makes sense at its endpoints is a broken transition.

## Choosing

| If the argument is | Start with |
|--------------------|-----------|
| We transform this surface | Mask reveal |
| We take you through a process | Curve travelling |
| Look at how this is made | Orbited object |
| Here is what is inside | Assembly explosion |
| This is the space | Explorable scene |
| It adapts to you | State transformation |

Cheapest that makes the argument wins. A mask reveal that demonstrates the
service beats an explorable scene that decorates it.
