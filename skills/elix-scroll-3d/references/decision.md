# Decision: should this be 3D, and what should it prove

Two questions, in this order. The second one is the harder and the more valuable.

## 1. Does 3D earn its place

The test is not "would 3D look good here". It is "what does 3D add that a
photograph or a video would not".

### When the honest answer is "nothing"

Recommend an optimized video or image, and explain the trade. This is not a
failure of ambition, it is the correct technical call:

| Cost avoided | Detail |
|--------------|--------|
| Build time | A looping video of the same motion is typically a fraction of the work |
| Weight | A compressed video of a rotating object is usually far lighter than the model, its textures, and the renderer |
| Compatibility | Video needs no WebGL fallback, no tier detection, no disposal logic |
| Maintenance | Nobody has to understand a render loop to change it later |

A pre-rendered video also has a quality ceiling far above real time, because it
was rendered offline. For a fixed camera path with no interaction, video often
looks better than the real-time version of the same scene.

### When 3D is justified

At least one of these must be true:

| Condition | What it looks like in practice |
|-----------|-------------------------------|
| The object must be examined from several angles | The visitor would pick it up and turn it over in a shop |
| The transformation across scroll is the content | Parts separating, a surface changing, a state morphing |
| The navigable space is the product | A venue, an interior, a built environment being sold |

### Cases that fail the test

- A sealed box rotating on a product page. The buyer learns nothing from the back of a box.
- A 3D logo in the hero. A static logo communicates identically at a fraction of the cost.
- Floating abstract geometry behind text. This is a background, and a background can be an image.
- A scene the visitor never actually looks at because the copy is what sells.

If the client insists after hearing the trade, build it, but build it inside the
budget from [budget.md](budget.md) rather than pretending the cost went away.

## 2. What is the mechanic proving

A scroll mechanic that only decorates is dead weight, however well built. A
mechanic that demonstrates the service is a sales argument that happens to be
animated. Same effort, different return.

Ask: **what does this animation prove about the client's business?**

### Worked examples

**Painter and decorator.** The weak version reveals institutional text as you
scroll. The strong version is a paint roller travelling across the viewport,
revealing the finished wall over the damaged one. The mechanic is the service.
The visitor watches the transformation being sold, and the reveal is procedural,
so it costs almost nothing.

**Sport shooting instructor.** The weak version rotates a logo or a rifle. The
strong version follows a projectile path, and each fundamental of the technique
is introduced as the path passes it: stance, grip, sight alignment, trigger
control, follow through. The path arrives at the target, and the target is the
call to action. The visitor has been taught something by the time they are asked
to book.

**Physical product with internal engineering.** The weak version rotates the
closed product. The strong version separates it into components as the visitor
scrolls, showing what the competitor's cheaper version does not contain. The
mechanic argues the price.

### The two rules

**The climax coincides with the CTA.**

Attention builds through the animation and peaks at its resolution. If the
animation resolves and the call to action arrives two sections later, that peak
was spent on nothing. Place the CTA at the point of maximum attention: the moment
the roller finishes the wall, the moment the projectile reaches the target, the
moment the assembly closes.

**The mechanic must not contradict what the client sells.**

Domain plausibility beats attractive framing. The specialist audience is the
audience that converts, and they read errors instantly.

The concrete case: in any scene involving a firearm, the camera never sits in
front of the muzzle. A muzzle-on shot is visually dramatic and is a basic range
safety violation. To the exact audience a shooting instructor is trying to
reach, it says the site was made by someone who has never been on a range, and
it costs more credibility than the shot buys.

The general principle applies everywhere:

| Domain | Framing that destroys credibility |
|--------|----------------------------------|
| Firearms | Camera in front of the muzzle, finger on the trigger outside the shot |
| Surgery and dentistry | Instruments handled without gloves, non-sterile field |
| Food service | Bare hands on plated food, raw and cooked sharing a surface |
| Construction | Work at height without harness, missing hard hats |
| Laboratory | No eye protection, open flame near solvents |

Before building a scene in a domain you do not know, ask the client what would
look wrong to a professional. They will tell you in one sentence, and it will
save a rebuild.

## Output of this step

Write down, before any technical decision:

1. What 3D adds here that an image or video would not
2. What the mechanic demonstrates about the business
3. Where the climax lands, and that the CTA is at that point
4. What a domain specialist must never see in this scene
