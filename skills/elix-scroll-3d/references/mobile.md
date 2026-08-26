# Mobile as the main setting

Not the reduced version of the site. For most clients it is where the majority of
traffic arrives, which makes it the primary design constraint, not the final
adaptation pass.

## Pixel ratio, first and most important

The most common single cause of frame rate collapse on phones.

A phone reporting `devicePixelRatio` of 3 asks the GPU to fill nine times the
pixels of a ratio of 1. The visual gain past 2 is marginal on a small screen. The
cost is not marginal at all.

```js
const cap = tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, cap));
```

Caps above are starting points. When frame rate is short, this is the first lever
to pull, before removing anything the visitor can see.

## Gesture

| Rule | Detail |
|------|--------|
| Swipe is the primary interaction | Design for it first, then add pointer behavior |
| Inertia | A swipe that stops dead reads as broken. Carry momentum and decay it. |
| Drag limit | Clamp travel so a hard swipe cannot throw the scene past its bounds |
| Nothing depends on hover | There is no hover. Any hover-only affordance is invisible here. |
| Minimum touch target | 44 by 44 px is the widely used floor, from Apple's Human Interface Guidelines. Verify against your own design system. |
| Do not fight native scroll | If the gesture is vertical, the page should scroll. Reserve custom handling for the axis the mechanic actually needs. |

Set `touch-action` deliberately. Leaving it default and then calling
`preventDefault` produces inconsistent behavior across browsers.

## The address bar problem

Mobile browsers show and hide the address bar as the user scrolls, changing the
visible viewport height mid-scroll. A layout pinned to `100vh` jumps at that
moment, and a canvas sized to it resizes, which is expensive and visible.

| Unit | Behavior |
|------|----------|
| `100vh` | Largest viewport. Content is cut off when the bar is visible. |
| `100dvh` | Dynamic. Follows the bar, causing reflow as it moves. |
| `100svh` | Smallest viewport. Stable, nothing is ever cut off. |

`100svh` is usually the right default for a fixed stage, because stability
matters more than reclaiming the strip of space.

For the canvas itself, avoid resizing on every height change. Debounce the resize
handler, and ignore height-only changes below a threshold, which are almost
always the address bar rather than a real orientation change.

## Reading direction

If the mechanic depends on horizontal movement, it stays horizontal under
vertical scroll.

A paint roller travelling left to right stays left to right, driven by vertical
scroll progress. Rotating it to vertical to "match the scroll" destroys the
metaphor, and the metaphor was the reason for the mechanic. See
[decision.md](decision.md).

Scroll direction is the input. It is not the direction the content must move.

## Battery and heat

Rarely tested, and the failure is invisible in a two minute check.

| Test | What to look for |
|------|-----------------|
| Ten minute session on the reference device | Does the device get hot to the touch |
| Frame rate at the end of that session | Thermal throttling shows as a gradual decline, not a sudden drop |
| Battery drain across the session | Compare against a static page as the baseline |
| Behavior in the browser's low power mode | Some browsers cap frame rate. The page must remain coherent. |

A scene that runs at 60 fps for one minute and 25 fps after ten has not passed.
Sustained frame rate is the number that matters.

## Audio

- Never automatic. Browsers block it, and visitors resent it.
- Muted by default, with a visible control.
- Honor the device silent switch where the platform exposes it.
- The experience must be complete without sound. Audio is an enhancement, never
  a carrier of information.

## Mobile-specific budget

Separate numbers from desktop, defined in [budget.md](budget.md). Mobile is not
desktop with a smaller texture:

- Lower asset weight, because the network is often worse and metered
- Lower triangle counts, because the GPU is weaker and thermally limited
- Fewer lights and no shadows, both of which are disproportionately expensive
- Post-processing usually off entirely

## Testing

Emulation in devtools tells you about layout. It tells you nothing about frame
rate, heat, or memory pressure, because it runs on your desktop GPU.

Test on real hardware, and specifically on the weakest device named in the
budget. Remote debugging over USB gives real numbers. Anything else is a guess,
and per the golden rules, a guess must be labelled as an estimate.
