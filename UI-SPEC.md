# Design System Specification (UI-SPEC.md)
**Project**: Atlas AI Resume ("Talk with my Resume")  
**Target Viewports**: 390px (Mobile), 768px (Tablet), 1440px (Desktop), 2560px (Ultra-wide)  
**Standard**: WCAG 2.2 AA Compliance | High-Performance Motion | Top 1% Senior Design Rigor

---

## 1. Aesthetic Direction: Disciplined Obsidian Glass

Atlas AI Resume balances the high-credibility clarity of an executive engineering dossier with the responsive intelligence of a modern AI console. It discards cliché "AI template slop" (omnipresent glowing neon borders, random middle-dot labels, fake pulsing badges) in favor of **disciplined obsidian surfaces, structural rim lighting, and typographic authority**.

### Core Visual Principles
1. **Quiet Authority**: Deep obsidian surfaces (`#090D16`) with subtle gradient depth instead of harsh flat blacks or noisy backdrop blurs.
2. **Two Restrained Accents**:
   - **Signal Cyan (`#00D2EE`)**: Used strictly for active system status, verified indicators, and primary interactive focus.
   - **Iris Indigo (`#6366F1`)**: Used for conversational agent messages, AI prompts, and secondary highlights.
3. **Typography as Structure**:
   - **Display Font**: *Outfit* (Modern geometric grotesque with high legibility and presence).
   - **Body Font**: *Plus Jakarta Sans* (Humanist neo-grotesque, wide counters, exceptional small-text readability).
   - **Code/Telemetry Font**: *JetBrains Mono* (Developer-grade tabular figures, ligatures, clear punctuation).
4. **Purposeful Feedback Only**: Motion only exists to clarify state transitions (drawer slides, message arrivals, button depressions). No infinite pulsing or rotating decorations.

---

## 2. Design Tokens Matrix (Tailwind CSS v4 `@theme`)

### Colors
```css
@theme {
  /* Surfaces */
  --color-surface-base: #090D16;
  --color-surface-raised: #0F1626;
  --color-surface-overlay: #151F36;
  --color-surface-card: rgba(15, 22, 38, 0.72);
  --color-surface-glass: rgba(21, 31, 54, 0.55);

  /* Borders & Rim Lights */
  --color-border-subtle: rgba(255, 255, 255, 0.07);
  --color-border-strong: rgba(255, 255, 255, 0.14);
  --color-border-rim: rgba(0, 210, 238, 0.28);

  /* Accents */
  --color-accent-cyan: #00D2EE;
  --color-accent-cyan-subtle: rgba(0, 210, 238, 0.12);
  --color-accent-indigo: #6366F1;
  --color-accent-indigo-subtle: rgba(99, 102, 241, 0.12);

  /* Content Text & Readability */
  --color-text-primary: #F8FAFC;    /* Contrast 15.2:1 against surface-base */
  --color-text-secondary: #94A3B8;  /* Contrast 5.8:1 (Passes WCAG AA 4.5:1) */
  --color-text-muted: #64748B;      /* Contrast 3.5:1 (Only for inactive icons & 14px+ labels) */
  --color-text-accent: #38BDF8;

  /* Typography */
  --font-display: "Outfit", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* Spacing & Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 22px;

  /* Motion Timing */
  --duration-fast: 150ms;
  --duration-base: 240ms;
  --duration-slow: 380ms;
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 3. Typographic Hierarchy & Scale

| Level | Size | Weight | Line Height | Tracking | Target Element |
|---|---|---|---|---|---|
| **Display** | `2.25rem` (36px) | 800 (Bold) | 1.15 | `-0.025em` | Hero Name & Primary Value Statement |
| **H1** | `1.5rem` (24px) | 700 (SemiBold)| 1.25 | `-0.02em` | Section Titles (Experience, Verifiers) |
| **H2** | `1.125rem` (18px)| 600 (Medium)  | 1.35 | `-0.015em`| Card Titles & Assistant Message Headers |
| **Body Large**| `1rem` (16px) | 400 (Regular) | 1.55 | `0` | Primary Chat Answers & Executive Summaries |
| **Body Base** | `0.875rem` (14px)| 400 (Regular) | 1.50 | `0` | Project Descriptions, Bullet Points |
| **Caption** | `0.75rem` (12px) | 500 (Medium)  | 1.40 | `+0.01em` | Metadata Chips, Dates, Citations |
| **Code/Mono**| `0.8125rem` (13px)| 500 (Medium)| 1.45 | `0` | TTFT Latency, Chunks, Benchmark Values |

*Rule: Never drop font sizes below 12px (0.75rem) for readable content. Eliminate `text-[8px]` and `text-[9px]`.*

---

## 4. Spacing, Elevation & Touch Targets

1. **Touch Targets (Mobile & Desktop)**:
   - Every interactive control (navigation tabs, PDF page buttons, chat copy buttons, suggestion chips, send button) has a **minimum touch target of 44x44px** on touch viewports (`min-h-[44px] min-w-[44px]`).
2. **Glassmorphism Discipline**:
   - Background: `rgba(15, 22, 38, 0.72)`.
   - Blur: `backdrop-blur-md` (12px max). Avoid extreme 30px blurs that trigger mobile GPU lag.
   - Border: `1px solid rgba(255, 255, 255, 0.08)`. Rim light: top-highlight `inset 0 1px 0 rgba(255, 255, 255, 0.1)`.
   - Box-Shadow: Restrained obsidian ambient shadow `0 8px 32px -4px rgba(0, 0, 0, 0.5)`. Zero oversaturated neon drop-shadows.
3. **Keyboard Accessibility**:
   - Universal `:focus-visible` ring token:
     `outline: 2px solid var(--color-accent-cyan); outline-offset: 2px;`

---

## 5. Responsive Layout Strategy

- **Mobile (<768px)**:
  - Stacked layout with sticky slim header.
  - Chat defaults to an intuitive bottom drawer sheet that can be dragged up or minimized, ensuring the resume PDF is never obscured or missing.
  - Height uses `100dvh` (Dynamic Viewport Height) so iOS Safari address bars never cut off the chat input.
- **Desktop (≥1024px)**:
  - Fixed-height dual-pane layout (`calc(100vh - 4.5rem)`).
  - Left pane: ATS PDF Document Viewer with smooth page transitions.
  - Right pane: Docked Atlas AI Assistant (`w-[420px]`).
  - Toggle button collapses the chat with a smooth spring animation (`w-0` to `w-[420px]`).
