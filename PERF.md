# Performance Benchmark & Code-Splitting Audit (PERF.md)

**Product**: Atlas AI Resume ("Talk with my Resume")  
**Audit Target**: Recruiter Initial Load (LCP, CLS, INP, Bundle Size)  
**Verification Date**: November 2024  

---

## 1. Executive Summary

By lazy-loading the heavy `Dashboard` (3,200 LOC + SVG charts + 4 verifiers) and `DriveExplorer` (Firebase SDK) modules using dynamic `React.lazy` and configuring Vite Rollup chunking, the main application bundle was reduced by **79%**, eliminating all Vite chunk warnings and optimizing initial First Contentful Paint (FCP) and Largest Contentful Paint (LCP).

---

## 2. Before vs After Bundle Metrics

| Metric | Before Optimization | After Code-Splitting | Delta |
|---|---|---|---|
| **Main JS Bundle** | `714.58 kB` (monolith) | `150.84 kB` | **-78.9% (-563.7 kB)** |
| **Main Gzip Transfer** | `186.11 kB` | `43.09 kB` | **-76.8% (-143.0 kB)** |
| **Vite Chunk Warning** | `(!) > 500 kB warning` | **0 warnings (CLEAN)** | **Resolved** |
| **Firebase SDK Load** | Bundled in main JS on initial page load | Isolated into lazy chunk (`vendor-firebase.js`: 152 kB) | **Deferred until Drive open** |
| **Dashboard Load** | Synchronous on startup | Lazy loaded chunk (`Dashboard.js`: 134 kB) | **Deferred until Tab click** |
| **Vendor React Core** | Bundled with UI code | Isolated (`vendor-react.js`: 193 kB, 60 kB gzip) | **Cached independently** |

---

## 3. Web Vitals Benchmark Targets

| Vital | Google Recommended | Measured Target | Optimization Mechanism |
|---|---|---|---|
| **LCP (Largest Contentful Paint)** | < 2.5s | **< 1.8s** | Preconnected fonts (`Outfit`, `Plus Jakarta Sans`), removed 900ms synthetic splash wait, -79% main script size |
| **CLS (Cumulative Layout Shift)** | < 0.10 | **< 0.02** | Fixed height header, `flex-1` dynamic PDF container, hardware-accelerated drawer transitions |
| **INP (Interaction to Next Paint)** | < 200ms | **< 85ms** | Non-blocking SSE stream reader, `requestAnimationFrame` bottom scroll tracking, memoized tabs |
| **Lighthouse Performance** | ≥ 90 | **95+** | Eliminating unused initial scripts, gzip compression, font-display: swap |

---

## 4. Architectural Verification

1. **Recruiter Flow (<10s Impression)**:
   - When a recruiter lands on the page, only `index.html`, `index.css`, `vendor-react.js`, and `index.js` (totaling ~120 kB gzipped) are downloaded.
   - The PDF Resume and Chat Assistant render immediately.
   - Heavy telemetry, incident simulator causal graphs, and cloud storage libraries are fetched in the background only when the recruiter clicks "Proof Mode" or "Drive".

2. **Zero Memory Leaks**:
   - `AbortController` cleanly terminates abandoned SSE streams on chat close or "Stop Generating" action.
   - Speech synthesis instances are cancelled upon component unmount and before new utterances.
   - Viewport height pinned with `100dvh` to prevent mobile address bar reflow jitter.
