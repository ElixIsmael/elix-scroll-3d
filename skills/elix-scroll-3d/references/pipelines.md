# Pipelines: procedural, asset-based, hybrid, interface

Families of scene with completely different failure modes. Choosing wrong means
discovering the real problem late, when the scope is already committed.

## Comparison

| | Procedural | Asset-based | Interface |
|---|---|---|---|
| What builds the scene | Primitives, shaders, masks, particles | One or few loaded models | Real DOM elements (cards, panels, a dashboard) moved with CSS 3D transforms |
| Initial download | Effectively zero beyond the library | The model, its textures, and the decoder | Nothing. No 3D library at all. |
| Where difficulty sits | Shader math, noise, tuning by eye | Audit, decimation, compression, hierarchy | Layout math: measuring slots, mapping scroll to poses |
| Licensing risk | None, you authored it | Real, and it must be checked before download | None |
| Iteration speed | Fast. Change a number, see the result. | Slow. A hierarchy fix means a Blender round trip. | Fast |
| Failure mode | Looks synthetic, too clean | Ships heavy, stutters, or cannot animate the part you need | Flat light, and elements crossing content mid-flight |
| Scales to low tier by | Reducing counts and resolution | Swapping a lower-poly variant, or dropping to static | Not flying: elements stay in place with an ordinary entrance |

## Prefer procedural when the result is equivalent

This removes weight, licensing, and rework in one decision. It is the single
highest-leverage choice in the whole process.

Things routinely built procedurally that people wrongly reach for a model to do:

| Effect | Procedural approach |
|--------|--------------------|
| Paint, ink, or liquid reveal | Shader mask driven by a noise texture and a progress uniform |
| Terrain, waves, dunes | Displaced plane geometry |
| Particles, dust, sparks, snow | Points geometry with an instanced material |
| Abstract background forms | Primitives with a custom material |
| Light rays, fog, atmosphere | Additive planes or a fragment shader |
| Trajectory, path, ribbon | Tube geometry along a curve |
| Text in space | HTML above the canvas, positioned, not 3D text |

Procedural also degrades gracefully by nature: counts and resolutions are already
numbers in your code, so a low tier is a smaller number rather than a different
asset.

## When an asset is genuinely required

The subject is a specific real object and its identity matters:

- The client's actual product, which must be recognizable
- A machine or tool whose exact form is the argument
- A branded item where a generic stand-in would read as dishonest
- Anything where the visitor knows what it should look like

In that case the object is the asset and everything around it should still be
procedural. A loaded model sitting on a loaded floor inside a loaded room is
three times the pipeline for one visible subject.

## Hybrid is the common real case

Central asset plus procedural environment. Budget it as asset-based, because the
model dominates the weight and the risk, and build the environment with the
procedural discipline: counts as variables, no second model for scenery.

## When the objects are interface

If the objects in the scene carry text or are pieces of the product interface
(cards, status chips, a panel, a dashboard), build them as DOM elements moved with
CSS 3D transforms, not as meshes with a canvas texture.

| DOM element in CSS 3D | Canvas texture on a mesh |
|-----------------------|--------------------------|
| Sharp at any pixel ratio, rasterized by the browser | Blurs when scaled, and any post-processing blurs it further |
| Zero download | The 3D library, plus a texture redraw per state change |
| Interactive, focusable, indexable | Needs a separate HTML equivalent |
| Can be the real component the scene hands over to | Must be swapped for the real component at the end |

What it cannot do: real lighting, reflections, depth of field, a vanishing point
shared by many elements (`perspective()` is per element), or more than roughly a
dozen moving elements. Light it with a gradient sheen and a shadow that deepens
while the element floats. Animate `transform` and `opacity` only, and shrink the
floating pose from the natural size, never enlarge it: an element blown up from a
small raster turns soft.

The worked mechanic is the interface fly-in in [presets.md](presets.md), with
starting code in `templates/fly-cards.js`.

## Choosing, in order

1. Are the objects interface, carrying text or product UI? Interface pipeline for
   them. A procedural scene can still sit elsewhere on the page.
2. Can the effect be procedural without the result suffering? If yes, stop here.
3. Is a specific real object the subject? If yes, asset-based for that object only.
4. Does the scene need surroundings? Build them procedurally, not as more assets.
5. Does a specific part need to animate independently? Go to
   [asset-audit.md](asset-audit.md) before downloading anything.

## Cost that people forget

Asset-based pipelines carry fixed costs beyond the model file:

- The decoder for the compression you chose, shipped to every visitor
- A loading state, because the model is not instant
- A failure path, because the fetch can fail
- Disposal logic, because the model holds GPU memory after the scene ends
- A credits entry, because the license requires provenance tracking

Procedural pipelines carry none of these. Weigh that before deciding the model
"is just a few megabytes".
