# Design · SeedBox

## Genre

Modern-minimal data workspace for Minecraft speedrunning. Calm, precise, and anchored by the existing SeedBox blue.

## Macrostructure family

- Home: Exploration Hub — editorial entry point with compact live data.
- App pages: Workbench — strong header and one primary working surface.
- Content pages: Long Document — reading column with metadata and actions held apart.

## Theme

The canonical values live in `tokens.css`. Blue is for primary actions and selected state; terrain hues classify Overworld, Nether, and End metadata.

## Typography

- Display: Zen Kaku Gothic New, 700, normal
- Body: Inter + Zen Kaku Gothic New, 400–600
- Mono: JetBrains Mono, 400–600, only for seed values and timing

## Spacing and shape

Use `tokens.css` named 4-point spacing. Cards use `--radius-card`; controls use `--radius-input`; compact status chips use `--radius-pill`.

## Motion

- Easing: `--ease-out`, `--ease-in`, `--ease-in-out`
- Cards and navigation may lift or tint on hover; transforms and opacity only.
- Focus rings appear immediately; reduced motion is a short opacity-only change.

## CTA voice

- Primary: blue filled, rounded rectangle, concise action verb.
- Secondary: paper surface with a fine border.

## What every page shares

The SeedBox wordmark, blue accent placement, typography pairing, focus treatment, card radius, and interaction timing.

## Exports

### tokens.css

The source of truth is [`tokens.css`](./tokens.css).

### Tailwind v4 `@theme`

```css
@theme { --color-paper: oklch(98% 0.008 250); --color-ink: oklch(24% 0.03 258); --color-accent: oklch(50% 0.19 265); --font-display: "Zen Kaku Gothic New", sans-serif; --font-body: "Inter", sans-serif; --spacing-md: 1.5rem; --ease-out: cubic-bezier(.16, 1, .3, 1); }
```

### DTCG `tokens.json`

```json
{"color":{"paper":{"$value":"oklch(98% 0.008 250)","$type":"color"},"ink":{"$value":"oklch(24% 0.03 258)","$type":"color"},"accent":{"$value":"oklch(50% 0.19 265)","$type":"color"}},"font":{"display":{"$value":"Zen Kaku Gothic New","$type":"fontFamily"},"body":{"$value":"Inter","$type":"fontFamily"}}}
```

### shadcn/ui variables

```css
:root { --background: 98% 0.008 250; --foreground: 24% 0.03 258; --primary: 50% 0.19 265; --primary-foreground: 99% 0.004 250; --border: 84% 0.022 250; --ring: 56% 0.18 255; --radius: 1.25rem; }
```
