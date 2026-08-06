# Visx + React Three Fiber Implementation Plan

## Goals

- Replace Recharts 2D rendering with Visx.
- Replace the pseudo-3D SVG renderer with React Three Fiber and Drei.
- Preserve the current URL-driven axes, 2D/3D transition, themes, tooltips, and accessibility.
- Keep Three.js out of the initial 2D bundle.
- Avoid React rerenders during camera movement and animation frames.

## 1. Define acceptance criteria

- Preserve `x`, `y`, `z`, and source query parameters.
- Preserve deep links, empty states, presets, active-point details, and reduced motion.
- Keep 3D dependencies lazy-loaded until a Z axis is selected.
- Target smooth interaction on supported mobile and desktop devices.
- Stop the WebGL render loop while the scene is idle.

## 2. Add dependencies

Install with Bun:

- `@visx/axis`
- `@visx/grid`
- `@visx/group`
- `@visx/responsive`
- `@visx/scale`
- `@visx/shape`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@types/three` as a development dependency

Keep Recharts installed until 2D visual and interaction parity is confirmed.

## 3. Extract shared plot data

Create `src/ui/lib/comparison-plot-data.ts` as a renderer-neutral data layer.

- Build valid points, excluded points, series, domains, IDs, and lookup maps in one `O(n)` pass.
- Share domains, ordering, normalization, and plot bounds between the 2D and 3D renderers.
- Use stable IDs and maps for `O(1)` active-point lookup.
- Handle empty and equal-value domains without renderer-specific logic.

## 4. Implement the Visx 2D chart

Update `src/ui/components/comparison-chart.tsx`.

- Use responsive SVG dimensions.
- Memoize scales, prepared points, and series paths.
- Render axes, grid lines, line paths, points, and labels with Visx and SVG.
- Preserve the existing tooltip, connected model series, empty state, and keyboard navigation.
- Calculate screen coordinates directly and remove DOM observers where possible.
- Keep label collision work outside pointer interaction updates.

The current pairwise label collision approach is `O(n²)`. It is acceptable for small datasets; use a spatial grid or quadtree if labels grow into the hundreds.

## 5. Implement the React Three Fiber chart

Update `src/ui/components/comparison-chart-3d.tsx`.

- Preserve its literal lazy import from the Compare route.
- Use `Canvas` with `frameloop="demand"` and a capped device-pixel ratio.
- Use unlit materials without shadows or post-processing initially.
- Reuse point geometry and materials.
- Keep camera, orbit, drag, and animation values in refs instead of React state.
- Invalidate the canvas only during interaction, animation, resizing, or theme changes.
- Update React state only when the active point actually changes.
- Avoid an `<Html>` element for every point.

Individual point meshes are sufficient for the current dataset. Switch to an instanced mesh with `instanceId` lookup when point counts reach the hundreds.

## 6. Preserve the 2D/3D transition

- Start the 3D scene with a flat camera and collapsed Z scale aligned with the Visx plot.
- Animate depth and camera values through `useFrame` and refs.
- Reverse the animation before returning to 2D.
- Call `onExitComplete` once the reverse transition settles.
- Skip directly to the final state when reduced motion is enabled.
- Use a short opacity handoff only if exact SVG-to-WebGL alignment is not visually stable.

## 7. Connect themes and accessibility

- Resolve existing CSS theme variables on canvas mount and theme changes only.
- Pass resolved colors to Three.js materials without duplicating the theme palette.
- Keep keyboard point navigation in semantic DOM controls because WebGL objects are not accessible DOM elements.
- Preserve the active-point details panel and screen-reader descriptions.
- Provide a useful fallback if WebGL initialization fails.

## 8. Test and validate

Add focused tests for:

- Missing metrics, excluded counts, stable ordering, equal domains, and normalization.
- Empty states and accessible chart names.
- Keyboard navigation and focus wrapping.
- Reduced-motion behavior and transition completion.
- Active-point details and WebGL fallback behavior.

Manually verify mouse and touch controls, presets, resizing, mobile layouts, theme switching, deep links, and adding or removing the Z axis.

When implementation is authorized, run targeted tests, `bun run lint`, and `bun run fmt:check`. Do not run or build the application without separate authorization.

## Delivery order

1. Shared plot-data layer and unit tests.
2. Visx 2D parity.
3. Static React Three Fiber scene and accessible controls.
4. Camera controls, transition, reduced motion, and theme bridge.
5. Performance profiling and responsive verification.
6. Remove Recharts after confirming no remaining imports.
