# E.D.I.T.H. X1 — Tactical AI & Defense Architecture
### *"Even Dead, I'm The Hero"*

[![Status](https://img.shields.io/badge/Status-Operational-00e5ff.svg)](https://edithx1.lovable.app)
[![UI](https://img.shields.io/badge/UI-iOS%2027%20Liquid%20Glass-00e5ff.svg)](#ios-27-liquid-glass-hud)
[![AI Engine](https://img.shields.io/badge/AI-Gemini%203.5%20Flash-38bdf8.svg)](https://deepmind.google/technologies/gemini/)
[![Failover](https://img.shields.io/badge/Failover-Stark%20Cascade%20Pool-10b981.svg)](#multi-tier-gemini-failover-pool)

E.D.I.T.H. X1 is an augmented tactical AI intelligence console inspired by Tony Stark's orbital defense glasses and Peter Parker's neural tactical interface. Engineered with an authentic **iOS 27 Liquid Glass HUD**, the official **Brushed Titanium EDITH Emblem**, a **Holographic Arc Reactor Core with dynamic Soundwave Reticle**, an automated **Gemini 3.5 Flash cascade pool**, and an autonomous **Stark Tactical Fallback Engine**.

---

## ⚡ Core Capabilities

### 🌌 1. iOS 27 Liquid Glass HUD
- **Deep Optical Refraction & Dispersion**: Real iOS 27 optical blur (`backdrop-filter: blur(48px) saturate(220%)`), double specular rim lines (`inset 0 1.5px 0 rgba(255, 255, 255, 0.65)`), and chromatic edge sheen.
- **Stealth Carbon-Fiber Matrix**: Micro-grid tactical HUD backdrop with subtle cyan caustics, azimuth compass ticks, and Stark Sec-9 telemetry brackets.
- **Floating Liquid Nav Dock**: Continuous glass pill dock housing the official EDITH titanium logo, mode switcher, telemetry status, and parameter settings.

### ⚛️ 2. Holographic Arc Reactor Core with Soundwave Reticle
- **Multi-Ring Gyroscopic Conduit**: Dual counter-rotating conduits, 10 radial plasma induction coils, and 360° azimuth degree indicators.
- **Real-Time Soundwave Reticle**: Audio-reactive HTML5 canvas ring with dynamic radial soundwave bars driven by vocal input.
- **Embedded Official Logo Emblem**: Houses the brushed titanium "E" chevron with electric cyan laser beam and targeting reticles.

### 🛡️ 3. Dual-Tier Intelligence Architecture (Gemini 3.5 Flash + Autonomous Stark Core)
- **Automatic Quota & Key Cascade**: Seamless failover across user-configured API keys. Extra keys configured by the user in Settings are prioritized first.
- **Autonomous Stark Tactical Fallback**: If cloud satellite keys are revoked or unavailable, EDITH automatically activates its local tactical intelligence engine to process directives, computations, status diagnostics, and network commands without interruption.
- **Instant Vocal Fallback**: Cloud TTS coupled with automatic Web Speech Synthesis fallback so vocal transmissions never drop.

### 🎙️ 4. Vocal Ingestion & Background 'Listen' Mode
- **Microphone Sensitivity Threshold Gate**: User-adjustable slider (2% to 45%) to calibrate microphone gate levels and filter ambient noise.
- **Live Signal Calibration Meter**: Real-time audio waveform meter in Settings to visually verify speech input against the threshold line.
- **Passive Ambient Sonar**: Senses sustained background room activity and triggers an ethereal cyan luminescence pulse in the Arc Reactor core without issuing explicit commands.

---

## 🛠️ Architecture & Tech Stack

```
edithx1/
├── src/                          # Web Application (TanStack Start + React 19)
│   ├── components/
│   │   ├── ArcReactorCore.tsx    # Holographic Arc Reactor with soundwave reticle
│   │   ├── EdithLogo.tsx         # Official Titanium EDITH emblem
│   │   ├── DiagnosticPanel.tsx   # Telemetry & bezier latency chart
│   │   ├── SettingsPanel.tsx     # Mic threshold slider & key configuration
│   │   └── TaskPanel.tsx         # EDITH Network execution monitor
│   ├── lib/
│   │   ├── ai.server.ts          # Gemini 3.5 failover pool & key management
│   │   ├── autonomous-edith.ts   # Local Stark tactical fallback engine
│   │   ├── audio-level.ts        # Live audio analyser & RMS calculator
│   │   ├── record-wav.ts         # Threshold-gated acoustic recorder
│   │   └── styx-settings.ts      # Settings schema & personality prompts
│   ├── routes/
│   │   ├── index.tsx             # Primary HUD viewport (Voice & Text)
│   │   └── unlock.tsx            # Security clearance gate
│   └── styles.css                # iOS 27 Liquid Glass design system
└── app/                          # Native Android Target (Jetpack Compose)
```

---

*STARK INDUSTRIES SEC-9 // E.D.I.T.H. X1 TACTICAL CONSOLE*
