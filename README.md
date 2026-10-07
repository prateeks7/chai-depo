# Chai Depo website

Chai-only marketing site: chai vending machines, the five premixes, and a demo/pricing request. React + TypeScript + Vite, GSAP ScrollTrigger for the pinned flavour scene.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/
```

## Images

Source photos stay untouched in `../finalized asset`. Web versions are generated into `public/img` (AVIF + WebP, several widths) with a manifest at `src/content/imageManifest.json`:

```bash
npm run images            # all images
npm run images machine-compact machine-multi   # just some keys
npm run labels            # the five premix labels, straight from the print PDFs
npm run hero              # machines with decorative contours (hero, Book a demo)
npm run cups              # both cups: stills, flavour colours and spin textures
npm run art               # anything dropped into art/incoming (see art/PROMPTS.md)
```

The generated files in `public/img` are committed; the 44MP originals they come from are not (they live outside the repo, in `../finalized asset`, `../asset` and `../gemini`). So a clean checkout builds and deploys without them — only re-running the scripts above needs them.

Treatments (in `scripts/build-images.mjs`):

- **studio** (white-background machine photos): cropped to the machine with a wide margin, extended with white where the photo runs out, and the edges faded to white. On cream sections and inside the hero/demo arch the photo is drawn with `mix-blend-mode: multiply`, so the backdrop disappears and only the machine and its natural shadow remain.
- **cutout** (the current machine photos, `finalized asset/machines`): background removed by `scripts/cutout.mjs`, so machines can move and overlap on any colour. `machines/2.jpg` is left out on purpose: its keypad reads TEA / COFFEE.
- **dark** (premix packs on black cloth): cropped, blue cloth reflections and deep shadows neutralised, blacks crushed. On the dark stage the pack is drawn with `mix-blend-mode: lighten`, so the backdrop disappears. **The flavour scenes no longer use these** — see Labels below.

### Labels

`scripts/labels.mjs` renders the print artwork itself, so the site shows the real labels rather than photographs of pouches. Pages come from `asset/CHAI_DEPOT_PREMIX_MARCH_REVISED.pdf` (cardamom, masala, karak, cardamom no-added-sugar) and `finalized asset/CHAI_DEPOT_PREMIX_JAGGERY_4x6.pdf` (jaggery), rendered at 300 dpi and auto-cropped by finding the rows and columns that are more than half ink — which strips the crop marks and the white margin without hand-measuring each page.

Page 1 of the revised PDF is a **coffee** label and is deliberately not built: this site is chai only.

On desktop each flavour's label is a card standing on the shelf at the right of the flavour scene (`.packSlot` in `PourStage.module.css`), inside the same margins as the copy and clear of the floor band, wiping up over the previous one as you scroll. The whole label is always shown: the card is as tall as the stage allows (`--label-h`) at the label's own proportions. It carries the stage's light — a sheen, a hairline edge, and a shadow on its own layer (`[data-pack-shadow]`), since the clip-path wipe would clip a shadow of its own. The copy column narrows and the cup centres in the space between (`--copy-w`, `--cup-x`), and the chapter rail sits in the floor band under the copy.

The premix supply chapter centres everything: the copy at the top, and the five labels fanned out like a hand of cards behind the cup (`PackFan`, `.fan` in `copy.module.css`). Every card pivots about one point below it, so each keeps its brand and flavour name in view; the timeline animates `--open` to fan them out. Phones and reduced motion get the same fan. Callouts live in a separate layer that repeats the label's box, so badge coordinates in `flavours.ts` land on the print. On phones and tablets the labels stay as cards beside the cup.

### The cups

Two generated cups, both built by `scripts/hero-cup.mjs` (`npm run cups`):

- **Tea-garden cup** (`gemini/Gemini_Generated_Image_90a4q990a4q990a4.jpeg`), as photographed: the hero, the promises, premix supply, and the phone layout outside the flavour cards. Key `cup-garden`.
- **Branded cup** (`gemini/Gemini_Generated_Image_5zw4it5zw4it5zw4.jpeg`: the Chai Depot roundel, edge hatching and a small drawn cup), its paper recoloured to each flavour (`palette.cup`), the hatching and drawing to a darker shade of it: the flavour chapters. Its roundel — the dark disc, the gold ring, "Chai Depot" — is excluded from the recolouring (`roundel` in `MODELS`, feathered over a few pixels at the ring) and stays exactly as photographed on every flavour. Keys `cup-branded`, `cup-branded-<flavour>`.

  It is the plain branded cup (`…mriah3mriah3mria.jpeg`) with art drawn over it, so it borrows two things from that photo: the cut-out shape (`maskFile`), because this one's white backdrop is JPEG noise at the same levels as the lid's highlights; and the light (`shade`), because on this one the edge hatching would read as shadow. The back of the cup is filled from the left edge's hatching only (`mirrorFrom: 'left'`), since mirroring the right edge would draw the small cup twice, facing itself.

On the desktop flavour scene both spin (`components/SpinCup.tsx`), stacked in the one cup that travels through the scene and sharing one turn, so the timeline swaps them halfway through a half-turn, while the print faces sideways: tea-garden into the first flavour, branded back out at premix supply. For each cup the print is unwrapped off the photo into a flat strip (`cup-<model>-wrap.webp`), plus a mask (`cup-<model>-mask.png`) marking where it may recolour, and a WebGL shader wraps both back round at any angle, with the lid (`cup-<model>-lid`) drawn over the top as a still layer. The body is modelled as a cone seen from slightly above (each height an ellipse, deeper toward the base; measured per cup in `MODELS`). The light is divided out when unwrapping and put back by the shader, so the print turns while the light stays put. The photo shows only part of the way round, so the strip covers half a turn and repeats (the print appears front and back, roundel included); the unseen band is mirrored landscape.

The recolouring keeps each pixel's brightness relative to the paper, and never goes above the paper tone (lifting showed as pale blotches near the edges). It exists twice, in `hero-cup.mjs` and in the shader, and must match; at rest the spinning cup and the still one are the same picture.

`SpinCup` must never lose its WebGL context on cleanup: React runs effects twice in development, the canvas survives, and the second run would get the dead context back — the page then shows the uncoloured still cup, in `npm run dev` only.

Cut-out edges get a thin dark rim (`BORDER_PX`/`BORDER_RGB`), overriding the photo's own anti-aliased pixels rather than trying to key them out cleanly. On the near-black stage it disappears; it exists because the anti-aliasing against the white backdrop leaves a pale sliver a plain alpha threshold never fully removes.

Cut-out details that are easy to get wrong: the backdrop test is strict (253+), because lid highlights reach 248–252 where they meet the backdrop and a looser test floods into the lid; only the largest connected shape is kept, which drops specks of backdrop noise; the outer two pixels are pale from the backdrop, so the edge is pulled in and repainted from just inside; and sharp's `erode()` shrinks *dark* regions, so the script measures distance from the backdrop itself instead.

### The hero machine

`scripts/hero-machine.mjs` builds `machine-hero` (the compact, `finalized asset/machines/3.jpg`) and `machine-multi-outline` (the multi-selection, for Book a demo): it removes the studio background (`scripts/cutout.mjs`) and draws four decorative brown contours around the silhouette: a tight solid line, then dashed, dotted and fine-dashed echoes further out. Offsets are cut from a real distance field rather than a thresholded blur, so every line stays an even distance from the machine all the way round. It is all drawn at 1800px, the largest output width, because the hero renders the machine at roughly a quarter of that and anything finer collapses into one fuzzy band.

Cutting the new photos out needed two additions to `cutout.mjs`. The compact nearly touches the right edge of its frame, so the strip of backdrop there was too thin to survive the clean-up and a pocket of white stayed in the corner; a second flood runs along the frame margin to catch it. And where the wrap's pale sky meets the machine's edge, the edge came out ragged; a small closing on the final mask smooths it (plus a `KEEP` region for the compact's sky).

### The machines

The machines section is a turntable (`sections/Lineup`): one machine centre stage in a pool of its accent colour, the other two stepped back either side, and its selection count as a huge outlined numeral behind. Tabs, arrow keys, the side arrows, a click on a machine at the back, or a swipe bring the next one round. A loupe magnifies the chosen machine's real selection panel, on a leader line on desktop and right over the panel on phones; `panel` in `machines.ts` says where each panel is. Each machine is a CSS size container, so the loupe and leader are placed in units of the machine's own width and follow it as it moves.

Blend rule: a blended element must be the element that animates, and nothing between it and its section background may create a stacking context (transform, opacity < 1, z-index, filter). Otherwise the backdrop shows as a rectangle.

`CUP_ON_TRAY` (on `machine-hero`), the How it works zoom regions (on `machine-compact-studio`) and the loupe `panel`s (on each cutout) are all fractions of the processed images. Re-measure them if a photo or the crop settings change.

### Jaggery pack (stand-in)

`CHAI_DEPOT_PREMIX_JAGGERY_4x6.pdf` is a flat label. The only jaggery pack photo shows the older Cardamom label with a small JAGGERY sticker, so `scripts/compose-jaggery-pack.mjs` maps the new label onto that pouch (four-point perspective warp and the photo's lighting). **Replace it with a real photograph of the new pack before launch.**

## Deploy

GitHub Pages, from `.github/workflows/deploy.yml`: every push to `main` type-checks, builds, and publishes `dist/`. First time only, in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

The build uses relative asset paths (`base: './'` in `vite.config.ts`), so it works at `username.github.io/<repo>/` as well as at a domain root. It is one page with in-page anchors, so there is no client-side routing for Pages to get wrong.

**The demo form needs an endpoint.** There is no server on Pages, so without `VITE_LEAD_ENDPOINT` the form falls back to opening the visitor's email app addressed to `sales@chaidepot.ca` (see Leads). Point it at any service that takes a JSON POST and set it as a repository variable — Settings → Secrets and variables → Actions → Variables — which the workflow passes to the build. `.env.example` has the local equivalent.

## Structure

```
src/
  content/      all copy and claims. Unconfirmed items carry verified: false and a todo
  lib/          motion mode, in-view, scroll targets, demo-intent context
  components/   Picture, Button, ArchMachine, ChaiCup, SpinCup, Steam, Ingredients, header/footer
  sections/
    PourSequence/   hero + promises + flavours
      PourStage       desktop: one pinned, scroll-scrubbed scene (usePourTimeline.ts)
      PourStack       phones/tablets/short screens and reduced motion: same content, stacked
    Lineup, HowItWorks, WherePours, DemoRequest
```

Motion modes (`useMotionMode`): **full** = at least 1024 × 680 with motion allowed (pinned scene); **compact** = smaller screens (stacked, light reveals); **reduced** = `prefers-reduced-motion` (stacked, no motion). Snapping moves one chapter per gesture (`inertia: false`).

The motion layer, all of it off under reduced motion:

- **Weighted scroll** (Lenis, `lib/scroll.ts`). Programmatic scrolling must go through `scrollToY`, or it fights the smoothing.
- **Scroll velocity** is published as `--vskew` (display type leans) and `--scroll-progress` (the header's progress line). `scrollVelocity()` also drives the ticker's speed and direction.
- **Masked headings** (`MaskedText`), **reveals** (`Reveal`), **magnetic buttons** (`Magnetic`).
- **Pinned scene**: the flavour scene. The cup turns half a turn per chapter, becoming the line-art cup in each flavour's colour and the tea-garden cup again for premix supply.
- **Intro curtain** (`Intro`), once per session via `sessionStorage`.

## Placeholders to swap

| Now | Replace with |
|---|---|
| `IngredientField` line art | Optional photographic ingredient layers (back / mid / front per flavour) |
| `pack-jaggery` composite | Real photo of the new Jaggery pack |
| Pack photos on the dark stage | Transparent pack cut-outs (then drop the `lighten` blend) |
| Square raster logo | SVG logo, ideally a horizontal lockup |

## Leads

Set `VITE_LEAD_ENDPOINT` to a URL that accepts a JSON POST. Without it, the form opens the visitor's email app addressed to `sales@chaidepot.ca` with the request filled in.

## Open content questions (see `verified: false` in `src/content`)

1. Brand: logo and deck say "Chai Depo"; machines, packs and domain say "Chai Depot / chaidepot.ca".
2. The revised PDF has **two Karak labels**: a plain one and a no-added-sugar one. The site shows only the plain one, and the no-added-sugar claim that used to sit on Karak has been removed. Confirm whether both should be listed.
3. Jaggery label lists no jaggery in its ingredients and shows Sugar 0.00 g.
4. Source deck swaps the Cardamom with/without sugar descriptions.
5. Machine model names, selections, canister counts, dimensions and water supply. The new compact photo shows **four** selections (the old one showed three), so the site now says 4 — confirm which compact is sold. `machines/2.jpg` shows a compact with TEA / COFFEE buttons and is not used.
6. Contact details (taken from the packs and machine wraps) and service area.
