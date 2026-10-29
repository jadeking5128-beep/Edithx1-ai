# E.D.I.T.H. X1 — Tactical AI & Defense Assistant
### *"Even Dead, I'm The Hero"*

[![Status](https://img.shields.io/badge/Status-Operational-0ea5e9.svg)](https://edithx1.lovable.app)
[![UI](https://img.shields.io/badge/UI-Liquid%20Glass%20HUD-38bdf8.svg)](#liquid-glass-hud-design)
[![AI Engine](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-38bdf8.svg)](https://deepmind.google/technologies/gemini/)
[![Failover](https://img.shields.io/badge/Failover-4--Key%20Cascade%20Pool-10b981.svg)](#multi-tier-gemini-failover-pool)
[![Built with Lovable](https://img.shields.io/badge/Lovable-Connected-f43f5e.svg)](https://lovable.dev)

E.D.I.T.H. X1 is a next-generation augmented tactical AI assistant inspired by Tony Stark's orbital defense glasses and Peter Parker's neural tactical interface. Engineered with a multi-layered **Liquid Glass HUD**, an automated **4-tier Gemini API key failover pool**, a **D3.js real-time telemetry engine**, and continuous **ambient acoustic monitoring**.

---

## ⚡ Key Capabilities

### 🌌 1. Liquid Glass HUD Architecture
- **Optic Caustics & Refraction**: Frosted backdrop filtration (`backdrop-blur-2xl`), specular top-edge highlights, and iridescent cyan energy rings.
- **Bi-Directional Interactive Core**: Central floating reactor core with dynamic audio-reactive rotation, breathing state transitions, and pulse animations.
- **Instant Guest & Standalone Execution**: Immediate accessibility with zero-blocker guest fallback if cloud credentials are unconfigured.

### 🛡️ 2. Multi-Tier Gemini Failover Pool (4+ Keys)
- **Automatic Quota & Rate-Limit Cascade**: When the primary key reaches `429 (RATE_LIMITED)` or `CREDITS_DEPLETED (RESOURCE_EXHAUSTED)`, E.D.I.T.H. automatically cascades to Fallback Key #1, #2, or #3 without dropping user context or throwing unhandled errors.
- **Dynamic Key Management**: Configure fallback keys via environment variables or on the fly in the in-app Settings panel.
- **Auto-Masking & Security**: API keys are securely hashed and masked (`AIza...X9a1`) in all diagnostic telemetry outputs.

### 📊 3. D3.js Diagnostic & Telemetry Panel
- **Real-Time Latency Curve**: D3.js SVG chart rendering response latency history with cubic monotone interpolation, shaded gradients, and interactive hover tooltips.
- **Active Key Pool Matrix**: Instant visibility into which key is currently servicing requests (Active, Standby, Rate-Limited).
- **Network Health Gauges**: Monitors latency metrics (Min, Average, Peak) and reports system status: `OPTIMAL`, `DEGRADED`, or `OFFLINE`.

### 🎙️ 4. Vocal Ingestion & Background 'Listen' Mode
- **Microphone Sensitivity Threshold Gate**: User-adjustable input slider (2% to 45%) to calibrate microphone gate levels and isolate ambient room noise.
- **Live Signal Calibration Meter**: Real-time audio waveform meter in Settings to visually verify speech input against the threshold line.
- **Continuous Passive Ambient 'Listen' Mode**: Detects sustained background room activity and triggers an ethereal, subtle cyan luminescence pulse in the reactor core without issuing explicit commands.
- **Multi-Voice Synthetic Speech**: Instant audio synthesis supporting 8 synthetic vocal profiles (*Charon, Kore, Puck, Fenrir, Aoede, Leda, Orus, Zephyr*).

### 🌐 5. Dual-Platform Hybrid Target
- **Web Application**: TanStack Start / React 19 / Vite / Tailwind CSS / D3.js.
- **Native Android Application**: Jetpack Compose / Material 3 / Kotlin Coroutines / Android AudioRecord.

---

## 🛠️ Architecture & Tech Stack

```
edithx1/
├── src/                          # Web Application (TanStack Start + React 19)
│   ├── components/
│   │   ├── DiagnosticPanel.tsx   # D3.js telemetry & latency chart
│   │   ├── SettingsPanel.tsx     # Mic threshold slider & key configuration
│   │   └── TaskPanel.tsx         # EDITH Network execution monitor
│   ├── lib/
│   │   ├── ai.server.ts          # 4-tier Gemini failover pool & telemetry
│   │   ├── audio-level.ts        # Live audio analyser & RMS calculator
│   │   ├── record-wav.ts         # Threshold-gated acoustic recorder
│   │   └── styx-settings.ts      # Settings schema & personality prompts
│   ├── routes/
│   │   ├── index.tsx             # Primary HUD viewport (Voice & Text)
│   │   └── unlock.tsx            # Security clearance gate
│   └── styles.css                # Liquid Glass design system & animations
├── app/                          # Native Android Target (Jetpack Compose)
│   ├── src/main/java/com/example/edith/
│   │   ├── data/                 # GeminiRepository & KeyManager
│   │   ├── ui/components/        # LiquidReactorCore, GlassCard, SettingsDialog
│   │   └── ui/HomeScreen.kt      # Compose HUD & audio telemetry
│   └── build.gradle.kts          # Android build configuration
└── package.json                  # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ & npm
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install
```bash
git clone https://github.com/jadeking5128-beep/edithx1.git
cd edithx1
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:

```env
# Primary Key (Provided by default or AI Studio)
GEMINI_API_KEY=AIzaSy...

# Optional Fallback Keys for Automatic Cascade
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
GEMINI_API_KEY_4=AIzaSy...

# Optional Gate Password (Leave blank for open access)
SITE_PASSWORD=
```

*Note: You can also configure Fallback Keys directly in the in-app Settings dialog without restarting the server.*

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📱 Android Build & Deployment

To compile the Android companion application:

```bash
# Verify app compilation
gradle assembleDebug

# Run unit and local tests
gradle :app:testDebugUnitTest
```

---

## 🎮 Interface Guide

| Control | Action | Function |
| :--- | :--- | :--- |
| **Central Reactor Core** | Tap / Click | Initiates voice ingestion and streaming turn |
| **DIAGNOSTICS Button** | Header Bar | Opens D3.js latency chart & key pool status |
| **SETTINGS Button** | Header Bar | Adjusts mic threshold, fallback keys, and voice profile |
| **VOICE / TEXT Switch** | Header Bar | Toggles between immersive HUD and transcript view |
| **Ambient Monitor** | Automatic | Senses continuous room audio and pulses the reactor core |

---

## 🤝 Development & Lovable Integration

This project is connected with [Lovable](https://lovable.dev).

- **Direct Synchronization**: Changes committed to the repository sync back to Lovable.
- **Commit Preservation**: In accordance with `AGENTS.md`, avoid force-pushing or rewriting published git history.

---

*Stark Industries Sec-9 Clearance // E.D.I.T.H. Tactical Defense System*
