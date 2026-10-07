# Chai Depo — image generation prompt pack

Generate these in ChatGPT (GPT Image) or Gemini (Nano Banana / Imagen), save them with the **exact filenames** below into `website/art/incoming/`, then run:

```bash
npm run art      # keys out the backgrounds, trims, and builds web sizes
npm run build
```

## Two rules that matter

1. **Never ask a model to draw the machine or the premix packs.** It will invent fake wrap artwork and fake label text, and those labels carry real ingredient, allergen and weight copy. The real photos stay; these images are the world around them.
2. **Background colour is a tool, not decoration.**
   - *Solid magenta* `#FF00FF` for anything that needs to be cut out (cup, ingredients). The script keys it out and removes the colour fringe.
   - *Pure black* `#000000` for anything glowing or wispy (steam, pour, dust). These are screen-blended, so black disappears on its own and the wisps keep their soft edges. Do not ask for transparency here.
   - *Full scene* for the backdrops.

## Brand palette (paste into any prompt)

| Use | Hex |
|---|---|
| Charcoal (page) | `#17120E` |
| Cream | `#F3EADB` |
| Chai (milk tea) | `#905238` |
| Copper | `#B87A4B` |
| Cardamom olive | `#989852` |
| Jaggery caramel | `#B8742F` |
| Masala red | `#A63A2E` |
| Karak gold | `#C9933E` |
| Leaf green | `#4E6A3A` |

## Negative list (append to every prompt)

```
No coffee beans, no coffee, no espresso, no moka pot, no coffee grinder, no latte art,
no takeaway coffee cup. No text, no lettering, no logos, no packaging, no labels,
no watermark, no signature. No hands, no people. Not matcha, not black coffee:
this is Indian milk chai, warm tan.
```

## Files

| Priority | File | What | Background |
|---|---|---|---|
| 1 | `steam-01.png` `steam-02.png` `steam-03.png` | Steam wisps | Black |
| 2 | `ing-cardamom-back.png` `-mid.png` `-front.png` | Cardamom ingredients, 3 depths | Magenta |
| 2 | `ing-jaggery-*` `ing-masala-*` `ing-karak-*` | Same, 3 files each | Magenta |
| 3 | `hero-backdrop-desktop.jpg` | Dark room behind the machine, 3:2 | Full scene |
| 3 | `hero-backdrop-mobile.jpg` | Same room, portrait 3:4 | Full scene |
| 3 | `pour-stream.png` | A stream of chai pouring | Black |
| 3 | `dust-motes.png` | Warm floating motes | Black |

Generate at the largest size your tool offers (at least 1536px on the long edge; 2K+ preferred). The script downsizes.

---

# 1. The cups — done

Nothing to generate. Two cups from `../gemini` are used, and `npm run cups`
(`scripts/hero-cup.mjs`) builds everything the site needs from them:

- `Gemini_Generated_Image_90a4q990a4q990a4.jpeg`, the tea-garden cup, as photographed;
- `Gemini_Generated_Image_5zw4it5zw4it5zw4.jpeg`, the branded cup with edge hatching and
  a small drawn cup, its paper recoloured per flavour and its roundel (the dark disc, gold
  ring, "Chai Depot") kept exactly as photographed. It borrows its cut-out shape and its
  lighting from `Gemini_Generated_Image_mriah3mriah3mria.jpeg`, the same cup without the
  drawings, so keep that file.

To use a different photo, change `file` in that cup's entry in `MODELS`. Shoot or
generate it on a plain white background, straight on, lid on. Then re-measure `BODY` and
`lidEdge` for it — the spin is only as good as those measurements. If it has a logo that
should stay untouched, also re-measure `roundel`.

---

# 2. Steam

Three separate files, each a different shape, so they can be layered and offset.

### `steam-01.png` (repeat for `-02`, `-03`)

```
Real steam rising, photographed against a pure black background. A soft translucent
wisp of hot vapour, rising from the bottom centre of the frame and curling gently as it
rises, thinning and dissolving into nothing before the top edge. Wispy and delicate,
like steam off a hot cup of tea in a dark room, lit from the side by warm light so the
vapour reads faintly warm white.

Background: pure black #000000, nothing else in frame, no cup, no object, no surface.
Vertical portrait framing.

Photorealistic, high detail, long exposure look. No smoke machine effect, no thick fog,
no clouds. No text, no logos, no watermark. No hands, no people.
```

For `-02` add: *a wider, lazier curl drifting to the right.*
For `-03` add: *a thin, faint, fast wisp leaning left, fainter than the others.*

---

# 3. Ingredient layers

Three depths per flavour. **Keep the centre of the frame empty** — the cup sits there.

Shared wording (swap the ingredient line and the depth line):

```
<INGREDIENTS>, arranged as a scattered border around the edges of a square frame, with
the centre of the frame completely empty.

<DEPTH>

Lighting: warm directional studio light from the upper left, deep warm shadows, premium
food photography. Fresh and dry, never wet or oily.

Background: flat solid magenta #FF00FF, completely even, no gradient, no shadows cast
on the background. Each item cleanly separated from the background at every edge, no
items touching or overlapping the frame edge.

Photorealistic, ultra sharp, macro detail. No coffee beans, no coffee, no espresso,
no moka pot. No text, no lettering, no logos, no packaging, no watermark. No hands,
no people, no bowls, no plates, no spoons.
```

`<DEPTH>` lines:

- **back**: `About 8 small items, all roughly the same small size, evenly spread, shot slightly soft as if far from the camera.`
- **mid**: `About 5 items at medium size, sharp focus, gently rotated at different angles.`
- **front**: `2 or 3 large hero items, very close to the camera, slightly out of focus with soft bokeh, as if just in front of the lens.`

`<INGREDIENTS>` lines:

| Flavour | Ingredients |
|---|---|
| `ing-cardamom-*` | `Whole green cardamom pods, a few split open showing the dark seeds inside, plus a few dried black tea leaves` |
| `ing-jaggery-*` | `Chunks of dark golden jaggery with a rough crumbly broken texture, a scattering of fine jaggery powder, and a few green cardamom pods` |
| `ing-masala-*` | `Cinnamon quills, whole cloves, green cardamom pods, star anise, black peppercorns and a piece of dried ginger root` |
| `ing-karak-*` | `Loose black tea leaves, dark and tightly curled, a few saffron threads, and two or three green cardamom pods` |

---

# 4. Backdrops (do these last)

These only pay off once the machines are cut out of their white studio backgrounds, which
I'll do in-house from the existing photos — a model would redraw the wrap artwork and get
the branding wrong. Generate them when the rest is done.

### `hero-backdrop-desktop.jpg` — landscape 3:2

```
An empty, dark, warm interior scene, photographed as a backdrop for a product shot.
A deep charcoal-brown room, colour #17120E, with a single pool of warm golden light
falling from above onto a simple wide shelf or plinth that runs across the lower third
of the frame. The light falls off quickly into deep shadow at the edges and corners.
Faint warm haze in the air catching the light. Subtle hints of deep green in the shadows,
like a tea garden at dusk seen through a dark room.

The scene is completely empty: no objects, no products, no furniture, no plants, no cups.
Just the lit surface and the dark space.

Photorealistic, cinematic lighting, shallow depth of field, moody and premium. Leave the
left half of the frame darker and emptier than the right. No text, no logos, no watermark.
No people.
```

### `hero-backdrop-mobile.jpg` — portrait 3:4

Same prompt, plus: `Portrait orientation, the lit shelf in the lower third, more empty dark space above.`

---

# 5. Extras

### `pour-stream.png`

```
A single smooth stream of hot milky chai pouring downward through the frame, photographed
against a pure black background. Warm tan milk tea, colour #B3875C, a clean continuous
stream from the top of the frame downward, with a few small droplets and a slight twist,
lit warmly from the side.

Background: pure black #000000, nothing else in frame, no cup, no jug, no hands, no
surface, no splash pool. Vertical portrait framing.

Photorealistic, high-speed photography, sharp. No coffee, no espresso. No text, no logos,
no watermark. No people.
```

### `dust-motes.png`

```
Fine dust motes and tiny particles floating in a warm beam of light, photographed against
a pure black background. Soft warm golden specks at different sizes and focus depths,
scattered sparsely, some sharp and some blurred into soft bokeh circles. Very subtle
and sparse, not a snowstorm.

Background: pure black #000000, nothing else in frame. Square framing.

Photorealistic, shallow depth of field. No text, no logos, no watermark. No people.
```

---

## If a render comes back wrong

- **Grey or beige chai** → add `the chai is warm tan #B3875C, like Indian milk tea with plenty of milk, not grey, not beige, not coffee coloured`.
- **Magenta showing through the glass** → that is fine and expected; the script keys it out and de-fringes the edges.
- **A shadow on the magenta** → regenerate with `no shadow cast on the background, the object floats`. A shadow keys out as a hole.
- **Items running off the frame edge** → add `keep a generous margin, no item touches the frame edge`.
- **Steam too thick** → add `much fainter, thinner, more transparent, barely there`.
- **Coffee sneaking in** (common, because "chai" often gets trained toward café imagery) → put the negative list first in the prompt instead of last.

---

# 6. Machine cutouts (background removal, not generation)

These are the one thing I could not do well here. My automatic background removal bites
into the machine, because the wrap artwork contains pale misty sky that is as bright and
colourless as the studio backdrop. An image model with proper matting handles it easily.

For each photo in `finalized asset/direct/machines/`, upload it and ask for a background
removal — **an edit of the photo, never a redraw**:

```
Remove the background from this photograph completely. Keep the machine itself exactly
as it is: do not redraw it, do not change its shape, its wrap artwork, its buttons, its
screen or any text on it. Do not clean it up, do not restyle it, do not change the
lighting on the machine.

Replace the background, including the floor and every shadow it casts, with flat solid
magenta #FF00FF, completely even, no gradient and no shadow.

Keep every part of the machine, including the pale sky in the printed artwork, the bright
steel dispensing area and the drip tray, and the cup if there is one. The edges must be
clean and sharp with no white halo left from the old background.
```

Save as, matching each source photo:

| Source photo | Save as |
|---|---|
| `chai-machine-compact-angle.jpg` | `cut-machine-compact-angle.png` |
| `chai-machine-compact-with-cup.jpg` | `cut-machine-compact-cup.png` |
| `chai-machine-compact-front-angle.jpg` | `cut-machine-compact-front.png` |
| `chai-machine-eight-selection-angle.jpg` | `cut-machine-eight.png` |
| `chai-machine-high-capacity-with-cup.jpg` | `cut-machine-high-capacity.png` |

Check each result against the original before saving: the top corners, the steel around
the spout, and the drip tray are where removal tools usually go wrong.

Until these exist, the site blends the original photos onto its colour fields, which
works on light and mid-tone backgrounds but not on dark ones. With the cutouts, the
machines can stand on any colour, including the dark stage.
