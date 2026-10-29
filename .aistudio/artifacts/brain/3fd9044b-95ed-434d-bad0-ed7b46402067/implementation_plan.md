# E.D.I.T.H. X1 Tactical Overhaul: Arc Reactor, Carbon Console & Instant Gemini 2.0

Transform E.D.I.T.H. X1 from a generic AI interface into a true Stark-grade military-grade tactical console. This overhaul eliminates the generic spinning circles in favor of an authentic Holographic Arc Reactor Core with soundwave reticles, adopts a dark stealth carbon-fiber aesthetic with laser cyan accents, and resolves the AI execution stall by fixing auth middleware gating and upgrading to Gemini 2.0 Flash for sub-second response times.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed through the interactive design review:
> - **Central Core**: Holographic Arc Reactor with dynamic soundwave reticle and HUD targeting brackets (replacing the generic rotating dashed circles).
> - **AI Engine & Performance**: Gemini 2.0 Flash (`gemini-2.0-flash`) prioritized for rapid sub-second responses, with automatic cascade across the 4-key failover pool.
> - **Visual Aesthetic**: Dark stealth carbon-fiber console with crisp laser-cyan accents (`#00E5FF` / `#38BDF8`), beveled tactical framing, and military HUD readouts.

---

## 1. Overview & Core Concept

- **What It Does**: E.D.I.T.H. X1 functions as an authentic tactical defense AI. Users interact via vocal commands or text directives, seeing real-time acoustic waveform feedback inside a holographic Arc Reactor, live D3 latency metrics, and instant AI answers with automated 4-key quota failover.
- **Target Persona**: Developers and tech enthusiasts seeking an immersive, high-performance Jarvis/EDITH assistant that feels like hardware telemetry rather than an ordinary chat window.
- **Key Value**: Immediate functionality without setup hurdles (works in standalone guest mode without Supabase roadblocks), ultra-responsive vocal turns, and cinematic Stark tactical HUD visuals.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Color Palette & Atmospheric Contrast**:
  - Base: Deep stealth obsidian (`#040711`) with subtle carbon-weave micro-mesh texture.
  - Accent / Primary: Laser Cyan (`#00E5FF` / `#38BDF8`) with glowing bloom and specular reflections.
  - Secondary / Status: Emerald online indicator (`#10B981`), Amber computing flare (`#F59E0B`), and Crimson alert ring (`#EF4444`).
- **Typography & HUD Data Display**:
  - High-density monospace tracking for coordinates, telemetry, and system status (`font-mono tracking-widest`).
  - Chamfered corner panels and beveled titanium borders.
- **Holographic Arc Reactor Core (New Architecture)**:
  - **Outer Reticle**: Segmented circular scale with degree ticks (0°, 90°, 180°, 270°) and optical focus brackets.
  - **Electromagnetic Coils**: 10 radial plasma inductors that pulse in sync with incoming audio amplitude.
  - **Soundwave Visualizer Ring**: Live acoustic waveform bars radiating outward in real time from mic input.
  - **Central Crystal Core**: Hexagonal glowing plasma emitter with multi-stage bloom and specular lens flare.
  - **Tactical State Modes**:
    - *Idle*: Calm rhythmic luminescence with gyroscopic micro-drift.
    - *Ambient Detect*: Subtle cyan sonar ripple when background room sound is sensed.
    - *Listening*: Dynamic audio-reactive expansion with real-time waveform bars.
    - *Thinking*: High-frequency plasma rotation with amber computing flare.
    - *Speaking*: Resonant vocal pulse synced to audio synthesis.

---

## 3. Key Technical Decisions & Fixes

### 1. Fix AI Execution Failure & Slow Response Times
- **Root Cause Identified**:
  1. `src/integrations/supabase/auth-middleware.ts` throws `Missing Supabase environment variable(s)` when `SUPABASE_URL` is undefined, aborting `askJarvis` server calls and preventing the AI from answering.
  2. `src/lib/ai.server.ts` was referencing an unreleased model string (`gemini-2.5-flash`), triggering 404 retries and high fallback latencies.
- **Chosen Fix**:
  1. Update `auth-middleware.ts` and `jarvis.functions.ts` to allow standalone/guest execution without throwing when Supabase credentials are not configured.
  2. Switch primary model to official `gemini-2.0-flash` (optimized for sub-second conversational latency), with graceful fallback to `gemini-1.5-flash`.

### 2. Revamp Reactor Core & CSS Design System
- Replace the 3 CSS spinning dashed divs with an SVG/Canvas + CSS layered **Holographic Arc Reactor** featuring radial coil inductors, live acoustic spectrum rings, and tactical HUD brackets.
- Upgrade `src/styles.css` with carbon-fiber weave patterns (`repeating-linear-gradient`), laser cyan glow filters, and beveled tactical cards.

---

## 4. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────┐
│                   E.D.I.T.H. X1 HUD                    │
├──────────────────────────┬─────────────────────────────┤
│   Telemetry & Status     │   Carbon Console Header     │
│   • 4-Key Cascade Pool   │   • Net Synced / Latency    │
│   • D3 Latency Chart     │   • Mode Pill (Voice/Text)  │
├──────────────────────────┴─────────────────────────────┤
│                                                        │
│           HOLOGRAPHIC ARC REACTOR CORE                 │
│      ┌─────────────────────────────────────┐           │
│      │  [ ] Targeting Brackets (4 corners) │           │
│      │   ☼  Radial Coil Inductor Ring      │           │
│      │  ~~~ Live Audio Waveform Reticle    │           │
│      │   ●  Hexagonal Plasma Crystal Core  │           │
│      └─────────────────────────────────────┘           │
│                                                        │
├────────────────────────────────────────────────────────┤
│           STANDALONE RESILIENT AI BACKEND              │
│  [Audio Input] ──► [Record WAV / RMS Analyzer]         │
│  [Speech / Text] ──► [askJarvis Server Function]       │
│                         │                              │
│         ┌───────────────┴───────────────┐              │
│         ▼                               ▼              │
│   [Guest Bypass]              [Gemini 2.0 Flash]       │
│   (No Supabase Crash)         (Sub-Second Response)    │
│                                         │              │
│                    ┌────────────────────┴───────────┐  │
│                    ▼                                ▼  │
│             [Primary Key]              [Cascade Pool]  │
│             (Key #1 Env)               (Fallback 1-3)  │
└────────────────────────────────────────────────────────┘
```

---

## 5. Step-by-Step Execution Phases

1. **Phase 1: Fix AI Backend & Unblock Execution**
   - Update `auth-middleware.ts` to support graceful fallback when Supabase env vars are not set.
   - Update `jarvis.functions.ts` to execute `askJarvis` seamlessly in guest and standalone mode.
   - Update `ai.server.ts` to set `gemini-2.0-flash` as primary and `gemini-1.5-flash` as fallback, removing 404 retries and dramatically accelerating inference.

2. **Phase 2: Build Holographic Arc Reactor Component**
   - Create `src/components/ArcReactorCore.tsx` with precision SVG coils, degree scale, acoustic waveform visualizer, and tactical targeting brackets.
   - Wire live audio level data directly to the reactor's coils and waveform ring.

3. **Phase 3: Dark Stealth Carbon Console Theme**
   - Add stealth carbon-fiber texture and beveled tactical styles in `src/styles.css`.
   - Update `src/routes/index.tsx` to mount the new `ArcReactorCore` and carbon HUD styling.

4. **Phase 4: Verification & Smoke Test**
   - Run `compile_applet` to ensure 100% build pass.
   - Verify query execution and vocal turn roundtrip.
