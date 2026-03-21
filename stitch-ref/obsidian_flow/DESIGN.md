# Design System Specification: Liquid Operational Intelligence

## 1. Overview & Creative North Star
**Creative North Star: The Lucid Sentinel**
This design system rejects the cluttered, "dashboard-heavy" tropes of traditional dispatch software. Instead, it adopts a high-end editorial approach where information is curated, not just displayed. We move beyond the "template" look by utilizing intentional asymmetry, deep layering, and a "Liquid Glass" aesthetic. 

The atmosphere is **Calm, Competent, and Operationally Clear.** By using semi-translucent surfaces and high-contrast typography, we create an environment that feels premium and urgent without inducing panic. We prioritize breathing room over borders, and tonal depth over drop shadows.

---

## 2. Colors & Surface Architecture
The palette is rooted in a deep navy and slate foundation, ensuring high-stress environments remain visually soothing.

### Semantic & Core Palette
- **Background:** `#0b1326` (The void; the base of all layouts)
- **Primary:** `primary: #adc6ff` | `on_primary: #002e6a` (The signature action color)
- **Urgent (Red):** `#EF4444` (Used for critical hazards)
- **Warning (Amber):** `#F59E0B` (Used for pending alerts)
- **Info (Blue):** `#3B82F6` (Used for dispatch logistics)
- **Success (Green):** `#10B981` (Used for cleared zones)

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. A `surface-container-low` section sitting on a `surface` background provides all the separation a professional eye needs.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
- **Level 1 (Base):** `surface` (`#0b1326`)
- **Level 2 (Sectioning):** `surface_container_low` (`#131b2e`)
- **Level 3 (Interactive Cards):** `surface_container` (`#171f33`)
- **Level 4 (High-Priority Overlays):** `surface_container_highest` (`#2d3449`)

### The "Glass & Gradient" Rule
To achieve the "Liquid Glass" feel, use `backdrop-filter: blur(12px)` on all floating elements. Main CTAs should not be flat; apply a subtle linear gradient from `primary` to `primary_container` at a 135° angle to provide "visual soul."

---

## 3. Typography
We utilize a dual-font strategy to balance authority with utility. **Plus Jakarta Sans** provides a high-end, editorial feel for headlines, while **Inter** ensures maximum legibility for dense operational data.

| Level | Token | Font | Size | Weight | Character Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | 700 | -0.02em |
| **Headline** | `headline-md` | Plus Jakarta Sans | 1.75rem | 600 | -0.01em |
| **Title** | `title-lg` | Inter | 1.375rem | 600 | 0 |
| **Body** | `body-md` | Inter | 0.875rem | 400 | 0.01em |
| **Label** | `label-md` | Inter | 0.75rem | 500 | 0.05em (Caps) |

**Editorial Note:** Use `display-lg` sparingly for high-level metrics. Use `label-sm` in all-caps with increased letter spacing for category headers to create an authoritative, "command center" aesthetic.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a soft, natural lift.
- **Ambient Shadows:** When an element must float (e.g., a dispatch modal), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow color must be a tinted version of the background, never pure black.
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.
- **Glassmorphism:** Navigation rails and top bars should use `surface_container_low` with `opacity: 0.8` and `backdrop-filter: blur(20px)`. This allows the map or dispatch data to bleed through subtly, softening the interface.

---

## 5. Components

### Buttons
- **Primary:** Gradient-fill (`primary` to `primary_container`), `xl` roundedness (0.75rem). No border.
- **Secondary:** Semi-translucent `surface_variant` with a "Ghost Border."
- **States:** On hover, increase the `backdrop-filter` intensity rather than just changing the color.

### Refined Cards
Forbid the use of divider lines. Separate content using vertical white space (e.g., `spacing-6` or `spacing-8`).
- **Hazard Card:** Use a 4px left-accent bar using semantic colors (`Urgent Red`) instead of a full border. 

### Polished Badges/Chips
- **Status Chips:** Use a low-opacity background of the semantic color (e.g., `Urgent Red` at 10% opacity) with the text in the full-saturation color. This ensures the "Liquid Glass" look is maintained even in small elements.

### Form Elements
- **Input Fields:** Use `surface_container_highest` as the background. On focus, do not use a heavy glow; instead, transition the "Ghost Border" from 15% opacity to 50% opacity and shift the background to a slightly brighter `surface_bright`.

### Dispatch Timeline (Context-Specific)
A vertical track using `outline_variant` at 20% opacity. Events are marked with soft-glow "Glass" pips that utilize the backdrop-blur effect to sit "into" the timeline rather than "on" it.

---

## 6. Do's and Don'ts

### Do
- **Do** use `spacing-12` and `spacing-16` to create vast "Editorial" margins between major sections.
- **Do** use overlapping elements. Let a glass card partially obscure a background map or data visualization to create depth.
- **Do** use `on_surface_variant` for secondary text to maintain a sophisticated hierarchy.

### Don't
- **Don't** use 1px solid borders for layout—it breaks the "Liquid" immersion.
- **Don't** use generic icons. Use thin-stroke, professionally weighted iconography that matches the `Inter` stroke width.
- **Don't** use pure white (`#FFFFFF`) for text. Use `on_surface` (`#dae2fd`) to reduce eye strain in dark mode environments.
- **Don't** use "AI Glow" or "Cyberpunk" neon effects. We are building a tool for professionals, not a video game.