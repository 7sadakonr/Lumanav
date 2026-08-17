<div align="center">

# Lumanav

**A glassmorphism React navbar with spatial, real-time reflection from the content beneath it.**

[![npm version](https://img.shields.io/npm/v/@7sadakonr/lumanav?style=flat-square)](https://www.npmjs.com/package/@7sadakonr/lumanav)
[![license](https://img.shields.io/badge/license-MIT-black?style=flat-square)](./LICENSE)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)

</div>

Lumanav is a lightweight React component that creates a floating glass navbar and reflects the **real layout, colors, gradients, cards, images, and video** that pass beneath its lower edge.

Instead of sampling a single background color, Lumanav mirrors the nearby DOM content into a masked reflection layer so the reflected color stays in the correct spatial position.

## Features

- Real-time spatial reflection inside the navbar
- Reflects gradients, cards, images, and other DOM content
- Live video reflection with `captureStream()` when available and a synchronized fallback when it is not
- Automatically detects nearby `<section>` / `<article>` elements
- Explicit reflection targets with `data-reflection-source`
- Smooth source transitions using two reflection layers
- Scroll work scheduled with `requestAnimationFrame`
- Uses `IntersectionObserver`, `MutationObserver`, and `ResizeObserver` to avoid unnecessary updates
- Mirrored content is hidden from assistive technology and made non-interactive
- Responsive glass styling with `prefers-reduced-motion` support
- TypeScript types included
- React 18 and React 19 support

## Installation

```bash
npm install @7sadakonr/lumanav
```

## Quick Start

Import the component and the bundled stylesheet:

```tsx
import { Lumanav } from '@7sadakonr/lumanav'
import '@7sadakonr/lumanav/style.css'

export default function App() {
  return (
    <>
      <Lumanav
        items={[
          { id: 'home', label: 'Home', href: '#home' },
          { id: 'projects', label: 'Projects', href: '#projects' },
          { id: 'contact', label: 'Contact', href: '#contact' },
        ]}
      />

      <main>
        <section id="home">
          <h1>Home</h1>
        </section>

        <section id="projects">
          <h2>Projects</h2>
        </section>

        <section id="contact">
          <h2>Contact</h2>
        </section>
      </main>
    </>
  )
}
```

When an item has an `href`, Lumanav renders it as an `<a>` element. Without `href`, the item is rendered as a `<button>` and still updates the active visual state.

## Reflection Sources

Lumanav looks below the navbar and searches for the nearest matching source:

```text
[data-reflection-source]
section
article
```

For predictable results, keep reflection content inside `<main>`.

### Automatic source

Normal semantic sections work without extra configuration:

```tsx
<main>
  <section>
    <h1>Hero</h1>
  </section>

  <article>
    <h2>Article</h2>
  </article>
</main>
```

### Explicit source

Use `data-reflection-source` when you want to mark a specific container as the reflection target:

```tsx
<main>
  <div data-reflection-source>
    <div className="hero-gradient" />
    <h1>Reflected content</h1>
  </div>
</main>
```

## How It Works

Lumanav does **not** use JavaScript color detection to fake the reflection.

1. The navbar probes the page just below its lower edge.
2. It resolves the nearest `data-reflection-source`, `<section>`, or `<article>`.
3. The source is cloned into internal, non-interactive mirror layers.
4. The clone is positioned so its geometry matches the original element on the page.
5. CSS masks, blur, saturation, and opacity reveal only a narrow reflection/glow band inside the glass.
6. When the source changes, two reflection layers cross-fade to avoid a hard visual switch.
7. Scroll, resize, visibility, and DOM changes schedule reflection updates only when needed.

This keeps red content on the left, blue content on the right, moving video in motion, and gradients aligned with their real positions below the navbar.

## Video Reflection

Video elements are mirrored automatically.

When supported, Lumanav uses the video's `captureStream()` API for the reflected copy. In browsers or contexts where capture streams are unavailable, it falls back to a muted clone synchronized with the source video's playback state, time, and playback rate.

No additional video-specific prop is required.

## Props

### `LumanavProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `LumanavItem[]` | required | Navigation items rendered inside the navbar. |
| `defaultActiveItem` | `string` | first item id | Initially active item id. |
| `className` | `string` | `''` | Additional class name applied to the `<nav>` element. |

### `LumanavItem`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | yes | Unique item identifier and active-state key. |
| `label` | `string` | yes | Text displayed in the navbar. |
| `href` | `string` | no | Renders the item as an anchor when provided. |

> The default stylesheet is currently designed around a three-item navigation layout.

## Styling

The package ships with its own CSS:

```tsx
import '@7sadakonr/lumanav/style.css'
```

You can pass a custom class and override the navbar styles from your application:

```tsx
<Lumanav className="my-navbar" items={items} />
```

```css
.my-navbar {
  --glass-radius: 28px;
  --reflection-line-size: 2px;
  --reflection-line-blur: 12px;

  top: 32px;
  width: min(620px, calc(100vw - 32px));
}
```

The built-in CSS also provides a solid-background fallback when `backdrop-filter` is unavailable.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/7sadakonr/Lumanav.git
cd Lumanav
npm install
```

Run the demo playground:

```bash
npm run dev
```

Other useful commands:

```bash
npm run lint
npm run build
npm run build:lib
npm run preview
```

- `npm run build` builds the demo application.
- `npm run build:lib` builds the npm library package.

## Package Build

The library build is configured separately from the demo:

```bash
npm run build:lib
```

The generated `dist/` package contains:

- ES module build
- CommonJS build
- TypeScript declarations
- Bundled Lumanav stylesheet

The public package exports are:

```tsx
import { Lumanav } from '@7sadakonr/lumanav'
import type { LumanavItem, LumanavProps } from '@7sadakonr/lumanav'
import '@7sadakonr/lumanav/style.css'
```

## Project Structure

```text
Lumanav/
├─ src/
│  ├─ components/
│  │  └─ Lumanav/
│  │     ├─ Lumanav.tsx
│  │     └─ Lumanav.css
│  ├─ pages/
│  │  ├─ GlassDemo.tsx
│  │  └─ GlassDemo.css
│  ├─ index.ts
│  ├─ App.tsx
│  └─ main.tsx
├─ vite.config.ts
├─ vite.lib.config.ts
├─ tsconfig.lib.json
└─ package.json
```

## Publishing

The package uses `prepublishOnly`, so `npm publish` automatically runs the library build first.

```bash
npm login
npm publish --access public
```

For a scoped public npm package, keep `--access public` when publishing a new release.

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- DOM Observer APIs

## License

MIT © 2026 Jetsadakorn Muangwichit
