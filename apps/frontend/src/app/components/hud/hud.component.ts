import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputManagerService } from '../../services/input-manager.service';
import { ControllerVisualizerComponent } from './controller-visualizer/controller-visualizer.component';

interface HudBlockPosition {
  x: number;
  y: number;
  expanded: boolean;
}

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule, ControllerVisualizerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hud-layer" [class.visible]="isVisible()">
      <!-- Background Elements -->
      <div class="scanline"></div>
      <div class="vignette"></div>

      <!-- MAIN LAYOUT CONTAINER -->
      <div class="hud-layout">
        
        <!-- LEFT COLUMN: SYSTEM & METRICS -->
        <div class="hud-column left">
            <!-- BRANDING (Top Left now, more subtle) -->
            <div class="branding-lockup">
                <svg viewBox="0 0 100 100" width="24" height="24">
                    <rect x="15" y="10" width="12" height="40" rx="4" fill="var(--c-1)" />
                    <rect x="33" y="10" width="12" height="65" rx="4" fill="var(--c-2)" />
                    <rect x="51" y="10" width="12" height="90" rx="4" fill="var(--c-3)" />
                </svg>
                <div class="brand-text">
                    <span class="main-title">V13 // PRISM</span>
                    <span class="sub-title">OBSERVER_UPLINK</span>
                </div>
            </div>

            <!-- SYSTEM BLOCK -->
            <div class="hud-block system-block">
                <div class="block-header">:: SYSTEM_TELEMETRY</div>
                <div class="data-row">
                    <span class="key">CPU_CORE</span>
                    <div class="bar-mini">
                        <div class="fill" [style.width.%]="(systemStats().cpu_usage || 0)" [class.warn]="(systemStats().cpu_usage||0)>50"></div>
                    </div>
                    <span class="val">{{ systemStats().cpu_usage.toFixed(0) }}%</span>
                </div>
                <div class="data-row">
                    <span class="key">MEMORY</span>
                    <div class="bar-mini">
                        <div class="fill" [style.width.%]="(memUsage()||0)" [class.crit]="memUsage()>90"></div>
                    </div>
                    <span class="val">{{ memUsage() }}%</span>
                </div>
                <div class="data-row">
                    <span class="key">UPTIME</span>
                    <span class="val">{{ formatUptime(systemStats().uptime || 0) }}</span>
                </div>
            </div>

            <!-- RENDER METRICS -->
            <div class="hud-block perf-block">
                <div class="block-header">:: RENDER_PIPELINE</div>
                <div class="fps-display">
                    <span class="fps-num">{{ fps() }}</span>
                    <span class="fps-unit">FPS</span>
                </div>
                <div class="data-row compact">
                     <span class="key">FRAME_TIME</span>
                     <span class="val">{{ frameTime() }}ms</span>
                </div>
                <!-- Mini Graph -->
                <svg class="mini-graph" viewBox="0 0 100 20" preserveAspectRatio="none">
                     <path [attr.d]="fpsPath()" vector-effect="non-scaling-stroke" stroke="var(--c-1)" fill="none" stroke-width="1"/>
                </svg>
            </div>
        </div>

        <!-- RIGHT COLUMN: AI & IO -->
        <div class="hud-column right">
            
            <!-- AI OVERMIND (Primary Focus) -->
            <div class="hud-block ai-block" [class.active]="connectionStatus() === 'CONNECTED'">
                 <div class="ai-header-row">
                    <div class="status-indicator" 
                         [class.on]="connectionStatus() === 'CONNECTED'"
                         [class.warn]="connectionStatus() === 'RECONNECTING'"></div>
                    <span class="ai-title">AI_OVERMIND</span>
                    <span class="ai-state">[{{ vibeState() }}]</span>
                 </div>
                 <div class="ai-terminal">
                    <span class="prompt">></span>
                    <span class="cmd">{{ aiDirective() }}</span>
                    <span class="cursor">_</span>
                 </div>
            </div>

            <!-- AUDIO & INPUT (Grouped) -->
            <div class="hud-block io-block">
                 <div class="block-header">:: I/O_STREAM</div>
                 <div class="data-row">
                    <span class="key">AUDIO_IN</span>
                    <span class="val highlight">{{ audioMeta().device_name || 'NO_SIGNAL' }}</span>
                 </div>
                 <div class="data-row">
                    <span class="key">BPM_SYNC</span>
                    <span class="val">{{ bpm() || '--' }}</span>
                 </div>
                 <!-- VU Meter -->
                 <div class="vu-strip">
                     <div class="vu-level" [style.width.%]="(vibeEnergy()||0)*100"></div>
                 </div>
                 
                 <div class="separator"></div>

                 <!-- CONTROLLER VISUALIZER -->
                 <div class="controller-viz-container" [style.opacity]="gp().connected ? 1 : 0.3">
                    <app-controller-visualizer></app-controller-visualizer>
                 </div>
            </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none; z-index: 9000;
        font-family: 'JetBrains Mono', monospace; /* Ensure Mono font */
        color: rgba(255, 255, 255, 0.85);
        overflow: hidden;
    }

    /* CONTAINER */
    .hud-layout {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%; height: 100%;
        padding: 24px;
        box-sizing: border-box;
    }

    /* COLUMNS */
    .hud-column {
        display: flex; flex-direction: column; gap: 16px;
        width: 240px;
    }

    /* BRANDING */
    .branding-lockup {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 24px;
        opacity: 0.8;
    }
    .brand-text { display: flex; flex-direction: column; }
    .main-title { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 14px; letter-spacing: 2px; color: #fff; }
    .sub-title { font-size: 9px; letter-spacing: 1px; color: var(--c-1); }

    /* GENERIC BLOCKS */
    .hud-block {
        background: rgba(10, 10, 12, 0.6);
        border-left: 2px solid rgba(255, 255, 255, 0.1);
        padding: 12px;
        backdrop-filter: blur(4px);
    }
    .block-header {
        font-size: 10px; color: var(--c-2); font-weight: 700; letter-spacing: 1px;
        margin-bottom: 12px; text-transform: uppercase;
    }

    /* DATA ROWS */
    .data-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 6px; font-size: 11px;
    }
    .data-row.compact { margin-bottom: 0px; }
    .key { color: #666; font-size: 10px; }
    .val { color: #eee; font-weight: 500; }
    .val.highlight { color: var(--c-1); max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* BARS */
    .bar-mini { width: 60px; height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
    .fill { height: 100%; background: #555; transition: width 0.2s; }
    .fill.warn { background: var(--c-2); }
    .fill.crit { background: var(--c-3); }

    /* PERF SPECIFIC */
    .fps-display { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
    .fps-num { font-size: 32px; font-weight: 300; line-height: 1; color: #fff; }
    .fps-unit { font-size: 10px; color: #666; }
    .mini-graph { width: 100%; height: 20px; margin-top: 8px; opacity: 0.5; }

    /* AI BLOCK */
    .ai-block { border-left-color: var(--c-1); }
    .ai-block.active { border-left-color: #0f0; background: rgba(0, 20, 0, 0.3); }
    .ai-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .status-indicator { width: 6px; height: 6px; background: #444; border-radius: 50%; }
    .status-indicator.on { background: #0f0; box-shadow: 0 0 6px #0f0; }
    .status-indicator.warn { background: #fa0; animation: blink 1s infinite; }
    .ai-title { font-size: 11px; font-weight: 700; color: #fff; }
    .ai-state { font-size: 9px; color: #888; margin-left: auto; }
    
    .ai-terminal {
        background: rgba(0,0,0,0.5); padding: 8px; font-size: 11px; color: var(--c-1);
        min-height: 36px; display: flex; align-items: center;
        font-family: 'JetBrains Mono', monospace;
    }
    .prompt { margin-right: 6px; color: #666; }
    .cursor { animation: blink 1s infinite; }

    /* I/O SPECIFIC */
    .vu-strip { width: 100%; height: 2px; background: #222; margin: 8px 0; }
    .vu-level { height: 100%; background: linear-gradient(90deg, var(--c-1), var(--c-3)); transition: width 0.05s; }
    .separator { height: 1px; background: #333; margin: 12px 0; }
    
    .controller-viz-container {
        width: 100%;
        height: 120px; /* Force height */
        margin-top: 10px;
        transition: opacity 0.3s;
    }

    /* ANIMATIONS */
    @keyframes blink { 50% { opacity: 0; } }
    .hud-layer { opacity: 0; transition: opacity 0.5s; }
    .hud-layer.visible { opacity: 1; }
    
    .scanline {
        position: absolute; inset: 0;
        background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%);
        background-size: 100% 3px; z-index: -1; pointer-events: none;
    }
    .vignette {
        position: absolute; inset: 0;
        background: radial-gradient(circle, transparent 50%, #000 100%);
        z-index: -2; pointer-events: none; opacity: 0.6;
    }
  `]
})
export class HudComponent {
  private readonly inputService = inject(InputManagerService);

  // Base Signals
  readonly isVisible = this.inputService.hudVisible;
  readonly fps = this.inputService.fps;
  readonly bpm = this.inputService.bpm;
  readonly systemStats = this.inputService.systemStats;
  readonly audioMeta = this.inputService.audioMeta;
  readonly aiTheme = this.inputService.aiTheme;
  readonly aiDirective = this.inputService.aiDirective;
  readonly gp = this.inputService.gamepadState;
  readonly vector = this.inputService.lastVector;
  readonly vibeState = this.inputService.vibeState;
  readonly genre = this.inputService.genre;
  readonly confidence = this.inputService.humanConfidence;
  readonly connectionStatus = this.inputService.connectionStatus;

  // Computed
  readonly memUsage = computed(() => {
     const s = this.systemStats();
     if (!s || !s.memory_total) return 0;
     return Math.round((s.memory_used / s.memory_total) * 100);
  });
  
  readonly globalState = this.inputService.globalState; // Expose global state for energy

  // Real energy derived from GlobalState
  readonly vibeEnergy = computed(() => {
      const state = this.globalState();
      // Average of energy bands or just mid/high for visual kick
      return (state.low_energy + state.mid_energy + state.high_energy) / 3; 
  });
  
  readonly vibeFlux = computed(() => this.globalState().spectral_flux);

  // FPS History Graph
  // We need to access the history array. InputService has `frameTimeHistory`.
  // Wait, `fpsHistory` was added to InputService in Step 202.
  readonly fpsGraphData = this.inputService.fpsHistory; // Assume it's populated
  
  readonly fpsPath = computed(() => {
      // Generate SVG Path
      const hist = this.fpsGraphData(); // Array of FPS values
      if (!hist || hist.length === 0) return 'M0,40 L100,40';
      
      const width = 100;
      const height = 40;
      const step = width / (hist.length - 1 || 1);
      
      // Normalize: 0 FPS = height (40), 144 FPS = 0
      const getY = (val: number) => {
          const norm = Math.min(1, Math.max(0, val / 144));
          return height - (norm * height);
      };

      let d = `M0,${getY(hist[0])}`;
      for (let i = 1; i < hist.length; i++) {
          d += ` L${i * step},${getY(hist[i])}`;
      }
      return d;
  });

  readonly fpsFill = computed(() => {
       const path = this.fpsPath();
       return `${path} L100,40 L0,40 Z`;
  });

  readonly frameTime = computed(() => {
      const f = this.fps();
      if (f <= 0) return '0.0';
      return (1000 / f).toFixed(1);
  });

  formatUptime(sec: number): string {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return `${h}h ${m}m`;
  }
}

