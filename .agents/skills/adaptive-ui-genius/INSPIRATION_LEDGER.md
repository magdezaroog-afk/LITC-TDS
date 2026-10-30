# Living Visual Scouting, Multi-School Libraries, Mobile UX, 3D Assets & AI Skill Radar

---

## 1. AI Frontend Skills, Rules & Live Documentation Radar (Scout Periodically & Self-Upgrade)

Scan these platforms to discover new AI agent skills, frontend architecture rules, and up-to-date library patterns:

- **Cursor.directory & Awesome-CursorRules** (`https://cursor.directory`, `https://github.com/PatrickJS/awesome-cursorrules`): Global repository of elite AI coding prompts and frontend rules.
- **SkillsMP & Antigravity Skills** (`https://skillsmp.com`, `@rmyndharis/antigravity-skills`, `ag-skills`): Dedicated agent skill registries for expanding UI/UX and coding capabilities.
- **Awesome Claude Skills & AI Engineering Hubs** (`https://github.com/anthropics/courses`, GitHub Trending `frontend-design` / `ui-skills`): Cutting-edge agent workflows.
- **Context7 & Live Docs** (`https://context7.com`): Real-time, version-accurate documentation for latest Tailwind, React, Next.js, and motion libraries.

---

## 2. Visual Feeding, Spatial Layouts & Mobile UX Inspiration Hubs (Scout Before Designing)

Align your vision with the project's soul before coding by checking these references:

- **Developer News & Trend Feeds** (`https://daily.dev`, `https://dev.to/t/frontend`, `https://www.smashingmagazine.com`): Daily breakthroughs in CSS, WebGL, and UI engineering.
- **Mobbin** (`https://mobbin.com`): The #1 global reference for real-world Mobile (iOS/Android) & Web UI patterns, bottom sheets, tab overflow solutions, and thumb-zone navigation.
- **Godly.website** (`https://godly.website`): Boundary-pushing interactive layouts, unconventional navigation, kinetic typography, and spatial motion.
- **Codrops / Tympanus** (`https://tympanus.net/codrops/`): Experimental menus (radial, circular, morphing, magnetic, curtain transitions), WebGL, and shaders.
- **Awwwards UI & Motion** (`https://www.awwwards.com/websites/ui-design/`): World-class art direction, color harmony, and micro-interactions.

---

## 3. Color Systems, Palettes & Typography Engines (Ban Default AI Purple)

### A) The "Anti-AI-Slop" Color Constitution
- **Strict Ban on AI Purple/Cyan Glows:** Prohibit generic purple-to-blue gradients (`#8B5CF6` to `#3B82F6`) and oversaturated cyan/magenta halos that look like automated AI demos.
- **Institutional Enterprise Authority (NEXUS TDS Official Spectrum):**
  - **Primary Corporate Anchor:** Deep Oceanic Teal (`#135d79`, HSL 196° 73% 27%) — conveys precision, stability, and governmental/enterprise dignity.
  - **Vibrant Operational Accent:** Energetic Signal Orange (`#f36c21`, HSL 22° 90% 54%) — used for call-to-actions, urgent operational states, and focused interaction rings.
  - **Surface Foundations:**
    - *Dark Mode (Deep Space OLED):* Root `#070d14`, Card Surface `#0f172a`, Elevated Float `#1e293b` with `1px solid rgba(255, 255, 255, 0.08)`.
    - *Light Mode (Kitchn/Apple Pearl):* Root `#F8FAFC`, Surface `#FFFFFF`, Sub-surface `#F1F5F9` with multi-layered soft ambient shadows `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)`.

### B) Bilingual RTL/LTR Typography & Spatial Engineering
- **Bilingual Typographic Harmony:**
  - Standard Latin font: `Inter`, `Geist`, or Apple SF Pro.
  - Arabic Enterprise font: `IBM Plex Sans Arabic`, `Cairo`, or system Apple Arabic.
  - Arabic font scaling: **+10% to +15% size** compared to English equivalent, with generous line-height (`1.6` to `1.8`) to avoid diacritic clipping.
- **Zero Directional Properties Law (100% Logical CSS):**
  - Replace `margin-left` / `margin-right` with `margin-inline-start` / `margin-inline-end` (or `ms-`, `me-`).
  - Replace `padding-left` / `padding-right` with `padding-inline-start` / `padding-inline-end` (or `ps-`, `pe-`).
  - Replace `left: 0` / `right: 0` with `inset-inline-start: 0` / `inset-inline-end: 0`.
  - All icons with directional meaning (arrows, chevrons, undo/redo) must automatically mirror in RTL (`rtl:rotate-180`).

---

## 4. Multi-School Component Libraries & Live Sourcing Strategy

Never build from zero when world-class primitives exist. Dynamically synthesize patterns from the top four modern frontend schools:

1. **shadcn/ui & Radix UI (The Headless Core):**
   - Accessible primitives: Dialog, Popover, DropdownMenu, Tooltip, Tabs, Accordion.
   - Zero-runtime overhead, fully typed props, accessible keyboard navigation (`Tab`, `Escape`, `Arrow` keys).
2. **Kitchn UI & Geist Design (Purity & Minimalist Inputs):**
   - Form inputs with crisp, zero-visual-noise ergonomics.
   - Clean focus rings: `box-shadow: 0 0 0 3px rgba(243, 108, 33, 0.2)`.
   - Subtle badge pills with high contrast and balanced letter spacing.
3. **Aceternity UI & Magic UI (Kinetic Ambiance & Glass Surfaces):**
   - Refined Glassmorphism: `backdrop-filter: blur(16px)` + `rgba(15, 23, 42, 0.85)` + `1px solid rgba(255,255,255,0.08)`.
   - Border Beam animations and subtle radial spotlights on card hover.
   - Ambient gradient meshes placed discreetly in empty spatial backdrops (never interfering with data readability).
4. **Tremor & Lucide Icons (Executive Data & Iconography):**
   - Clean financial and operational metric cards, sparklines, badge deltas (`+12%`, `-3%`).
   - Unified Lucide icon stroke width (`1.75px` or `2px`), consistent sizing (`16px`, `18px`, `20px`).

---

## 5. Kinetic Motion & 3D Interactive Patterns

### A) Micro-Interactions & Spring Physics
- Use Framer Motion spring physics over rigid linear curves:
  - Default snappy spring: `{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }`.
  - Gentle spatial entry: `{ type: "spring", stiffness: 200, damping: 20 }`.
- Universal button feel:
  - Hover: `transform: translateY(-1px) scale(1.01)`.
  - Active/Click: `transform: translateY(1px) scale(0.98)`.
  - Loading: Rotating spinner with `animation: spin 0.8s linear infinite`.

### B) 3D & Spatial Depth (WebGL, Three.js, Spline)
- Embed interactive 3D assets sparingly for high-impact zones (Hero headers, SOC security shields, circuit routing maps).
- Use lazy loading (`React.lazy`, dynamic `import()`) and IntersectionObservers to pause WebGL rendering when outside viewport to ensure 60fps performance and zero battery drain.

---

## 6. Mobile-First Responsive Ergonomics (Thumb-Zone & Adaptive Formats)

### A) The Thumb-Zone Doctrine (< 768px Viewports)
- **Sticky Bottom Action Bar:** Primary actions (Save, Submit, Approve, Assign) must anchor to `position: fixed; bottom: 0; inset-inline: 0;` within natural thumb reach.
- **Drawer/Sheet over Centered Modals:** On mobile screens, popup dialogs must open as a bottom drawer (`Bottom Sheet`) sliding up from screen bottom, dismissible by downward swipe.

### B) Table-to-Card Auto-Transformation
- **Ban on Horizontal Table Overflow:** Never force users to scroll horizontally to read critical ticket or employee information.
- In viewports below `768px`, data tables automatically morph into compact, rich transaction cards with clear key-value metadata and direct action pills.

### C) Segmented Steppers vs Crowded Tab Strips
- When horizontal tabs exceed 3 items on mobile, automatically render them as an ergonomic segmented stepper, horizontal swipeable pill bar with momentum scrolling, or an interactive dropdown selector.
