# Assets: export, compression, format

Defaults, not optional optimizations. A raw model never ships.

## Format

| Format | Role |
|--------|------|
| GLB | Delivery. Single binary file, textures embedded. |
| glTF separate | Development only, for inspecting the JSON and the node tree. |
| FBX, OBJ, STL, DAE | Input only. Convert in Blender. Never deliver these. |
| USDZ | Only when iOS AR Quick Look is an actual requirement. |

## Blender export settings that matter

| Setting | Value | Why |
|---------|-------|-----|
| Format | glTF Binary (.glb) | One file, embedded textures |
| Include | Selected objects only | Stops stray cameras and lights shipping |
| Transform | +Y up | Matches Three.js convention |
| Apply modifiers | On | Otherwise the shipped mesh is not what you saw |
| Compression | Off in Blender | Do it in `gltf-transform`, where you control it |

Before exporting: apply transforms, recenter the origin, delete unused material
slots, and remove hidden geometry. Nothing hidden in Blender is hidden in the
file, it just ships without being seen.

## gltf-transform, mandatory stage

```bash
npm install -g @gltf-transform/cli
```

Inspect first. Never optimize blindly:

```bash
gltf-transform inspect model.glb
```

Read the node tree, triangle count, texture list, and animation clips against the
audit from [asset-audit.md](asset-audit.md).

A reasonable default chain:

```bash
gltf-transform optimize model.glb out.glb \
  --compress meshopt \
  --texture-compress webp \
  --texture-size 1024
```

Individual operations when the chain is too blunt:

```bash
gltf-transform prune model.glb out.glb        # unused nodes, materials, textures
gltf-transform dedup model.glb out.glb        # duplicate accessors and materials
gltf-transform resize model.glb out.glb --width 1024 --height 1024
gltf-transform simplify model.glb out.glb --ratio 0.5 --error 0.001
gltf-transform meshopt model.glb out.glb
```

Verify after every step. Simplification in particular can destroy silhouettes and
UV seams, and the damage is visible only when rendered.

## Geometry compression

| Method | Use when | Trade |
|--------|----------|-------|
| Meshopt | Default | Fast decode, behaves well with animation, good ratio |
| Draco | The file is still too large after meshopt | Better ratio, slower decode, heavier decoder |
| None | Very small models | No decoder shipped at all |

Meshopt is the default because decode speed matters on the devices that need help
most. A smaller file that takes longer to decode on a weak phone is not
automatically a win.

Both require shipping a decoder. Count it in the budget.

## Textures

| Approach | Use when |
|----------|----------|
| Resize plus WebP | Default for simple cases |
| KTX2 with Basis | GPU memory is the bottleneck, or there are many textures |
| No texture at all | The material can be a solid colour or a procedural pattern |

KTX2 stays compressed in GPU memory, which is its real advantage. WebP decodes to
uncompressed RGBA on the GPU, so a small WebP file can still occupy a lot of
texture memory. Choose by which bottleneck you actually have: bandwidth or GPU
memory.

Check whether every map earns its place. A metallic-roughness map that is a
uniform value can be replaced by two material constants.

## Loading

Load on demand per section, with Intersection Observer:

- Do not load the model for a scene the visitor has not scrolled near
- Start loading slightly before the section enters view, not as it enters
- Show a poster image until the scene is ready, never an empty canvas
- Handle the failure path. A fetch can fail, and the page must remain usable.

## Disposal

Three.js does not garbage collect GPU resources. Leaving a scene without
disposing leaks texture and buffer memory, and on a phone that ends as a crash.

Dispose explicitly when a scene ends:

| Resource | Action |
|----------|--------|
| Geometry | `.dispose()` |
| Material | `.dispose()`, and dispose each texture it references |
| Texture | `.dispose()` |
| Render targets | `.dispose()` |
| Renderer, when leaving for good | `.dispose()`, and remove the canvas |

Traverse the scene and dispose rather than trusting a manual list. Manual lists
fall out of date as the scene grows.

## Credits file

Committed with the code, one entry per asset, recording source, author, license,
and the changes made. Required by CC-BY, and good practice regardless. See
[asset-audit.md](asset-audit.md).
