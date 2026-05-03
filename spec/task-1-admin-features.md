# Admin Panel

- a admin panel sidebar entry for the admin page
  The page follows a **dashboard-style, two-column layout** with a clear hierarchy and card-based structure. Ignoring the sidebar, the layout can be described as follows:

---

### 1. Top Header Bar

- **Left:** Page title _“Admin Control Center”_ with a short descriptive subtitle.
- **Center:** A wide **search bar** for querying investments, farms, or reports.
- **Right:** Action buttons:
    - “Export Report”
    - “Invite User”

- Also includes a small **user profile section** (avatar + role).

---

### 2. Metrics Overview (Top Row)

- A horizontal row of **4 summary cards**, evenly spaced:
    - Total Users
    - Active Clusters
    - Total Volume
    - System Health

- Each card contains:
    - Icon (top-left)
    - Label
    - Primary metric (large text)
    - Small status badge (e.g., percentage change or “Stable”)

---

### 3. Main Content Area (Two-Column Grid)

#### Left (Primary Column – ~70%)

This is the dominant section.

**A. System Management Panel**

- Title + subtitle explaining purpose.
- Top-right: **search input** for filtering entities.

**B. Tab Navigation**

- Horizontal tabs:
    - Users (active)
    - Clusters
    - Payments

**C. Data List (Users Table-like Cards)**

- Vertical list of user entries.
- Each row/card includes:
    - Avatar/initial
    - Name + email
    - Role badge (Investor, Farmer, etc.)
    - Action menu (3-dot icon)

- Styled as **soft cards rather than a strict table**.

---

#### Right (Secondary Column – ~30%)

Stacked vertically with smaller cards.

**A. Pending Verification Card**

- Header with notification badge (count).
- Description text.
- Example item (organization name + location).
- “View Full Queue” link.

**B. Security Status Card**

- Overview message: “All systems secure”
- Status indicators:
    - Firewall
    - Encryption (AES-256)
    - Audit Logging

- Each shown with **status badges (Active/Enabled)**.
- Bottom: “Security Audit” button.

---

### 4. Floating Action Button (Bottom Right)

- Circular button with a chat/message icon.
- Likely for support or quick actions.

---

### Overall Layout Characteristics

- **Grid-based structure**: top summary → two-column content.
- **Card-driven UI**: everything is modular and separated visually.
- **Clear hierarchy**:
    1. Global actions (top)
    2. Key metrics
    3. Core management (left)
    4. Alerts/status (right)

- **Consistent spacing and alignment**, with emphasis on readability and quick scanning.
