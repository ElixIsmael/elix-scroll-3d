# elix-scroll-3d

For agents that read `AGENTS.md` (Cursor, Codex, Copilot, Gemini CLI and others).
Claude Code users do not need this file: run `./install.sh` and the skill loads
on its own.

## How to use

When the work involves a scroll-driven 3D scene, WebGL, Three.js, GLTF models,
scrollytelling, or a 3D page that is slow on mobile, follow
`skills/elix-scroll-3d/SKILL.md`.

Do not start with technique. The skill's first two steps are decisions:

1. **Does 3D earn its place?** If the only benefit is that it looks impressive,
   recommend an optimized video or image and explain the trade.
2. **What is the mechanic proving?** A scroll mechanic that only decorates is
   dead weight. It must demonstrate the client's service, and its climax must
   coincide with the call to action.

## The rules that save the most rework

| Rule | Why |
|------|-----|
| Prefer procedural when the result is equivalent | Removes weight, licensing, and rework in one decision |
| Audit a model before downloading it | Named hierarchy, density, scale, pivot, and license. A merged mesh cannot be fixed in code. |
| Set the performance budget before writing code | And cut visual scope when it breaks, rather than accepting the overrun |
| The 3D canvas is never the LCP | Poster image first, scene takes over afterwards |
| All text lives in HTML above the canvas | Never rendered into a texture. Indexing, sharpness, screen readers. |
| Sample camera curves by arc length | `getPointAt`, not `getPoint`, or the camera accelerates on its own through curves |
| Cap the pixel ratio on mobile | The most common single cause of frame rate collapse |
| `prefers-reduced-motion` gets a static equivalent | Not a slower animation |
| Objects that carry text are DOM elements in CSS 3D | The interface pipeline: sharp at any pixel ratio, nothing to download, and the element can be the real component |
| No post-processing by default | The composer drops multisampling, so edges turn pixelated, and bloom makes everything glow |
| A pinned section counts progress from its entry | The first pinned screen already shows the scene forming, never an empty stage |

Detail lives in `skills/elix-scroll-3d/references/`, starting code in
`skills/elix-scroll-3d/templates/`, and capture tools in
`skills/elix-scroll-3d/tools/`. Before delivery, run
`references/checklist.md` item by item, reporting each failure with the line and
snippet that causes it.

Never invent a benchmark. If it was not measured, label it an estimate.
