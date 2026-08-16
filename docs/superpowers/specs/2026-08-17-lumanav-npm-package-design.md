# LumaNav npm package design

## Goal

Prepare the existing glass-reflection navigation demo for publication as the MIT-licensed `lumanav` React npm package. Consumers must be able to install a typed component, its stylesheet, and use it with React 18 or 19.

## Current behavior

The project is a Vite demo application. `GlassNavbar` has three hard-coded button items, owns its selected state, and scans the page for generic `section` and `article` elements to create its reflection. The project has no library entry point, npm export map, generated declarations, package documentation, license, or package validation workflow.

## Public API

The package exposes `LumaNav`, `LumaNavItem`, and `LumaNavProps` from `lumanav`.

`LumaNavItem` has a required unique `id` and `label`, plus optional `href`, `onClick`, `target`, `rel`, and `disabled`. An item with `href` renders an anchor; one without renders a button. The component does not integrate directly with a router.

`LumaNav` accepts a required `items` list and optional `activeId`, `defaultActiveId`, `onActiveChange`, `ariaLabel`, `className`, and `position`. `activeId` makes selection controlled; otherwise selection starts from `defaultActiveId` and is managed internally. `onActiveChange` reports every eligible selection.

`position` defaults to `fixed` and also accepts `sticky` and `static`. Layout and colors remain overridable through documented CSS custom properties.

Reflection is enabled by default and is explicit: a consumer marks intended backdrop elements with `data-lumanav-reflection-source`. The component no longer treats generic `section` or `article` nodes as reflection sources. This avoids hidden DOM cloning and observation of unrelated page regions.

## Build and publishing

The Vite application build remains available for the local demo. A separate Vite library configuration uses `src/lib/index.ts` as its entry and emits ESM (`.js`) and CommonJS (`.cjs`) JavaScript plus a stylesheet. A library TypeScript configuration emits declarations.

`package.json` uses the lowercase name `lumanav`, version `0.1.0`, `type: module`, an export map for the JavaScript entry and `./style.css`, and a `files` allowlist containing only distributable artifacts and required package metadata. React and React DOM are peer dependencies supporting React 18 and 19, with matching development dependencies used by the demo. CSS is listed under `sideEffects` so bundlers retain the import.

The package has scripts for demo development, library build, type checking, linting, tests, and package-content inspection through `npm pack --dry-run`.

## Code organization

- `src/lib/LumaNav.tsx`: component, types, selection behavior, client-side reflection lifecycle.
- `src/lib/LumaNav.css`: scoped component styles and CSS variables.
- `src/lib/index.ts`: public exports and stylesheet import.
- `src/components/GlassNavbar/*`: removed or replaced so the demo consumes the public library source, preventing drift.
- `src/pages/GlassDemo.tsx`: a consumer-style demonstration with configured items and an explicit reflection source.
- `vite.lib.config.ts` and `tsconfig.lib.json`: library-specific output configuration.
- `README.md`, `LICENSE`, and `package.json`: consumer documentation and npm metadata.

## Safety, compatibility, and edge cases

Browser-only reflection behavior is isolated to effects, so importing the component during server rendering does not access browser globals. The reflection lifecycle cleans up observers, animation frames, timeouts, cloned nodes, and captured video tracks. Missing browser features retain the visual navigation and simply omit or degrade the reflection effect.

Items with both `href` and `onClick` remain links; their callback still runs unless the consumer prevents default. Disabled items neither activate nor invoke callbacks. The component has an accessible navigation label, semantic anchors/buttons, pressed state for button navigation, and visible keyboard focus.

## Verification

Vitest and React Testing Library provide automated component tests for anchor/button rendering, controlled and uncontrolled selection, disabled-item behavior, and active-change callbacks. The final verification runs type checking, lint, tests, the library build, and `npm pack --dry-run`; the package manifest is inspected to ensure demo-only source and unrelated files are excluded.

## Non-goals

This change does not publish to npm, create or configure an npm account, provide router-specific adapters, or add a theme system beyond CSS custom properties.
