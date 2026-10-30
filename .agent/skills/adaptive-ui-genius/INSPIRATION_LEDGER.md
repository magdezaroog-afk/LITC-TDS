# Living Visual Scouting, Multi-School Libraries, Mobile UX, 3D Assets & AI Skill Radar

---

## 1. AI Frontend Skills, Rules & Live Documentation Radar (Scout Periodically & Self-Upgrade)

Scan these platforms dynamically to discover new AI agent skills, frontend architecture rules, and up-to-date library patterns:

- **Cursor.directory & Awesome-CursorRules** (`https://cursor.directory`, `https://github.com/PatrickJS/awesome-cursorrules`): Global repository of elite AI coding prompts, rules, and framework configurations.
- **SkillsMP & Antigravity Skills** (`https://skillsmp.com`, `@rmyndharis/antigravity-skills`, `ag-skills`): Dedicated agent skill registries for expanding UI/UX, mobile ergonomics, and coding capabilities.
- **Awesome Claude Skills & AI Engineering Hubs** (`https://github.com/anthropics/courses`, GitHub Trending `frontend-design` / `ui-skills`): Cutting-edge agent workflows and interactive engineering.
- **Context7 & Live Docs** (`https://context7.com`): Real-time, version-accurate documentation for latest Tailwind CSS, React 19, Next.js, and motion libraries.
- **Daily.dev & Frontend Feeds** (`https://daily.dev`, `https://dev.to/t/frontend`, `https://www.smashingmagazine.com`): Daily breakthroughs in CSS Houdini, WebGL, shaders, and browser rendering engines.

---

## 2. Visual Feeding, Spatial Layouts & Mobile UX Inspiration Hubs (Scout Before Designing)

Align your visual intuition with world-class product craftsmanship before coding:

- **Mobbin** (`https://mobbin.com`): The #1 global benchmark for real-world Mobile (iOS/Android) & Web UI patterns, bottom sheets, tab overflow solutions, and thumb-zone navigation.
- **Godly.website** (`https://godly.website`): Boundary-pushing interactive layouts, unconventional spatial navigation, kinetic typography, and fluid physics.
- **Codrops / Tympanus** (`https://tympanus.net/codrops/`): Experimental navigation (radial, circular, orbital, magnetic, curtain transitions), WebGL, Canvas, and GLSL shaders.
- **Awwwards UI & Motion** (`https://www.awwwards.com/websites/ui-design/`): World-class art direction, visual harmony, and micro-interactions.

---

## 3. Color Systems, Palettes & Typography Engines (Ban Default AI Purple)

### A) The "Anti-AI-Slop" Color Constitution
- **Strict Ban on AI Purple/Cyan Halos:** Prohibit default purple-to-blue gradients (`#8B5CF6` to `#3B82F6`) and oversaturated cyan/magenta glows that make interfaces look like generic AI demos.
- **The Default Institutional Anchor vs. Absolute Creative Freedom:**
  - *Default Project Anchor:* Deep Oceanic Teal (`#135d79`) & Energetic Signal Orange (`#f36c21`) serve as the default corporate identity for the current project only.
  - *Universal Dynamic Freedom:* When the Project Director requests an alternative theme, brand, or design school, **never force the default colors**. Adapt dynamically using curated color generation engines:
    - **Realtime Colors** (`https://realtimecolors.com`): Instant multi-role palette simulation (Light & Dark mode contrast validation).
    - **Huemint** (`https://huemint.com`): Deep learning color generator evaluating visual harmony and cognitive separation.
    - **Radix Colors** (`https://www.radix-ui.com/colors`): Mathematically scaled 12-step accessible palettes with automatic dark mode parity.
    - **Dark Mode Design** (`https://www.darkmodedesign.com`): Curated gallery of elite OLED deep black and slate dark mode aesthetics.

### B) Bilingual RTL/LTR Typography & Spatial Engineering
- **Bilingual Typographic Harmony:**
  - Latin Standard: `Inter`, `Geist`, or Apple SF Pro.
  - Arabic Standard: `IBM Plex Sans Arabic`, `Cairo`, or system Apple Arabic.
  - Arabic font scaling: **+10% to +15% size** compared to English equivalent, with generous line-height (`1.6` to `1.8`) to avoid diacritic clipping.
- **Zero Directional Properties Law (100% Logical CSS):**
  - Replace `margin-left` / `margin-right` with `margin-inline-start` / `margin-inline-end`.
  - Replace `padding-left` / `padding-right` with `padding-inline-start` / `padding-inline-end`.
  - Replace `left: 0` / `right: 0` with `inset-inline-start: 0` / `inset-inline-end: 0`.
  - Mirror directional icons (arrows, chevrons, steps) automatically in RTL via `rtl:rotate-180`.

---

## 4. Multi-School Component Libraries & Live Code Sourcing

Never reinvent basic components or suffer from lifeless static boxes. Dynamically source, synthesize, and install from the elite component ecosystem:

- **21st.dev** (`https://21st.dev`): The premier open component distribution platform for cutting-edge Tailwind, Radix, and React components.
- **Uiverse.io** (`https://uiverse.io`): Massive open-source catalog of custom CSS and Tailwind buttons, toggle switches, cybernetic inputs, gradient badges, and holographic cards.
- **Magic UI** (`https://magicui.design`): High-end kinetic components (Bento Grids, Border Beam, Animated Gradients, Shimmer Buttons, Number Tickers).
- **Motion Primitives** (`https://motion-primitives.com`): Micro-interaction primitives for Framer Motion (Morphing dialogs, cursor following, spring transitions).
- **Cult UI** (`https://cult-ui.com`): Avant-garde interactive components designed for expressive modern software.
- **shadcn/ui & Radix UI** (`https://ui.shadcn.com`): Accessible, unstyled, headless building blocks for enterprise-grade data density and forms.
- **Kitchn UI & Geist Design**: Minimalist input hygiene, zero visual noise, and refined input ergonomics.
- **Aceternity UI** (`https://ui.aceternity.com`): Ambient backdrops, subtle glassmorphism (`backdrop-filter: blur(16px)`), and spotlight effects.
- **Vaul** (`https://vaul.emilkowal.ski`): The gold standard for iOS/Android native-feeling mobile bottom sheets, drawers, and swipe-to-dismiss gestures (`npm i vaul`).
- **Spline & 3D Interactive Assets** (`https://spline.design`, `@splinetool/react-spline`): Real-time WebGL interactive 3D objects, security shields, and kinetic scene embedding.

---

## 5. Kinetic Navigation: Radial Menus, Morphing Islands & Spring Physics

### A) Radial & Orbital Menus (Trigonometric Navigation)
- When linear dropdowns feel overcrowded or boring, deploy circular/orbital menus using polar-to-Cartesian trigonometry:
  ```typescript
  // angle in radians: index * (totalAngle / (count - 1))
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  ```
- Animate menu petals via Framer Motion with staggered spring delays:
  ```tsx
  <motion.button
    animate={{ x, y, scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 400, damping: 28, delay: index * 0.04 }}
  />
  ```

### B) Morphing Containers & Dynamic Island Toolbars
- Use `layoutId` in Framer Motion to morph floating pills into expanded control panels, search drawers, or multi-action clusters seamlessly without abrupt DOM jumps.
- Wrap all stateful view transitions in `<AnimatePresence mode="wait">` with exit animations.

---

## 6. Mobile-First Anti-Crowding Engine (< 768px Viewports)

- **Anti-Crowding Horizontal Strip Engine:**
  - When category pills or tab filters exceed 3 items on mobile, **never let them wrap into 2 or 3 crowded vertical lines**.
  - Convert them into a single-line horizontal momentum scrolling strip:
    `overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory flex flex-nowrap gap-2 py-1`
  - Apply edge fading masks using CSS:
    `mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)`
- **The Mobile Drawer Transformation (Vaul Bottom Sheet):**
  - All large dropdown menus, filter panels, and complex multi-select forms on mobile (< 768px) must automatically morph into an interactive bottom sheet anchored to the bottom thumb zone, dismissible by a downward swipe.
