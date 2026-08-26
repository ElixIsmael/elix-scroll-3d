# Budget and device tiers

## How to read the numbers in this file

Two different kinds of number appear here, and they carry different authority:

| Kind | Authority | How to treat it |
|------|-----------|-----------------|
| Core Web Vitals thresholds | Published by Google at web.dev | Fixed. These are the pass marks, not opinions. |
| Everything else | Starting points, not measurements | Adjust against the actual project and the actual devices. Replace with your own measurements as soon as you have them. |

The weight and count figures below are deliberately conservative starting points.
They are not benchmarks. If you have not measured on the target device, say so
and label the figure an estimate.

## Core Web Vitals, the fixed part

Source: web.dev, Google's published "good" thresholds, measured at the 75th
percentile of real users.

| Metric | Good | What breaks it in a 3D page |
|--------|------|----------------------------|
| LCP | 2.5 s or less | Making the canvas the LCP element, or blocking render on the model fetch |
| INP | 200 ms or less | Heavy work on the main thread during scroll, model decode on interaction |
| CLS | 0.1 or less | Canvas resizing after load, content jumping when the scene mounts |

**The 3D canvas must never be the LCP element.** The LCP should be a poster image
or a heading that is present in the initial HTML. The scene takes over
afterwards. See [fallback-seo.md](fallback-seo.md).

## The budget document

Write these down before implementing. This is the deliverable of the step:

1. Maximum 3D asset weight per scene, desktop
2. Maximum 3D asset weight per scene, mobile
3. Target frame rate and minimum acceptable frame rate
4. The weakest device that must run this decently, named specifically
5. Which element is the LCP

### Starting points to adjust

Asset weight, compressed, per scene. Starting points only:

| Context | Starting point |
|---------|---------------|
| Mobile, total 3D payload | around 1.5 MB |
| Desktop, total 3D payload | around 4 MB |
| Single hero model | around 800 KB mobile, 2 MB desktop |

Frame rate. Starting points only:

| Target | Starting point |
|--------|---------------|
| Target on the reference device | 60 fps |
| Minimum acceptable, sustained | 30 fps |
| Below this, drop a tier automatically | sustained under 30 fps |

Triangle counts, which depend entirely on how large the object renders. Starting
points only:

| On-screen size | Starting point |
|----------------|---------------|
| Small, background or thumbnail scale | under 10k triangles |
| Medium, clearly the subject | 30k to 60k triangles |
| Large, fills the viewport and is inspected closely | up to 150k triangles |

Texture resolution against on-screen size. Starting points only:

| On-screen size | Starting point |
|----------------|---------------|
| Small | 512 px |
| Medium | 1024 px |
| Large, inspected closely | 2048 px |

4K textures are almost never justified on the web. If one seems necessary,
measure first.

### Naming the weakest device

"Mid-range Android" is not a specification. Name an actual device and an actual
year, because that is what makes the budget testable. The right choice comes from
the client's own analytics: the device at roughly the 25th percentile of their
real traffic, not the device you happen to own.

If there is no analytics data, say that the reference device was chosen without
data and should be revisited once traffic exists.

## Device tiers

At least three. What changes per tier:

| Lever | High | Medium | Low |
|-------|------|--------|-----|
| Pixel ratio cap | 2 | 1.5 | 1 |
| Particle count | full | roughly half | minimal or none |
| Texture resolution | full | one step down | two steps down |
| Shadows | on, soft | on, hard, or baked | off |
| Post-processing | on | minimal | off |
| Object count | full | reduced | minimal |
| Antialiasing | on | on | off |

All values above are starting points.

**The low tier may load no 3D at all** and serve the static version from
[fallback-seo.md](fallback-seo.md). This is a legitimate outcome, not a defeat.
A static page that loads instantly beats a 3D page at 12 fps.

## Detection

Never assume phone equals weak or desktop equals strong. A current flagship phone
outruns a five year old laptop, and both exist in the same traffic.

Signals worth combining, roughly in order of usefulness:

| Signal | What it tells you | Caveat |
|--------|-------------------|--------|
| `navigator.hardwareConcurrency` | Rough CPU parallelism | Absent or clamped in some browsers |
| `navigator.deviceMemory` | Rough RAM bracket | Chromium only, coarse buckets |
| Measured frame rate over the first seconds | The truth, eventually | Only available after starting |
| `navigator.connection.saveData` | The user asked for less | Honor it directly, drop a tier |
| `prefers-reduced-motion` | The user asked for less motion | Not a performance signal. Honor it separately. |
| WebGL renderer string | GPU family | Often masked or generic, treat as weak evidence |

The reliable pattern is to start conservatively, measure the actual frame rate
over the first seconds, and adjust upward or downward from there. Static
detection alone guesses wrong in both directions.

Every detection path needs a fallback for when the signal is missing. Missing
signal means assume the medium tier, never the high tier.

## When the budget breaks

It will. The answer is to cut visual scope, in this order:

1. Reduce counts: particles, objects, lights
2. Reduce resolutions: textures, render target, pixel ratio
3. Remove post-processing
4. Simplify or remove the model, or replace it with a procedural stand-in
5. Cut the mechanic down to a simpler one from [presets.md](presets.md)

What is not on the list: accepting the overrun and hoping the visitor has good
hardware. The budget was the promise. The visual scope is the variable.
