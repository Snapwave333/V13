import { Injectable, NgZone, signal, WritableSignal, computed, OnDestroy } from '@angular/core';

export interface GamepadState {
  connected: boolean;
  id: string;
  timestamp: number;
}

export interface GlobalState {
    bpm: number;
    phase: number;
    energy: number;
    bass: number;
    mid: number;
    high: number;
    genre: string;
    state: string;
    low_energy: number;
    mid_energy: number;
    high_energy: number;
    spectral_flux: number; // NEW
    // AI Context
    ai_theme: string;
    ai_primary_color: string;
    ai_secondary_color: string;
    ai_directive: string;
    system_stats: {
        cpu_usage: number;
        memory_used: number;
        memory_total: number;
        uptime: number;
    };
    audio_meta: {
        device_name: string;
        sample_rate: number;
        channels: number;
        peak?: number;
        rms?: number;
    };
}

export interface HybridControlState {
    camX: number;
    camY: number;
    camZ: number;
    scale: number;
    intensity: number;
    glitch: number;
    mode: 'AUTOPILOT' | 'MANUAL' | 'GHOST';
    confidence: number;
}

// Internal vector for reusing memory
interface InputVector {
    orbitalX: number; // Left Stick X
    orbitalY: number; // Left Stick Y
    zoom: number;     // Right Stick Y
    intFade: number;  // LT
    intBlow: number;  // RT
    glitch: number;   // A Button
    swap: boolean;    // X Button
    hud: boolean;     // D-Pad Up
    chaos: boolean;   // D-Pad Down
}

@Injectable({
  providedIn: 'root'
})
export class InputManagerService implements OnDestroy {
  // Signals for UI (HUD)
  public readonly gamepadState: WritableSignal<GamepadState> = signal({ connected: false, id: '', timestamp: 0 });
  public readonly humanConfidence: WritableSignal<number> = signal(0);
  public readonly hudVisible: WritableSignal<boolean> = signal(true); // Default visible
  public readonly exitModalVisible: WritableSignal<boolean> = signal(false);
  public readonly settingsModalVisible: WritableSignal<boolean> = signal(false);
  
  // Dynamic Button Mapping
  public readonly buttonMapping = signal<Record<string, number>>({
      'GLITCH': 0, // A
      'SWAP': 2,   // X
      'HUD_TOGGLE': 12, // D-Pad Up
      'CHAOS': 13,  // D-Pad Down
      'EXIT_MODAL': 9, // Menu (3 lines)
      'SETTINGS_MODAL': 8, // View (2 squares)
      'CANCEL': 1 // B
  });

  public readonly remappingAction = signal<string | null>(null);
  
  // Telemetry Signals (Updated by WebSocket/GhostMode)
  public readonly globalState: WritableSignal<GlobalState>;
  public readonly connectionStatus: WritableSignal<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'> = signal('DISCONNECTED');
  
  // HUD-specific shortcuts (derived or direct update)
  public readonly fps: WritableSignal<number> = signal(0);
  public readonly fpsHistory: WritableSignal<number[]> = signal([]);
  public readonly lastVector: WritableSignal<{x:number, y:number, z:number}> = signal({x:0, y:0, z:0});

  // Computed State Shortcuts
  public readonly bpm = computed(() => this.globalState().bpm);
  public readonly genre = computed(() => this.globalState().genre);
  public readonly vibeState = computed(() => this.globalState().state);
  public readonly aiTheme = computed(() => this.globalState().ai_theme);
  public readonly aiDirective = computed(() => this.globalState().ai_directive);
  public readonly systemStats = computed(() => this.globalState().system_stats);
  public readonly audioMeta = computed(() => this.globalState().audio_meta);
  
  // Internal State
  private readonly DEFAULT_STATE: GlobalState = {
      bpm: 0, phase: 0, energy: 0, bass: 0, mid: 0, high: 0,
      genre: 'OFFLINE', state: 'DISCONNECTED',
      low_energy: 0, mid_energy: 0, high_energy: 0, spectral_flux: 0,
      ai_theme: 'OFFLINE', ai_primary_color: '#1a1a1a', ai_secondary_color: '#0a0a0a', ai_directive: 'AWAITING_UPLINK',
      system_stats: { cpu_usage: 0, memory_used: 0, memory_total: 0, uptime: 0 },
      audio_meta: { device_name: 'NONE', sample_rate: 0, channels: 0 }
  };

  private readonly currentInput: InputVector = {
      orbitalX: 0, orbitalY: 0, zoom: 0, intFade: 0, intBlow: 0, glitch: 0, swap: false, hud: false, chaos: false
  };
  
  private lastInputTime = 0;
  private confidence = 0; // 0.0 to 1.0
  private readonly HOLD_TIME = 5000;
  private readonly DECAY_TIME = 2000;
  
  private gamepadIndex: number | null = null;
  private animationId = 0;
  private telemetryInterval: any;
  private readonly abortController = new AbortController();

  private readonly boundOnGamepadConnected = this.onGamepadConnected.bind(this);
  private readonly boundOnGamepadDisconnected = this.onGamepadDisconnected.bind(this);

  // WebSocket / Ghost State
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: any; // NodeJS.Timeout or number
  private readonly MAX_RECONNECT_DELAY = 8000;

  constructor(private readonly ngZone: NgZone) {
    this.globalState = signal(this.DEFAULT_STATE);
    this.initListeners();
    this.initWebSocket();
    
    // Start Input Polling
    this.ngZone.runOutsideAngular(() => {
        this.pollInputs();
        this.startVisualTelemetry();
    });
  }

  private startVisualTelemetry() {
      // Send telemetry every 2 seconds
      this.telemetryInterval = setInterval(() => {
          const metrics = {
              fps: this.fps(),
              resolution: `${globalThis.innerWidth}x${globalThis.innerHeight}`
          };
          
          fetch('http://localhost:3001/api/v1/telemetry/visual', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metrics),
              signal: this.abortController.signal
          }).catch(err => {
              if (err.name !== 'AbortError') {
                  console.debug('Telemetry sync failed', err);
              }
          });
      }, 2000);
  }

  private initListeners() {
    globalThis.addEventListener('gamepadconnected', this.boundOnGamepadConnected as EventListener);
    globalThis.addEventListener('gamepaddisconnected', this.boundOnGamepadDisconnected as EventListener);
    
    // Keyboard Shortcuts
    globalThis.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'h') {
            this.ngZone.run(() => this.hudVisible.update(v => !v));
        }
        if (e.key.toLowerCase() === 'm') {
            this.ngZone.run(() => this.settingsModalVisible.update(v => !v));
        }
    });
  }

  private onGamepadConnected(e: GamepadEvent) {
    console.log('Gamepad connected:', e.gamepad.id);
    this.gamepadIndex = e.gamepad.index;
    this.gamepadState.set({
        connected: true,
        id: e.gamepad.id,
        timestamp: Date.now()
    });
  }

  private onGamepadDisconnected(e: GamepadEvent) {
    console.log('Gamepad disconnected:', e.gamepad.id);
    if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.gamepadState.set({
            connected: false,
            id: '',
            timestamp: Date.now()
        });
        this.lastInputTime = 0; 
    }
  }

  ngOnDestroy() {
      // 1. Clear WebSocket
      if (this.ws) {
          this.ws.close();
      }
      if (this.reconnectTimeout) {
          globalThis.clearTimeout(this.reconnectTimeout);
      }

      // 2. Clear Listeners
      globalThis.removeEventListener('gamepadconnected', this.boundOnGamepadConnected as EventListener);
      globalThis.removeEventListener('gamepaddisconnected', this.boundOnGamepadDisconnected as EventListener);

      // 3. Stop Audio/Input Loops
      if (this.animationId) {
          cancelAnimationFrame(this.animationId);
      }
      if (this.telemetryInterval) {
          clearInterval(this.telemetryInterval);
      }

      // 4. Abort pending requests
      this.abortController.abort();

      console.log('[NEON_TERMINAL] Service Resources Purged');
  }

  // --- WebSocket Logic ---

  private initWebSocket() {
      const host = 'localhost:3001';
      this.ws = new WebSocket(`ws://${host}/ws`);
      
      this.ws.onopen = () => {
          console.log('[NEON_TERMINAL] Link Established');
          this.connectionStatus.set('CONNECTED');
          this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
          try {
              const data: GlobalState = JSON.parse(event.data);
              this.globalState.set(data);
          } catch (e) {
              console.error('WS Parse Error', e);
          }
      };
      
      this.ws.onclose = () => {
          this.handleDisconnect('Connection Closed');
      };

      this.ws.onerror = () => {
         console.warn('[NEON_TERMINAL] Link Error');
      };
  }

  private handleDisconnect(reason: string) {
      console.warn(`[NEON_TERMINAL] ${reason} - Signal Lost`);
      this.connectionStatus.set('DISCONNECTED');
      this.ws = null;
      
      this.globalState.set(this.DEFAULT_STATE);

      // Exponential Backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY);
      console.log(`[NEON_TERMINAL] Retrying in ${delay}ms (Attempt ${this.reconnectAttempts + 1})`);
      
      this.reconnectTimeout = globalThis.setTimeout(() => {
          this.reconnectAttempts++;
          this.connectionStatus.set('RECONNECTING');
          this.initWebSocket();
      }, delay);
  }

  // --- Input Polling ---

  private pollInputs() {
      const loop = () => {
          this.animationId = requestAnimationFrame(loop);
          
          if (this.gamepadIndex !== null) {
            const gps = navigator.getGamepads();
            const gp = gps[this.gamepadIndex];
            
            if (gp) {
                this.processGamepad(gp);
            }
          }
          this.updateConfidence();
      };
      
      requestAnimationFrame(loop);
  }

  private processGamepad(gp: Gamepad) {
      const { lx, ly, lMag } = this.handleStickInput(gp.axes[0], gp.axes[1], true);
      const { ry } = this.handleStickInput(0, gp.axes[3], false);
      
      const lt = gp.buttons[6].value;
      const rt = gp.buttons[7].value;
      const btnA = gp.buttons[0].pressed;
      
      const mapping = this.buttonMapping();
      
      if (this.handleRemappingMode(gp)) return;

      const actions = this.getActionsFromMapping(gp, mapping);
      const hasInput = this.checkGamepadActivity(lMag, ry, lt, rt, gp.buttons);

      if (hasInput) {
          this.lastInputTime = Date.now();
          this.confidence = 1;
          this.ngZone.run(() => this.humanConfidence.set(1));
      }

      this.updateInputStates(lx, ly, ry, lt, rt, actions);
      this.handleModalInteractions(actions, btnA);
      
      this.currentInput.hud = actions.hudToggle;
      this.currentInput.chaos = actions.chaos;
  }

  private handleStickInput(axisX: number, axisY: number, isLeft: boolean): any {
      const DEADZONE = 0.15;
      let x = axisX;
      let y = axisY * -1;
      
      if (isLeft) {
          const lMag = Math.hypot(x, y);
          if (lMag < DEADZONE) {
              return { lx: 0, ly: 0, lMag: 0 };
          }
          const normalizedMag = (lMag - DEADZONE) / (1 - DEADZONE);
          const scale = normalizedMag / lMag;
          return { lx: x * scale, ly: y * scale, lMag };
      } else {
          const rMag = Math.abs(y);
          if (rMag < DEADZONE) {
              return { ry: 0 };
          }
          const sign = Math.sign(y);
          const nMag = (rMag - DEADZONE) / (1 - DEADZONE);
          return { ry: sign * nMag };
      }
  }

  private handleRemappingMode(gp: Gamepad): boolean {
      if (this.remappingAction()) {
          for (let i = 0; i < gp.buttons.length; i++) {
              if (gp.buttons[i].pressed) {
                  const action = this.remappingAction()!;
                  this.ngZone.run(() => {
                      this.buttonMapping.update(m => ({ ...m, [action]: i }));
                      this.remappingAction.set(null);
                  });
                  return true;
              }
          }
      }
      return false;
  }

  private getActionsFromMapping(gp: Gamepad, mapping: Record<string, number>) {
      return {
          menu: gp.buttons[mapping['EXIT_MODAL']].pressed,
          view: gp.buttons[mapping['SETTINGS_MODAL']].pressed,
          hudToggle: gp.buttons[mapping['HUD_TOGGLE']].pressed,
          chaos: gp.buttons[mapping['CHAOS']].pressed,
          glitch: gp.buttons[mapping['GLITCH']].pressed,
          swap: gp.buttons[mapping['SWAP']].pressed,
          cancel: gp.buttons[mapping['CANCEL']].pressed
      };
  }

  private checkGamepadActivity(lMag: number, ry: number, lt: number, rt: number, buttons: readonly GamepadButton[]): boolean {
      const basicMove = lMag > 0.01 || Math.abs(ry) > 0.01 || lt > 0.01 || rt > 0.01;
      if (basicMove) return true;
      // Index 0-3 are A,B,X,Y
      return buttons[0].pressed || buttons[1].pressed || buttons[2].pressed || buttons[3].pressed || 
             buttons[8].pressed || buttons[9].pressed || buttons[12].pressed || buttons[13].pressed;
  }

  private updateInputStates(lx: number, ly: number, ry: number, lt: number, rt: number, actions: any) {
      this.currentInput.orbitalX = lx;
      this.currentInput.orbitalY = ly;
      this.currentInput.zoom = ry;
      this.currentInput.intFade = lt;
      this.currentInput.intBlow = rt;
      this.currentInput.glitch = actions.glitch ? 1 : 0;
      this.currentInput.swap = actions.swap;

      if (actions.hudToggle && !this.currentInput.hud) {
          this.ngZone.run(() => this.hudVisible.update(v => !v));
      }
  }

  private handleModalInteractions(actions: any, btnA: boolean) {
      if (actions.menu && !this.lastMenuState) {
          this.ngZone.run(() => this.exitModalVisible.update(v => !v));
      }
      this.lastMenuState = actions.menu;

      if (actions.view && !this.lastViewState) {
          this.ngZone.run(() => this.settingsModalVisible.update(v => !v));
      }
      this.lastViewState = actions.view;

      if (this.exitModalVisible()) {
          if (btnA && !this.lastAState) {
              console.log('[NEON_TERMINAL] Confirming Exit...');
              if (window.electron) {
                  window.electron.close();
              } else {
                  console.warn('[NEON_TERMINAL] Electron bridge missing, fallback close blocked.');
              }
          }
          if (actions.cancel && !this.lastBState) {
              this.ngZone.run(() => this.exitModalVisible.set(false));
          }
      }
      
      if (this.settingsModalVisible()) {
          if (actions.cancel && !this.lastBState) {
              this.ngZone.run(() => {
                  this.settingsModalVisible.set(false);
                  this.remappingAction.set(null);
              });
          }
      }

      this.lastAState = btnA;
      this.lastBState = actions.cancel;
  }

  private lastMenuState = false;
  private lastViewState = false;
  private lastAState = false;
  private lastBState = false;

  private updateConfidence() {
      const now = Date.now();
      const timeSinceInput = now - this.lastInputTime;
      
      if (timeSinceInput > this.HOLD_TIME) {
          const decayProgress = (timeSinceInput - this.HOLD_TIME) / this.DECAY_TIME;
          this.confidence = Math.max(0, 1 - decayProgress);
      }
      
      if (Math.random() < 0.1) { 
          this.ngZone.run(() => this.humanConfidence.set(this.confidence));
      }
  }

  // --- The Mixer ---
  // Called by Renderer every frame

  // Store previous auto values for smoothing
  private smoothAutoCamX = 0;
  private smoothAutoCamY = 0;
  private smoothAutoCamZ = -3;

  public getBlendedValues(autoState: GlobalState): HybridControlState {
      // 1. Human Inputs (already processed)
      const yaw = this.currentInput.orbitalX * Math.PI;
      const pitch = this.currentInput.orbitalY * (Math.PI / 2.5);
      const dist = 3;

      const humanCamX = Math.sin(yaw) * Math.cos(pitch) * dist;
      const humanCamY = Math.sin(pitch) * dist;
      const humanCamZ = Math.cos(yaw) * Math.cos(pitch) * dist - 3; 

      const humanScaleOffset = this.currentInput.zoom * 2;
      const humanIntensity = 1 - this.currentInput.intFade + (this.currentInput.intBlow * 10);
      const humanGlitch = this.currentInput.glitch;

      // 2. Autopilot Logic (Genre-Reactive)
      const t = Date.now() / 1000;
      
      // --- THE ENTROPY WATCHDOG (Anti-Boredom) ---
      this.monitorBoredom(t);
      // -------------------------------------------
      
      const genre = autoState.genre || 'Unknown';
      const target = this.computeAutoTarget(genre, t, autoState);

      // 2.5 SMOOTHING (Dampening)
      let smoothFactor = 0.05; 
      if (genre === 'DnB' || genre === 'Dubstep') smoothFactor = 0.4; 
      if (genre === 'Ambient') smoothFactor = 0.02; 
      if (genre === 'Techno') smoothFactor = 0.1; 

      this.smoothAutoCamX = this.lerp(this.smoothAutoCamX, target.camX, smoothFactor);
      this.smoothAutoCamY = this.lerp(this.smoothAutoCamY, target.camY, smoothFactor);
      this.smoothAutoCamZ = this.lerp(this.smoothAutoCamZ, target.camZ, smoothFactor);

      // 3. Blending (The Crossfader)
      const c = this.confidence;
      
      const finalX = this.lerp(this.smoothAutoCamX, humanCamX, c);
      const finalY = this.lerp(this.smoothAutoCamY, humanCamY, c);
      const finalZ = this.lerp(this.smoothAutoCamZ, humanCamZ, c);
      const finalScale = this.lerp(target.scale, humanScaleOffset, c);
      const finalInt = this.lerp(target.intensity, humanIntensity, c);
      const finalGlitch = this.lerp(target.glitch, humanGlitch, c);

      // Update Telemetry Signal (throttled)
      if (Math.random() < 0.05) {
          this.ngZone.run(() => this.lastVector.set({x: finalX, y: finalY, z: finalZ}));
      }

      return {
          camX: finalX,
          camY: finalY,
          camZ: finalZ,
          scale: finalScale, 
          intensity: finalInt,
          glitch: finalGlitch, 
          mode: (c > 0 ? 'MANUAL' : 'AUTOPILOT'),
          confidence: c
      };
  }

  private computeAutoTarget(genre: string, t: number, autoState: GlobalState) {
      let camX = 0;
      let camY = 0;
      let camZ = -3;
      let scale = 0;
      let glitch = 0;
      let intensity = 1;

      switch (genre) {
          case 'DnB':
              camX = Math.sin(t * 2) * 0.5;
              camY = Math.cos(t * 3) * 0.2;
              glitch = (Math.sin(t * 10) > 0.8) ? 0.3 : 0; 
              if (autoState.low_energy > 0.8) glitch = 1;
              break;
              
          case 'Techno':
              camX = Math.sin(t * 0.5) * 2;
              camZ = -3 + Math.cos(t * 0.5) * 1; 
              if (autoState.high_energy > 0.7) intensity = 1.5; 
              break;
              
          case 'Ambient':
              camX = Math.sin(t * 0.1) * 1.5;
              camY = Math.sin(t * 0.15) * 0.8;
              camZ = -3 + Math.sin(t * 0.05) * 2; 
              scale = Math.sin(t * 0.05) * 0.5;
              intensity = 0.8; 
              break;
              
          case 'Dubstep':
               if (autoState.low_energy > 0.6) {
                   camX = (Math.random() - 0.5) * 0.4;
                   camY = (Math.random() - 0.5) * 0.4;
                   glitch = 0.8;
               } else {
                   camX = Math.sin(t * 0.5);
               }
               break;

          default:
              camX = Math.sin(t * 0.2) * 0.2;
      }
      
      if (autoState.state === 'Chaos') {
          glitch = 1;
      }

      return { camX, camY, camZ, scale, glitch, intensity };
  }
  
  private lerp(a: number, b: number, t: number): number {
      return a + (b - a) * t;
  }

  // --- ENTROPY WATCHDOG ---
  private lastSignificantEventTime = Date.now();
  private lastWatchdogPos = { x: 0, y: 0, z: 0 };
  private isChaosActive = false;
  private lastTelemetrySend = 0;

  private monitorBoredom(t: number) {
      // 1. Check AI Directive for Orders
      const currentState = this.globalState();
      if (currentState.ai_directive === 'CHAOS_INJECTION' && !this.isChaosActive) {
          this.injectChaos();
      }

      if (this.confidence > 0.1 || this.gamepadIndex !== null) {
          this.lastSignificantEventTime = Date.now();
          this.sendBoredomTelemetry(0);
          return;
      }

      // 2. Calculate Delta
      const curr = { x: this.smoothAutoCamX, y: this.smoothAutoCamY, z: this.smoothAutoCamZ };
      const dist = Math.sqrt(
          Math.pow(curr.x - this.lastWatchdogPos.x, 2) +
          Math.pow(curr.y - this.lastWatchdogPos.y, 2) + 
          Math.pow(curr.z - this.lastWatchdogPos.z, 2)
      );

      // 3. Check Variance
      if (dist > 0.5) { // Significant movement
          this.lastSignificantEventTime = Date.now();
          this.lastWatchdogPos = curr;
          this.sendBoredomTelemetry(0);
      } else {
          // 4. Calculate Boredom Score (12s threshold)
          const elapsed = Date.now() - this.lastSignificantEventTime;
          const score = Math.min(elapsed / 12000, 1);
          
          this.sendBoredomTelemetry(score);
      }
  }

  private sendBoredomTelemetry(score: number) {
      const now = Date.now();
      if (now - this.lastTelemetrySend > 1000) { // 1Hz throttle
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ boredom_score: score }));
              this.lastTelemetrySend = now;
          }
      }
  }

  private injectChaos() {
      console.log('[WATCHDOG] 🤖 AI COMMAND: CHAOS INJECTION RECEIVED');
      
      this.isChaosActive = true;
      
      // 1. Hard Camera Cut (Random Octant)
      this.smoothAutoCamX = (Math.random() - 0.5) * 8; // Wider range
      this.smoothAutoCamY = (Math.random() - 0.5) * 6;
      this.smoothAutoCamZ = -2 - Math.random() * 6;
      
      // 2. Maximize Glitch
      this.currentInput.glitch = 1;
      this.currentInput.intBlow = 1;
      
      globalThis.setTimeout(() => {
          this.currentInput.glitch = 0;
          this.currentInput.intBlow = 0;
          this.isChaosActive = false;
          // Artificial "Movement" to reset boredom timer locally so we don't spam
          this.lastSignificantEventTime = Date.now(); 
      }, 800);
  }
}
