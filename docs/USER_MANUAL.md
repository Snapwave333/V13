# User Manual: VIBES v13

## 1. Introduction

VIBES is a professional-grade 3D audio visualizer. This manual provides instructions for setting up and operating the system.

## 2. Installation

### Quick Start (Manual)
1. **Backend**: Navigate to `apps/backend` and run `cargo run`.
2. **Middleware**: Navigate to `apps/middleware`, run `npm install`, then `npm run dev`.
3. **Frontend**: Navigate to `apps/frontend`, run `npm install`, then `npx ng serve`.

## 3. Configuration

Configuration is managed via `config/.env`. Key parameters:
- `JWT_SECRET`: Secret key for authentication.
- `ADMIN_CREDENTIALS_HASH`: SHA256 hash for the admin password.
- `OLLAMA_HOST`: URL where the Ollama service is reachable.

## 4. Usage & Controls

The visualizer supports Xbox Gamepad input and AI Autopilot.

### Interaction Modes

- **Autopilot**: Active by default. Automatically adjusts camera and fractal parameters to the music.
- **Manual Mode**: Engaged upon controller input. Returns to Autopilot after 30 seconds of inactivity.

### Controls Mapping

- **Left Stick**: Orbit Camera.
- **Right Stick (Y)**: Zoom / Scale.
- **Triggers (LT/RT)**: Intensity Modulation.
- **A Button**: Glitch Trigger.
- **D-Pad Up**: Toggle HUD Overlays.

## 5. Accessibility (WCAG 2.1)

- **High Contrast**: The HUD uses glassmorphism and high-contrast text for visibility.
- **Reduced Motion**: Motion can be dampened by lowering the `glitch_factor` (In development).
- **Navigation**: Full keyboard support is maintained for web elements.
