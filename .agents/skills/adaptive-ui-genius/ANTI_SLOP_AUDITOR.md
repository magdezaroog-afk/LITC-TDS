# Anti-Slop Frontend & Kinetic UI Quality Auditor

> **Zero Tolerance Law:** Generic AI-generated templates, low-contrast text, desktop-only thinking, broken touch ergonomics, crowded mobile tab strips, and purple neon glows are classified as **Slop** and strictly prohibited.

---

## 1. The Slop Checklist (Automatic Failure Criteria)

Before declaring any frontend task complete, run the component through this 10-point checklist. If any point fails, the code must be rejected and refactored immediately:

| # | Slop Anti-Pattern | Violation Description | Remediation Rule |
|---|---|---|---|
| **1** | **The "AI Purple" Slop** | Using generic purple gradients (`#8B5CF6`, `#6366F1`) or cyan/magenta halos. | Use project-approved palettes: Deep Oceanic Teal (`#135d79`), Signal Orange (`#f36c21`), or dynamic palettes via Realtime Colors/Radix Colors. |
| **2** | **Desktop-Only Blindness** | Wide `<table>` requiring horizontal scroll on mobile (< 768px). | Auto-transform tables to cards below 768px with stacked key-value pairs. |
| **3** | **Unreachable Actions** | Critical action buttons placed at the top-left/top-right on mobile. | Anchor all primary mobile actions in a `Sticky Bottom Action Bar` inside thumb reach. |
| **4** | **Crowded Tab Stacking** | Wrapping 4+ tabs or filter pills into multiple cramped vertical rows on mobile. | **Anti-Crowding Law:** Auto-convert to a single-line horizontal momentum scrolling strip (`overflow-x-auto no-scrollbar snap-x`) with edge fading masks, or fold into a `+ More` (`+ المزيد`) bottom sheet trigger. |
| **5** | **Clunky Mobile Dropdowns** | Long native select menus or floating dropdown popovers overflowing mobile screens. | Auto-convert complex dropdowns and filters (< 768px) into a swipeable Bottom Sheet (`Vaul` pattern) or an orbital thumb-zone menu. |
| **6** | **Lifeless Elements** | Buttons and cards without hover, active, or focus micro-interactions. | Add spring scale (`scale(0.98)` on active, `scale(1.01)` on hover) and clear focus rings. |
| **7** | **Magical Pixels Chaos** | Using arbitrary numbers like `margin: 17px; padding: 23px; top: 73px`. | Enforce strict 4px/8px spatial rhythm: `4, 8, 12, 16, 20, 24, 32, 48px`. |
| **8** | **RTL Directional Leak** | Using physical `margin-left`, `padding-right`, `left: 0` in multi-lingual apps. | Enforce 100% CSS Logical Properties (`margin-inline`, `padding-inline`, `inset-inline`). |
| **9** | **Abrupt State Transitions** | Modals, dropdowns, and views popping in without ease transitions. | Use Framer Motion springs (`layoutId`, `AnimatePresence`) or CSS `cubic-bezier(0.16, 1, 0.3, 1)`. |
| **10**| **Zero-State Neglect** | Leaving empty lists, failed network requests, or slow loading unhandled. | Always provide Skeleton Loaders during fetch, and curated Empty State illustrations with actions. |

---

## 2. Touch Target & Thumb-Zone Ergonomics (< 768px)

- **Minimum Touch Target:** All interactive touch targets (buttons, icon pills, checkboxes) must measure at least **`44px × 44px`** to prevent tap errors.
- **Safe Area Insets:** All fixed bottom bars and floating docks must account for mobile home indicators:
  ```css
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  ```
- **Viewport Height Fix:** Use dynamic viewport units (`100dvh` instead of `100vh`) to avoid mobile address bar shifting.

---

## 3. Anti-Crowding Mobile Engine Verification (< 768px)

- **Horizontal Filter & Tab Strip:**
  - Must never wrap into multi-line clutter.
  - Must use `scroll-snap-type: x mandatory` and `touch-action: pan-x`.
  - Must feature edge gradient masks so users visually comprehend scrollability.
- **Swipeable Bottom Sheets (Vaul Pattern):**
  - Any form with more than 3 input fields on mobile must open as an iOS-grade bottom drawer.
  - Must include a visible handle pill (`w-10 h-1.5 rounded-full bg-muted`) and support drag-to-dismiss gesture.

---

## 4. Kinetic & 3D Interactive Audit

- **WebGL Frame Budget:** Any 3D canvas (Three.js, Spline `@splinetool/react-spline`, Canvas2D) must maintain **60 FPS** on mid-range devices.
- **Background Throttling:** When a 3D component is scrolled out of view, its rendering loop (`requestAnimationFrame`) must be paused via `IntersectionObserver`.
- **Reduced Motion Support:** Always respect user accessibility preferences:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

## 5. Bilingual Typography & Contrast Verification

- **Contrast Ratios (WCAG AAA / AA):**
  - Normal text: Minimum **4.5:1** contrast ratio against background.
  - Large headers: Minimum **3.0:1** contrast ratio.
  - Interactive border outlines: Minimum **3.0:1** contrast against adjacent surfaces.
- **Arabic Readability Guard:**
  - Arabic font size must be **1.1x to 1.15x** larger than Latin counterparts for equivalent visual optical weight.
  - Minimum `line-height: 1.6` on Arabic body copy; minimum `line-height: 1.4` on headings.
