# Asset audit, before download

This is where most time is lost in practice. A model that looks right in the
preview can be unusable for reasons the preview does not show, and the discovery
usually happens after the scene is half built.

Audit before downloading. Most marketplaces and libraries expose enough to decide.

## The six checks

### 1. Named hierarchy

The single most expensive thing to get wrong.

If the scene must animate a specific part, that part must arrive as a separate,
named node inside the file. A bolt that slides, a lid that opens, a panel that
detaches: each needs to exist as its own node.

| What you find | Consequence |
|---------------|-------------|
| Separate nodes with meaningful names | Usable directly |
| Separate nodes with names like `mesh_042` | Usable, but map the names first and document the mapping |
| One merged mesh | Cannot be fixed in code. Requires splitting in Blender, which is real rework. |

Inspect the node tree before downloading. Most viewers expose it. If the source
does not show the hierarchy and the scene needs one, treat the model as unusable
rather than gambling.

A merged mesh is fine when the object only ever moves as a whole. Decide which
case you are in during Step 1, not after downloading.

### 2. Triangle count against on-screen size

Assets built for first-person game views carry far more geometry than a website
needs, because the player can walk up to them.

Compare the stated triangle count against how large the object actually renders.
Starting points are in [budget.md](budget.md). If the object renders small and
the model is dense, decimation is mandatory.

**No compression substitutes for decimation.** Meshopt and Draco reduce transfer
size. They do not reduce what the GPU rasterizes every frame. A dense model
compresses to a small file and still costs frame time.

### 3. Texture resolution against on-screen size

A 4K texture on an object rendering at 200 px is invisible waste, in bandwidth
and in GPU memory.

Check the count and resolution of texture maps. Note that texture memory is
usually the larger share of a model's real cost, not the geometry. A model with
five 4K maps is heavier in practice than its triangle count suggests.

Also check which maps actually matter for the look you need. Ambient occlusion
baked into a scene with no visible contact shadow is a map you can delete.

### 4. Scale and pivot origin

| Problem | Symptom | Fix |
|---------|---------|-----|
| Wrong unit scale | Object arrives microscopic or enormous | One scale correction, acceptable |
| Origin outside the object | Rotation orbits a point in empty space | Fix in Blender, do not compensate in code |
| Origin at a corner | Rotation swings instead of spinning | Fix in Blender |
| Axis convention mismatch | Object arrives lying down | One rotation correction, acceptable |

Fixing the origin once in Blender is better than carrying magic numbers in the
code forever. Those numbers become undocumented, and the next person changing the
animation will not know why they exist.

### 5. License

| License | Commercial client work | Requirement |
|---------|----------------------|-------------|
| CC0 | Yes | None |
| CC-BY | Yes | Visible credit |
| CC-BY-SA | Caution | Share-alike obligations may reach your work |
| CC-BY-NC | **No** | Non-commercial only |
| Marketplace standard license | Usually yes | Read the redistribution clause |
| Unstated | **Treat as unusable** | No license is not a permissive license |

Keep a credits file in the project, committed alongside the code:

```
model: hydraulic-press.glb
source: <url>
author: <name>
license: CC-BY 4.0
changes: decimated to 42k triangles, textures resized to 1024, origin recentered
```

This protects the client, and it is the record you will need when someone asks
where the asset came from two years later.

### 6. Embedded animation

Check whether the file ships animation clips, and whether they are usable.

| Finding | Effect on technique |
|---------|--------------------|
| No animation | You animate transforms from scroll progress directly |
| Usable clips | Drive the mixer from scroll progress. See [choreography.md](choreography.md). |
| Clips that do not match the mechanic | Ignore them and strip them, they are weight |
| Skinned mesh with a rig | Heavier per frame. Verify it is worth it. |

Strip unused animation in `gltf-transform`. Shipping clips nobody plays is pure
weight.

## Audit output

Before downloading, write down:

1. Does the hierarchy support the mechanic
2. Triangle count, and the decimation target
3. Texture maps, resolutions, and the resize target
4. Scale and origin corrections needed
5. License and the credits entry
6. Animation present and whether it is used

If any answer is unacceptable, look for another model. Finding a second candidate
costs less than rebuilding around a bad one.
