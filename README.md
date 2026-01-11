<div align="center">
  <img src="assets/hero_banner.svg?v=final" alt="V13 EQ_PRISM IDENTITY" width="100%">
</div>

<br />

<div align="center">
  <img src="assets/section_divider.svg" width="100%">
</div>

<br />

# PROJECT OVERVIEW

**V13** is a high-performance audio-reactive visualization system striving for a "Data Modernism" aesthetic. It functions as an autonomous "Overmind" that analyzes system audio in real-time to drive a 4K, hardware-accelerated raymarching engine.

The system is designed with a strict **UNIDIRECTIONAL DATA FLOW**:

1.  **Audio Engine (Rust)** captures and analyzes the spectrum.
2.  **Overmind (Rust)** derives state, vibe, and genre.
3.  **LlmDirector (AI)** injects aesthetic directives.
4.  **WebSocket (Axum)** broadcasts state at 60Hz.
5.  **Frontend (Angular/WebGL)** renders the final mathematical art.

## IDENTITY :: EQ_PRISM

V13 abandons "Cyberpunk" clichés in favor of **EQ_PRISM**: a design language grounded in audio spectrum analysis, heatmaps, and high-contrast telemetry.

*   **Palette**: Solar `#FFC300` -> Deep Void `#581845`
*   **Typography**: `Inter` (Human) + `Fira Code` (Machine)
*   **Philosophy**: "Function is Beauty. Latency is Failure."

---

# TECH STACK

<div align="center">
  
| **CORE BACKEND** | **FRONTEND RENDERER** | **MIDDLEWARE** | **AI / AGENT** |
| :--- | :--- | :--- | :--- |
| ![Rust](https://img.shields.io/badge/Rust-1.80+-000000?style=flat-square&logo=rust&logoColor=white) | ![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat-square&logo=angular&logoColor=white) | ![Node](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white) | ![Ollama](https://img.shields.io/badge/Ollama-Local-000000?style=flat-square&logo=ollama&logoColor=white) |
| ![cpal](https://img.shields.io/badge/cpal-Audio_Input-FFC300?style=flat-square&logo=rust&logoColor=black) | ![WebGL2](https://img.shields.io/badge/WebGL2-Raymarching-581845?style=flat-square&logo=webgl&logoColor=white) | ![Express](https://img.shields.io/badge/Express-API-000000?style=flat-square&logo=express&logoColor=white) | ![Llama 3](https://img.shields.io/badge/Llama_3-Creativity-0467DF?style=flat-square&logo=meta&logoColor=white) |
| ![rustfft](https://img.shields.io/badge/rustfft-Analysis-FF5733?style=flat-square&logo=rust&logoColor=white) | ![GLSL](https://img.shields.io/badge/GLSL-Shaders-900C3F?style=flat-square&logo=opengl&logoColor=white) | ![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | ![Mistral](https://img.shields.io/badge/Mistral-Logic-F5A962?style=flat-square&logo=huggingface&logoColor=white) |
| ![Axum](https://img.shields.io/badge/Axum-WebSockets-C70039?style=flat-square&logo=rust&logoColor=white) | ![HTML5](https://img.shields.io/badge/HTML5-HUD-E34F26?style=flat-square&logo=html5&logoColor=white) | ![PM2](https://img.shields.io/badge/PM2-Process-2B037A?style=flat-square&logo=pm2&logoColor=white) | |

</div>

<br />

<div align="center">
  <img src="assets/section_divider.svg?v=final" width="100%">
</div>

# CORE FEATURES

*   **Real-Time FFT Analysis**: 60Hz extracted features (Energy, Flux, Centroid, Rolloff).
*   **Autonomous Vibe Detection**: "Overmind" state machine detects *Chill*, *Build*, and *Chaos* states.
*   **AI Aesthetic Director**: Connects to local LLMs (Ollama) to dynamically re-theme colors and geometry based on the music.
*   **4K Raymarching Renderer**: Single-pass GLSL Menger Sponge fractal with domain warping.
*   **Telemetry HUD**: "Glassmorphism" overlay displaying live audio data and system metrics.
*   **Gamepad Control**: Full Xbox controller mapping for fly-cam and visual overrides.

---

# ARCHITECTURE

The system follows a strict **Command-Query Separation (CQS)** pattern disguised as an event loop. The Backend *pushes* state; the Frontend *renders* it.

<div align="center">
  <img src="assets/architecture_diagram.svg?v=final" width="90%" alt="System Architecture Diagram">
</div>

### THE OVERMIND LOOP

<div align="center">
  <img src="assets/data_flow_diagram.svg?v=final" width="80%" alt="Data Flow Sequence Diagram">
</div>

1.  **Capture**: `cpal` grabs the Loopback/Stereo Mix stream.
2.  **Analyze**: `rustfft` computes the frequency spectrum. Custom algorithms extract "Vibe Metrics".
3.  **Direct**: `LlmDirector` occasionally polls an LLM for a "Vibe Shift" (e.g., "Make it look like a burning sun").
4.  **Broadcast**: `Axum` pushes a generic `GlobalState` JSON object to all WebSocket clients.
5.  **Render**: Angular receives the object and maps it to GLSL Uniforms (`u_bass`, `u_color_1`, `u_time`).

<details>
<summary><strong>EXPAND: Data Flow Specification</strong></summary>

```json
{
  "state": "Chaos",
  "bpm": 140.0,
  "energy": { "low": 0.8, "mid": 0.4, "high": 0.9 },
  "ai_context": {
    "theme": "VOLCANIC_GLASS",
    "primary_color": "#FFC300",
    "secondary_color": "#581845"
  }
}
```
*The frontend is pure reaction. It contains no logic about "what" to allow, only "how" to draw it.*
</details>

---

# DEPLOYMENT

### PREREQUISITES
*   Windows 10/11 (WASAPI Loopback support required)
*   Rust (Stable)
*   Node.js v20+
*   Ollama (running `llama3`)

### 1. START BACKEND (THE OVERMIND)
```powershell
cd apps/backend
cargo run --release
# Listens on ws://127.0.0.1:3000
```

### 2. START MIDDLEWARE (THE API)
```powershell
cd apps/middleware
npm install && npm run dev
# Listens on http://127.0.0.1:3001
```

### 3. START FRONTEND (THE VIEW)
```powershell
cd apps/frontend
npm install && npm start
# Opens http://localhost:4200
```

---

# CONTROLS

| INPUT | ACTION | CONTEXT |
| :--- | :--- | :--- |
| **Left Stick** | Camera Orbit | Global |
| **Right Stick** | Zoom / Fractal Scale | Global |
| **LT / RT** | Blackout / Overdrive | Performance |
| **A Button** | Force Glitch | Visuals |
| **D-Pad Up** | Toggle HUD | UI |

<br />

<div align="center">
  <img src="assets/section_divider.svg" width="100%">
</div>

# CONTRIBUTING

This is a private research repository.
Feature requests must demonstrate significant value to **Latency Reduction** or **Visual Fidelity**.

**Code Style**:
*   **Rust**: `cargo fmt` (Strict)
*   **TypeScript**: `Prettier` (Grid, Spaces: 2)
*   **Commit**: Conventional Commits (`feat:`, `fix:`, `docs:`)

---

made with love by SNAPWAVE333/LUSHAPPS
