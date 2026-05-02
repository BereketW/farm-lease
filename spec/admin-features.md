## Admin role gaps

Based on the current spec and implementation, the admin role is still mostly a permission override rather than a fully built admin area. The following features are incomplete or not started yet:

1. Admin dashboard / console - not started.
    - There is no `/admin` route, no admin landing page, and no admin-specific navigation entry.
    - Admin users currently land on the same general app areas as other roles.

2. User administration - not started.
    - There is no UI or API for listing users, searching accounts, changing roles, suspending/reactivating users, or reviewing profile completeness.
    - The current backend only exposes profile setup and self-profile fetch for users.

3. Cluster moderation workflow - not started.
    - The spec describes admin as a cross-cutting override for moderation, but the app does not expose any admin queue or moderation actions for clusters.
    - Cluster routes are currently read-only list/detail surfaces.

4. Proposal moderation workspace - incomplete.
    - Admin can already see all proposals and bypass some ownership checks in the backend, but there is no dedicated admin proposal review screen.
    - Missing admin-specific actions include queueing, filtering, bulk review, and explicit moderation controls.

5. Agreement moderation workspace - incomplete.
    - Admin can view all agreements and perform some backend-level overrides, but there is no dedicated admin agreement review area.
    - Receipt verification/rejection is supported in the API, but not as a separate admin workflow surface.

6. Admin audit and operations views - not started.
    - Audit entries and notification side effects exist in the backend, but there is no admin page for reviewing audit history, system events, or operational exceptions.
