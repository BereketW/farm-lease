UI Design Specification

Last updated: 2026-05-01

Purpose: describe the UI component architecture, design tokens, route-to-component mapping, and rules for where to add, update, or move UI artifacts in the monorepo.

## 1) High-level goals

- Single source of truth for primitives: packages/ui.
- Domain components belong to the feature that uses them (apps/web/features/\*).
- App-level shell and cross-feature composition live in apps/web/components.
- Keep styles tokenized and theme-friendly (Tailwind + CSS vars + next-themes).

## 2) Key places and examples

- Shared primitives and tokens: [packages/ui/src/components/button.tsx](packages/ui/src/components/button.tsx), [packages/ui/src/styles/globals.css](packages/ui/src/styles/globals.css)
- App shell and providers: [apps/web/components/providers.tsx](apps/web/components/providers.tsx), [apps/web/components/layout/dashboard-shell.tsx](apps/web/components/layout/dashboard-shell.tsx)
- Feature screens and domain UI: [apps/web/features/proposal/screens/proposals-screen.tsx](apps/web/features/proposal/screens/proposals-screen.tsx)
- App API & runtime glue: [apps/web/lib/api/client.ts](apps/web/lib/api/client.ts), [apps/web/lib/socket.ts](apps/web/lib/socket.ts)

## 3) Component taxonomy and ownership

1. Primitives (packages/ui)
    - Purpose: small, generic, themeable building blocks (Button, Input, Badge, Card, Dialog, Select, Table, etc.).
    - Files: packages/ui/src/components/\*.
    - Rules: keep no business logic or domain text; accept generic props and className overrides.

2. App-shared composition (apps/web/components)
    - Purpose: composed UI used across features (Topbar, Sidebar, DashboardShell, Providers, SiteHeader).
    - Files: apps/web/components/_ and apps/web/components/layout/_.
    - Rules: may depend on packages/ui primitives; keep routing and layout concerns here.

3. Feature-local components (apps/web/features/<domain>/components)
    - Purpose: domain-specific pieces (proposal-form stepper, agreement-terms editor, notification-list items).
    - Rules: keep tightly coupled UI/UX and data shaping here; reuse across screens within the same feature.

4. Screens (apps/web/features/<domain>/screens)
    - Purpose: assemble feature components into route views.
    - Files: apps/web/features/<domain>/screens/\*-screen.tsx.

## 4) Design tokens and theming

- Use packages/ui/src/styles/globals.css for token defaults and Tailwind theme overrides. Modify that file for global color, spacing, and typography tokens.
- Prefer CSS variables for runtime theme switches (the repo already uses next-themes).
- Tailwind utility classes are the primary styling mechanism; use className composition and cn helper from packages/ui/src/lib/utils.ts.
- Keep tokens small and composable: colors, radius, spacing scales, font stacks, shadow sizes.

## 5) Accessibility and UX rules

- Ensure components support aria-\* attributes and keyboard interactions.
- Provide visible focus states consistent with design tokens.
- For any modal/dialog use the primitive in packages/ui that supports focus trap and screen reader announcements.

## 6) Naming and file conventions

- Component filenames: kebab-case.tsx or camelCase.tsx is used in the repo; prefer kebab-case for consistency with existing files.
- Hooks: use-<feature>-<behavior>.ts inside the feature hooks folder.
- Data clients: datasource/<domain>.ts per feature.

## 7) Responsive layout guidance

- Build mobile-first with Tailwind breakpoints.
- Layout shell (DashboardShell) must manage collapsed sidebar state; store user preference in localStorage.

## 8) When to add to packages/ui vs apps/web/components

- Add to packages/ui when:
    - The component is a small primitive usable across features and apps.
    - It does not reference domain types or business logic.

- Add to apps/web/components when:
    - The component composes multiple primitives into a site-wide block (header, sidebar, layout).
    - It requires routing or knowledge of app-level context.

- Add to apps/web/features/<domain>/components when:
    - The component carries domain semantics (proposal, agreement, receipt) or depends on feature-specific types.

## 9) Example component mapping (current repo snapshot)

- packages/ui/src/components/button.tsx — primitive button used across the app.
- apps/web/components/layout/dashboard-shell.tsx — main application shell.
- apps/web/features/proposal/components/form/proposal-form.tsx — domain form composed of primitives.
- apps/web/features/notification/components/notification-list.tsx — feature-specific list UI.

## 10) Implementation checklist for a new UI component

1. Decide scope: primitive (packages/ui) or domain (feature)
2. Add file in the proper folder with the naming conventions above.
3. Add a story/example in a local docs/story if available (not mandatory).
4. Add unit/visual tests if the project uses them.
5. Export from packages/ui index only when API shape is stable.

## 11) Visual and interaction patterns

- Use color system with semantic tokens (primary, destructive, success, warning, neutral).
- Use Badge for status counts and Toast for ephemeral system messages.
- Use Popover / Dialog primitives for small overlays; ensure they are keyboard accessible.

## 12) Performance and bundle considerations

- Keep packages/ui focused and small — avoid heavy runtime dependencies.
- Lazy-load heavy feature components (e.g., document viewers) at the route level.

## 13) Design handoff and storybook

- If a design system or Storybook exists, register new primitives there and add usage examples.
- Document props and accessibility requirements in a short README near the component.

## 14) Next steps and recommended housekeeping

1. Centralize design tokens in packages/ui/src/styles/globals.css and remove any duplicate token constants in apps/web.
2. Add a small spec/ui-design.md reference snippet to README.md for contributor onboarding.
3. Consider adding a Storybook or a living style guide for primitives.
