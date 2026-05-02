# FarmLease Codebase Structure Specification

Last updated: 2026-05-02

Recent changes: the DB schema now includes an `EmailLog` model and an accompanying migration at `packages/db/prisma/migrations/20260501101355_add_email_logs/`. The server mailer at `apps/server/src/modules/notifications/mailer.ts` persists rows to this table after delivery attempts.

## 1) Purpose of this document

This document defines:

1. The architectural boundaries of this monorepo.
2. The correct place for every new file you add while developing.
3. Naming and layering rules so features stay consistent.
4. A default implementation workflow for backend, frontend, shared packages, and database changes.

Use this as the source of truth for file placement decisions.

## 2) Monorepo architecture at a glance

Top-level layout:

- apps/server: Express API + Socket.IO + background jobs
- apps/web: Next.js App Router frontend
- packages/db: Prisma schema and client export
- packages/auth: Better Auth server/client integration
- packages/ui: shared UI primitives and style tokens
- spec: architecture and product specs

Build system and workspace:

- pnpm workspace across apps/_ and packages/_
- turborepo orchestrates dev/build/lint/typecheck tasks
- Node 20+

## 3) Ownership boundaries (what belongs where)

### 3.1 apps/server

Put code here when it is runtime backend behavior:

- HTTP routes and request handlers
- Access-control logic
- Input validation schemas for API payloads
- Domain services that orchestrate DB + notifications + realtime
- Background jobs / schedulers
- File upload handling and storage adapters

Do not put frontend rendering logic here.

### 3.2 apps/web

Put code here when it is app UX behavior:

- Next.js route files under app/
- Feature screens, components, hooks, and data access
- React Query state and optimistic updates
- Browser-side realtime bridge and socket usage

Do not put Prisma queries directly in web. Web talks to server endpoints.

### 3.3 packages/db

Put code here when it is database platform code:

- prisma/schema.prisma
- migrations
- Prisma client singleton export

No API route handlers or UI logic here.

### 3.4 packages/auth

Put code here when it is authentication platform integration:

- Better Auth server config
- Better Auth client wrappers

No feature-specific authorization policies here (those live in server modules).

### 3.5 packages/ui

Put code here for reusable UI primitives and design tokens used by multiple apps:

- component primitives (button, input, dialog, etc.)
- shared UI utilities
- global style tokens

If a component is domain-specific (proposal card, agreement timeline), keep it in apps/web features, not packages/ui.

## 4) Backend structure rules (apps/server)

Current observed backend pattern is module-oriented:

- src/index.ts: app bootstrap, middleware, router mounting
- src/lib: cross-cutting helpers (auth, session, storage, audit, dev seeding)
- src/realtime: Socket.IO setup + emit helpers
- src/jobs: scheduled background logic
- src/modules/<domain>: domain API + domain logic

### 4.1 Domain module file map

Inside src/modules/<domain>, use these files when needed:

1. routes.ts
2. handlers.ts
3. schemas.ts
4. access.ts
5. service.ts
6. templates.ts or mailer.ts (only for notification/email domains)

Responsibilities:

1. routes.ts: endpoint paths, middleware chain, role guards.
2. handlers.ts: request parsing, orchestration, response mapping.
3. schemas.ts: zod request/query/body schemas.
4. access.ts: reusable authorization and context loading helpers.
5. service.ts: domain operations shared across handlers/jobs/modules.

Rule: keep handlers thin enough to read, move reusable logic into service/access helpers.

### 4.2 Where to add backend files by task

If you add a new endpoint to an existing domain:

1. Add route declaration in src/modules/<domain>/routes.ts.
2. Add or update input schema in src/modules/<domain>/schemas.ts.
3. Add handler function in src/modules/<domain>/handlers.ts (or routes.ts if domain currently keeps all logic inline, but prefer migrating to handlers.ts for medium/large growth).
4. Add policy check helper in src/modules/<domain>/access.ts when reused.

If you add cross-domain domain behavior:

1. Add function to src/modules/<domain>/service.ts.
2. Call from handlers or jobs.

If you add a new scheduled process:

1. Create src/jobs/<job-name>.ts.
2. Start it from src/index.ts.
3. Keep it idempotent and safe on restart.

If you add new upload type:

1. Extend src/lib/storage.ts with multer config and URL mapping.
2. Add dedicated router under src/modules/uploads/routes.ts or relevant domain router if tightly domain-specific.

If you add a new backend domain:

1. Create src/modules/<new-domain>/.
2. Start with routes.ts + schemas.ts + handlers.ts.
3. Add access.ts/service.ts only if complexity needs it.
4. Mount router in src/index.ts under /api/<new-domain>.

## 5) Frontend structure rules (apps/web)

Current observed frontend pattern is route-shell + feature module:

- app/\* route files are thin wrappers that render feature screens.
- features/<domain> contains the domain UI and data hooks.
- lib/api is shared API client and response types.
- components/layout holds app shell and navigation.
- components/ has app-level reusable but non-domain components.

### 5.1 Route layer

Under app/<route>/page.tsx:

1. Keep route files lightweight.
2. Import and return a feature screen from features/<domain>/screens.
3. Keep route-specific metadata/params handling only.

### 5.2 Feature layer

Use this structure under features/<domain>:

1. screens: top-level page compositions
2. components: domain UI building blocks
3. datasource: API calls for this domain only
4. hooks: domain behavior hooks
5. entity: form schemas, adapters, domain front-end helpers

Placement rule:

1. API fetch function for proposals goes in features/proposal/datasource/proposals.ts.
2. UI pieces reused only in proposal feature stay under features/proposal/components.
3. React Query wrappers and realtime reconciliation stay in hooks.

### 5.3 Shared frontend layer

Put code in apps/web/lib when shared across multiple features and truly app-wide:

- lib/api/client.ts: generic fetch and multipart helpers
- lib/api/types.ts: shared API response types
- lib/socket.ts: socket singleton and lifecycle helpers
- lib/use-current-user.ts, lib/use-in-view.ts: shared hooks not tied to one domain

Do not place feature-specific hooks into apps/web/lib.

### 5.4 App-wide components

Put components in apps/web/components when:

- used across multiple features/routes
- they are not basic primitives suitable for packages/ui

Examples:

- providers.tsx
- site-header.tsx
- components/layout/\*

## 6) Shared package rules

### 6.1 packages/ui

Add files here only for generic primitives:

1. packages/ui/src/components/<primitive>.tsx
2. packages/ui/src/lib/<ui-util>.ts
3. packages/ui/src/styles/globals.css for global design tokens

If a component needs proposal/agreement business terms in props or labels, keep it in apps/web/features/\*/components instead.

### 6.2 packages/auth

Add files here only for auth platform surface:

1. src/index.ts for server auth config
2. src/client.ts for web auth client exports/plugins

If you need role-based business authorization, put it in server module access helpers.

### 6.3 packages/db

Add files here for schema and migration ownership:

1. Update prisma/schema.prisma
2. Generate migration in prisma/migrations/\*
3. Keep src/index.ts as DB client boundary

No feature route code in packages/db.

## 7) File placement decision table

When adding a new file, choose destination by intent:

1. New API endpoint and validation: apps/server/src/modules/<domain>/routes.ts + schemas.ts + handlers.ts.
2. New authorization helper for domain: apps/server/src/modules/<domain>/access.ts.
3. New background worker: apps/server/src/jobs/<name>.ts.
4. New app-wide backend helper: apps/server/src/lib/<name>.ts.
5. New realtime room/event infra: apps/server/src/realtime/io.ts (or split by concern if large).
6. New page route: apps/web/app/<route>/page.tsx.
7. New domain page composition: apps/web/features/<domain>/screens/<screen>.tsx.
8. New domain API client call: apps/web/features/<domain>/datasource/<domain>.ts.
9. New domain hook: apps/web/features/<domain>/hooks/<hook>.ts.
10. New domain-only UI component: apps/web/features/<domain>/components/<component>.tsx.
11. New app-shared component: apps/web/components/<component>.tsx.
12. New shared primitive for multiple apps: packages/ui/src/components/<primitive>.tsx.
13. New DB model/enum/relation: packages/db/prisma/schema.prisma.
14. New auth provider/plugin config: packages/auth/src/index.ts or src/client.ts.

## 8) Naming and consistency conventions

### 8.1 Backend

1. routes.ts for path wiring.
2. handlers.ts for request handlers.
3. access.ts for policy predicates and context loaders.
4. schemas.ts for zod contracts.
5. service.ts for domain side effects and orchestration.

### 8.2 Frontend

1. <domain>-screen.tsx for top-level screens.
2. use-<domain>-<behavior>.ts for hooks.
3. datasource/<domain>.ts for transport functions.
4. components grouped by subcontext (dashboard, detail, form) for larger features.

### 8.3 Imports

1. In apps/web use @/\* alias for local imports.
2. Import shared packages through workspace package names (@farm-lease/db, @farm-lease/auth, @farm-lease/ui).

## 9) Expected development workflow for new features

For backend + frontend feature additions:

1. Extend DB schema if needed in packages/db/prisma/schema.prisma.
2. Add migration and regenerate Prisma client.
3. Add backend module schemas/access/handlers/routes.
4. Wire router in apps/server/src/index.ts.
5. Add frontend datasource methods for new endpoints.
6. Add frontend hooks and screens/components.
7. Add route page wrappers under app/.
8. Add realtime event handling if feature needs live updates.
9. Add notifications events if user-facing status changes occur.
10. Run typecheck/lint/build for affected packages.

## 10) Current structural gaps discovered during analysis

These should be fixed before expanding related work:

1. apps/server/src/index.ts imports ./modules/uploads/routes, but src/modules/uploads directory does not exist.
2. Spec docs under spec/ (PRD, schema, api-contrat, ui-design) are currently empty, so teams rely on code behavior as de facto spec.
3. apps/server/tsconfig.json uses moduleResolution: node (deprecated path warning in diagnostics).

Recommendation:

1. Create src/modules/uploads/routes.ts immediately or remove the import until implemented.
2. Keep this structure spec updated as the first non-empty spec baseline.
3. Plan tsconfig modernization for server to avoid future TS7 breakage.

## 11) Guardrails for future contributors

1. Keep app route files thin; move feature logic to features/\*/screens and hooks.
2. Do not duplicate API request helpers across feature folders when generic logic already exists in lib/api/client.ts.
3. Keep notification side effects in notifications service, not scattered in random handlers.
4. Keep access control checks in access.ts helpers so policies stay testable and reusable.
5. Keep upload/storage constraints centralized in lib/storage.ts.
6. Keep shared UI generic and domain-agnostic.

## 12) Suggested next spec files to fill

To complete architecture documentation:

1. spec/api-contrat.md: endpoint contracts (request/response/error) per module.
2. spec/schema.md: ERD-level rules, state machine transitions, invariants.
3. spec/ui-design.md: route map, feature ownership, component taxonomy.
4. spec/PRD.md: product goals and acceptance criteria.
