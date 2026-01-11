# System Architecture: VIBES v13

## Overview

The VIBES system adheres to the **"Overmind" Architecture**, a centralized state-driven model where a high-performance backend orchestrates audio analysis, AI logic, and global state broadcasting, while a decoupled frontend focuses on visual rendering.

## Component Diagram

```mermaid
graph TD
    %% Styling
    classDef rust fill:#dea,stroke:#333,stroke-width:2px;
    classDef node fill:#cce,stroke:#333,stroke-width:2px;
    classDef angular fill:#fdd,stroke:#333,stroke-width:2px;
    classDef infra fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;

    subgraph Hardware [Hardware Layer]
        Mic[Microphone/Loopback]:::infra
        Gamepad[Xbox Controller]:::infra
    end

    subgraph Backend [Backend Service]
        AudioEngine[Audio Engine\ncpal / rustfft]:::rust
        Overmind[Overmind\nState Machine]:::rust
        LlmDirector[LlmDirector\nLLM Agent]:::rust
        WSS[WebSocket Server\nAxum 0.6]:::rust
    end

    subgraph AI [AI Service]
        Ollama[Ollama Service\nLlama3 / Mistral]:::infra
    end

    subgraph Middleware [Middleware Service]
        Express[Express API\nNode.js]:::node
        Auth[Auth Service\nJWT]:::node
    end

    subgraph Frontend [Frontend App]
        Angular[Visualizer App\nAngular 19]:::angular
        WebGL[WebGL2 Renderer\nFragment Shader]:::angular
        HUD[Telemetry HUD\nHTML/CSS]:::angular
    end

    %% Audio Flow
    Mic --> |PCM Stream| AudioEngine
    AudioEngine --> |FFT Analysis| Overmind

    %% AI Flow
    Overmind --> |Context JSON| LlmDirector
    LlmDirector --> |HTTP/POST| Ollama
    Ollama --> |JSON Response| LlmDirector
    LlmDirector --> |Directives| Overmind

    %% State Broadcast
    Overmind --> |Global State 60Hz| WSS
    WSS --> |WS Protocol :3000| Angular

    %% Rendering Flow
    Angular --> |Uniforms| WebGL
    Overmind -.-> |Metrics| HUD

    %% Control Flow
    Gamepad --> |Gamepad API| Angular
    Angular --> |Input Events| WSS

    %% Management Flow
    Angular --> |HTTP/REST :3001| Express
    Express --> |Internal API| Overmind
```

## Data Flow Diagram (The Overmind Loop)

```mermaid
sequenceDiagram
    participant Audio as Audio Input
    participant Engine as AudioEngine
    participant State as Overmind State
    participant LLM as LlmDirector
    participant WS as WebSocket
    participant UI as Frontend

    loop Every Frame (60Hz)
        Audio->>Engine: Raw PCM Data
        Engine->>Engine: FFT & Feature Extraction
        Engine->>State: Update Energy/Flux/BPM
        
        alt Every 10 Seconds
            State->>LLM: Request Aesthetic Directive
            LLM->>State: Set Theme & Colors
        end

        State->>WS: Broadcast GlobalState JSON
        WS->>UI: Receive State
        UI->>UI: Update Uniforms & Render Frame
    end
```

## Directory Structure

Following professional monorepo standards, the project is organized into `apps/` and `infra/`:

```text
v13/
├── apps/           # Primary Source Code (Services)
│   ├── backend/    # Core Rust Audio Engine
│   ├── frontend/   # Angular 19 WebGL Visualizer
│   └── middleware/ # Node.js Orchestration & Auth
├── infra/          # Infrastructure & Shared Tooling
│   ├── build/      # Compilation outputs
│   ├── config/     # Secrets and env files
│   └── scripts/    # Utility automation
├── docs/           # Technical and user documentation
├── tests/          # Consolidated test suites

```

## Core Modules

### 1. Core Backend (`apps/backend`)

- **AudioEngine**: Utilizes `cpal` for low-latency system audio capture.
- **Overmind**: The primary state machine. Performs heuristic analysis to detect genres and vibe states.
- **LlmDirector**: Integrates with Ollama to provide high-level aesthetic directives.

### 2. Middleware (`apps/middleware`)

- Provides a secure REST API layer.
- Handles JWT authentication for system control.
- Collects and aggregates system health metrics.

### 3. Frontend (`apps/frontend`)

- **Renderer**: Single-pass fragment shader for 4K raymarching.
- **HUD**: Glassmorphism UI for real-time telemetry display.
- **InputManager**: Maps hardware controller events to visual parameters.

## Design Decisions

- **Unidirectional Data Flow**: State always flows from Backend to Frontend to minimize latency and synchronization issues.
- **Stric Type Safety**: Rust in the backend and TypeScript (Strict Mode) in the frontend ensure deterministic behavior.
- **Hardware Acceleration**: Heavy lifting is offloaded to the GPU via WebGL2/GLSL.
