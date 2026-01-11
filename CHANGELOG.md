# Changelog

All notable changes to the **VIBES** project will be documented in this file.

## [v13.3.0] - 2026-01-11

### Removed
- **Docker**: Completely removed Docker support (`Dockerfile`, `docker-compose.yml`, `docs/DOCKER_GUIDE.md`) to simplify the build process and focus on local development.

## [v13.2.0] - 2026-01-10

### Security & Hardening
- **Codebase Audit**: Completed comprehensive 21-point audit across Backend, Middleware, and Frontend.
- **Memory Hygiene**:
  - **Frontend**: Implemented `ngOnDestroy` cleanup for intervals, animation frames, and global listeners in `InputManagerService`.
  - **Backend**: Added `Drop` trait to `AudioEngine` for explicit stream termination.
  - **Middleware**: Implemented `cleanup()` in WebSocket Gateway to release sockets and timers.
- **CI/CD**: Added GitHub Actions workflow `audit.yml` for automated syntax, linting, and testing validation.
- **Dependency Management**: Pinned critical dependencies and resolved type definition conflicts in Middleware.

## [v13.1.0] - 2026-01-09

### Changed
- **Project Structure**: Implemented a comprehensive hierarchical directory structure (Standardized `src/`, `tests/`, `assets/`, `config/`, `build/`).
- **Service Paths**: Moved `backend`, `frontend`, and `middleware` into the `src/` directory.
- **Environment Management**: Consolidated configuration files into the `config/` directory.
- **Docker Orchestration**: Updated `docker-compose.yml` build contexts and environment file references.

### Added
- **API Documentation**: Comprehensive REST and WebSocket specification in `docs/API.md`.
- **System Architecture**: Detailed Mermaid diagrams and component maps in `docs/ARCHITECTURE.md`.
- **User Manual**: New installation and usage guide in `docs/USER_MANUAL.md`.
- **Troubleshooting Guide**: Common issues and solutions documented in `docs/TROUBLESHOOTING.md`.
- **Deployment Guide**: Updated Docker-specific instructions in `docs/DOCKER_GUIDE.md`.

## [v13.0.0] - 2026-01-09

### Polish & Optimization

#### Added

- **Audio-Reactive Psychedelic Color Engine**: Completely replaced lighting model with a hue-oscillator system driven by Bass (Kick) and Flux (Transients).
- **Data Modernism HUD**: Rebuilt HUD with `Inter`/`JetBrains Mono`, glassmorphism backdrop, and strict CSS architecture.
- **Smart Audio Selection**: Backend now actively scans for "Stereo Mix", "Loopback", or "CABLE Output" to prefer system audio over microphone.
- **Genre-Aware Autopilot**:
  - **DnB**: Twitchy, fast response (0.4 smoothing).
  - **Ambient**: Deep, floating motion (0.02 smoothing).
  - **Techno**: Mechanical, strobe-locked movement.

#### Changed

- **Performance**: Enforced `OnPush` Change Detection on all Angular components for zero-overhead UI updates.
- **Strict Typing**: Refactored `InputManagerService` to remove `any` types and enforced `readonly` on immutable state.
- **Linting**: Resolved "Zero Fraction" and `Math.hypot` warnings across the codebase.
- **HTML**: Fixed malformed head tags and added Google Fonts preconnects.

#### Fixed

- **Autopilot Jitter**: Implemented `lerp` smoothing for all AI-generated camera vectors.
- **Telemetry**: Fixed potential race conditions in WebSocket state parsing.

## [v12.0.0] - Previous
- Initial implementation of Overmind Rust Backend.
- Migration to WebGL2 Raymarching.

## [v13.3.0] - 2026-01-11

### Security & Infrastructure (Electron Hardening)
- **Manual Electron Runner**: Implemented a standalone `manual-electron` execution environment to bypass persistent npm module resolution and shadowing issues.
    - Decoupled runtime from `node_modules` ambiguity.
    - Enforced explicit loading of `electron.asar` resources.
- **Security Hardening**:
    - **Context Isolation**: Enabled `contextIsolation: true` in `main.ts` to prevent prototype pollution.
    - **Secure IPC**: Implemented `preload.ts` with `contextBridge` to expose a safe `window.electron` API (Close, Minimize, Maximize).
    - **Node Integration**: Enforced `nodeIntegration: false` to mitigate RCE risks.
- **Build Pipeline**:
    - **Webpack Integration**: Migrated `electron:start` to use `webpack` / `esbuild` for consistent bundling.
    - **Unified Output**: Standardized all build artifacts to `dist/electron`.
- **Performance**:
    - **Startup Profiling**: Instrumented `main.ts` with `console.time` metrics for "Window Ready-to-Show" latency analysis.
