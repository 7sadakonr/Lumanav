# @7sadakonr/lumanav

Lumanav is a React Component Library that provides a glassmorphism navbar with a dynamic, real-time reflection effect based on the content behind it. It reads the background color and content structure beneath it to render a visually accurate, spatial reflection.

## Installation

```bash
npm install @7sadakonr/lumanav
```

## Quick Start

Import the `Lumanav` component and its CSS file into your React application.

```tsx
import { Lumanav } from '@7sadakonr/lumanav'
import '@7sadakonr/lumanav/style.css'

function App() {
  return (
    <div>
      <Lumanav
        items={[
          { id: 'home', label: 'Home', href: '#home' },
          { id: 'projects', label: 'Projects', href: '#projects' },
          { id: 'contact', label: 'Contact', href: '#contact' },
        ]}
      />
      <main>
        {/* Your content here */}
      </main>
    </div>
  )
}
```

## Reflection Source

The `Lumanav` component captures reflections dynamically using a `MutationObserver` and `IntersectionObserver`. To define which elements should be reflected in the navbar, add the `data-reflection-source` attribute to a container element. Alternatively, semantic elements like `<section>` or `<article>` will also be targeted automatically.

Example:

```tsx
<main>
  {/* The navbar will read the text/colors in this section to create the reflection */}
  <section data-reflection-source>
    <h1>Hero</h1>
  </section>
</main>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `LumanavItem[]` | Required | Array of navigation items to display. |
| `defaultActiveItem` | `string` | `items[0].id` | The id of the initially active item. |
| `className` | `string` | `""` | Additional CSS classes for the `<nav>` wrapper. |

### `LumanavItem`

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier for the item. |
| `label` | `string` | Display text for the item. |
| `href` | `string` (optional) | If provided, an `<a>` tag will be rendered instead of `<button>`. |

## Development

This repository contains both the library code and a demo playground.

- Library code: `src/components/Lumanav/` and `src/index.ts`
- Demo application: `src/pages/` and `src/App.tsx`

Run the development server for the demo playground:

```bash
npm install
npm run dev
```

## Build

To build the library package for publishing:

```bash
npm run build
```

The output will be generated in the `dist/` directory, containing ES Module (`.js`), CommonJS (`.cjs`), TypeScript declarations (`.d.ts`), and the bundled CSS (`style.css`).

## Publishing

Ensure you are logged in to npm, then publish:

```bash
npm publish
```
