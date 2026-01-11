import { Component, ElementRef, ViewChild, AfterViewInit, NgZone, signal, OnDestroy, inject, ChangeDetectionStrategy, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputManagerService } from '../services/input-manager.service';
import { HudComponent } from '../components/hud/hud.component';
import { OracleGenerator } from '../services/oracle-generator';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HudComponent],
  template: `
    <div class="visualizer-container">
      <canvas #canvas></canvas>
      
      <!-- HUD -->
      <app-hud *ngIf="systemReady()"></app-hud>
      
      <!-- BOOT TITLE CARD OVERLAY -->
      <div *ngIf="showTitle()" class="boot-text-overlay">
          <div class="oracle-text">{{ bootTitle() }}</div>
      </div>

      <!-- BOOT / START OVERLAY (Black Screen) -->
      <div *ngIf="!systemReady()" class="boot-overlay" (click)="startSystem()">
         <!-- Black screen waiting for interaction -->
      </div>

      <!-- GPU CRASH OVERLAY -->
      <div *ngIf="gpuCrash()" class="crash-overlay">
          <div class="terminal-text crit">
              <h1>GPU CORE DUMP</h1>
              <p>WEBGL_CONTEXT_LOST</p>
              <p>RESTORING SYSTEM...</p>
          </div>
      </div>

      <!-- DEBUG ERROR OVERLAY -->
      <div *ngIf="errorLog()" class="crash-overlay" style="background: rgba(50,0,0,1); z-index: 10001;">
          <div class="terminal-text crit">
              <h1>CRITICAL FAILURE</h1>
              <pre style="white-space: pre-wrap; font-size: 0.8rem;">{{ errorLog() }}</pre>
          </div>
        <!-- EXIT TO DESKTOP MODAL -->
      <div *ngIf="exitModalVisible()" class="exit-modal-overlay">
          <div class="exit-modal-content">
              <div class="terminal-text">
                  <h1 class="crit blink-fast">TERMINATION SEQUENCE</h1>
                  <p class="modal-sub">SHUTDOWN CURRENT INSTANCE?</p>
                  
                  <div class="modal-actions">
                      <div class="action-btn confirm" (click)="confirmExit()">
                          <span class="key-hint">A</span> CONTINUE
                      </div>
                      <div class="action-btn cancel" (click)="cancelExit()">
                          <span class="key-hint">B</span> CANCEL
                      </div>
                  </div>

                  <div class="controller-hint">USE XBOX CONTROLLER BUTTONS TO DECIDE</div>
              </div>
          </div>
      </div>

      <!-- ADVANCED BUTTON REMAPPING MODAL (Settings) -->
      <div *ngIf="settingsModalVisible()" class="settings-modal-overlay">
          <div class="settings-modal-content">
              <div class="terminal-text">
                  <h1 class="accent blink">INPUT CONFIGURATION</h1>
                  <p class="modal-sub">REMAP CONTROLLER BUTTONS</p>

                  <div class="mapping-list">
                      <div *ngFor="let action of remappableActions" class="mapping-item" 
                           [class.active]="remappingAction() === action"
                           (click)="startRemap(action)">
                          <span class="action-name">{{ action }}</span>
                          <span class="mapping-value">
                              {{ remappingAction() === action ? 'PRESS ANY BUTTON...' : 'INDEX ' + buttonMapping()[action] }}
                          </span>
                      </div>
                  </div>

                  <div class="modal-actions" style="margin-top: 40px;">
                      <div class="action-btn cancel" (click)="closeSettings()">
                          <span class="key-hint">B</span> BACK / CLOSE
                      </div>
                  </div>

                  <div class="controller-hint">SELECT AN ACTION TO REBIND</div>
              </div>
          </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #000;
      font-family: 'JetBrains Mono', monospace;
    }
    .visualizer-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .boot-overlay, .crash-overlay, .boot-text-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none; /* Allow click through for some, but handled by refs */
    }
    .boot-overlay {
        background: black;
        pointer-events: auto;
        z-index: 9999;
        cursor: pointer;
    }
    .crash-overlay {
        background: rgba(50, 0, 0, 0.9);
        z-index: 10000;
        cursor: wait;
        pointer-events: auto;
    }
    .boot-text-overlay {
        position: absolute;
        top: 20%;
        width: 100%;
        height: auto;
        justify-content: center;
        z-index: 500;
    }
    .oracle-text {
        font-size: 2rem;
        color: #0ff;
        text-shadow: 0 0 10px #0ff;
        background: rgba(0,0,0,0.5);
        padding: 10px 20px;
        border: 1px solid #0ff;
        letter-spacing: 4px;
    }
    .terminal-text {
        color: #0f0;
        text-shadow: 0 0 10px #0f0;
        font-size: 1.2rem;
        line-height: 1.5;
    }
    .warn { color: yellow; text-shadow: 0 0 10px yellow; }
    .crit { color: red; text-shadow: 0 0 10px red; }
    .blink { animation: blink 1s step-end infinite; }
    .blink-fast { animation: blink 0.1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }

    /* EXIT MODAL STYLES */
    .exit-modal-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        backdrop-filter: blur(10px);
        pointer-events: auto;
    }
    .exit-modal-content {
        background: rgba(0, 10, 10, 0.95);
        border: 2px solid #f00;
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
        padding: 60px;
        text-align: center;
        min-width: 500px;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-sub {
        font-size: 1.5rem;
        letter-spacing: 2px;
        margin: 20px 0 40px;
        color: #f66;
    }
    .modal-actions {
        display: flex;
        gap: 40px;
        justify-content: center;
    }
    .action-btn {
        padding: 15px 40px;
        border: 1px solid #aaa;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 15px;
        font-weight: bold;
        transition: all 0.2s;
    }
    .key-hint {
        background: #fff;
        color: #000;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 0.9rem;
    }
    .confirm:hover {
        background: #f00;
        color: white;
        border-color: #f00;
    }
    .cancel:hover {
        background: #444;
        color: white;
    }
    .controller-hint {
        margin-top: 40px;
        font-size: 0.8rem;
        opacity: 0.6;
        color: #fff;
    }
    @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    /* SETTINGS MODAL STYLES */
    .settings-modal-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        backdrop-filter: blur(15px);
        pointer-events: auto;
    }
    .settings-modal-content {
        background: rgba(5, 5, 20, 0.95);
        border: 2px solid #0ff;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        padding: 50px;
        text-align: center;
        min-width: 600px;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .accent { color: #0ff; text-shadow: 0 0 10px #0ff; }
    
    .mapping-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        max-height: 400px;
        overflow-y: auto;
        padding-right: 10px;
        text-align: left;
    }
    .mapping-item {
        background: rgba(0, 255, 255, 0.05);
        border: 1px solid rgba(0, 255, 255, 0.2);
        padding: 15px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    .mapping-item:hover {
        background: rgba(0, 255, 255, 0.15);
        border-color: #0ff;
    }
    .mapping-item.active {
        background: rgba(255, 0, 255, 0.2);
        border-color: #f0f;
        box-shadow: 0 0 15px #f0f;
    }
    .action-name {
        font-weight: bold;
        letter-spacing: 1px;
        color: #fff;
    }
    .mapping-value {
        color: #0ff;
        font-family: inherit;
    }
    .mapping-item.active .mapping-value {
        color: #f0f;
        animation: blink-fast 0.2s step-end infinite;
    }
  `]
})
export class VisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private readonly inputService = inject(InputManagerService);
  
  // UI State
  public readonly systemReady = signal(false);
  public readonly gpuCrash = signal(false);
  public readonly bootTitle = signal('');
  public readonly showTitle = signal(false);
  public readonly exitModalVisible = computed(() => this.inputService.exitModalVisible());
  public readonly settingsModalVisible = computed(() => this.inputService.settingsModalVisible());
  
  // Mapping State
  public readonly buttonMapping = computed(() => this.inputService.buttonMapping());
  public readonly remappingAction = computed(() => this.inputService.remappingAction());
  public readonly remappableActions = ['GLITCH', 'SWAP', 'HUD_TOGGLE', 'CHAOS', 'EXIT_MODAL', 'SETTINGS_MODAL', 'CANCEL'];

  public readonly errorLog = signal<string>('');

  private gl: WebGL2RenderingContext | null = null;
  private program!: WebGLProgram;
  private animationId = 0;
  


  // Uniform Locations
  private uTime!: WebGLUniformLocation;
  private uBootTime!: WebGLUniformLocation; 
  private uResolution!: WebGLUniformLocation;
  private uAudio!: WebGLUniformLocation; 
  private uFeedbackTex!: WebGLUniformLocation;
  
  private uCameraPos!: WebGLUniformLocation;
  private uFractalScale!: WebGLUniformLocation;
  private uGlobalIntensity!: WebGLUniformLocation;
  private uGlitchStrength!: WebGLUniformLocation;

  // Render State
  private startTime = 0; 
  private bootTime = 0;
  private readonly lastOracleType = 0;
  
  private readonly frameTimes: number[] = [];
  
  // DRS State
  private resolutionScale = 1;
  private readonly lastDrsCheck = 0;
  
  // Context Restoration
  private readonly contextLostHandler = (e: Event) => this.onContextLost(e);
  private readonly contextRestoredHandler = (e: Event) => this.onContextRestored(e);

  // Cursor State
  private cursorTimeout: any;

  constructor(private readonly ngZone: NgZone) {
      effect(() => {
          const confidence = this.inputService.humanConfidence();
          // Auto-start on any human input (Click is handled by template, this handles Controller)
          if (confidence > 0 && !this.systemReady()) {
              // Untracked to avoid loops if startSystem touches signals? 
              // startSystem sets systemReady=true, which breaks the condition, so it's safe.
               this.ngZone.run(() => this.startSystem());
          }
      });
  }

  ngAfterViewInit() {
    this.initCursorHandler();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Cleanup Event Listeners
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
        canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
        canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
    }
    globalThis.removeEventListener('resize', this.onResizeBound);
    globalThis.removeEventListener('mousemove', this.onMouseMoveBound);
    globalThis.removeEventListener('keydown', this.onKeyDownBound);
    globalThis.clearTimeout(this.cursorTimeout);


  }

  private initCursorHandler() {
      // Start hidden
      document.body.style.cursor = 'none';
      
      globalThis.addEventListener('mousemove', this.onMouseMoveBound);
      globalThis.addEventListener('keydown', this.onKeyDownBound);
  }

  private readonly onMouseMoveBound = () => this.onMouseMove();
  private readonly onKeyDownBound = (e: KeyboardEvent) => this.onKeyDown(e);

  private onMouseMove() {
      document.body.style.cursor = 'default';
      globalThis.clearTimeout(this.cursorTimeout);
      this.cursorTimeout = globalThis.setTimeout(() => {
          document.body.style.cursor = 'none';
      }, 3000);
  }

  private onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
          console.log('[NEON_TERMINAL] Termination Sequence Initiated...');
          globalThis.close();
      }
      if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
          e.preventDefault();
          this.toggleFullscreen();
      }
  }

  public confirmExit() {
      console.log('[NEON_TERMINAL] Confirming Exit via Click...');
      globalThis.close();
  }

  public cancelExit() {
      this.inputService.exitModalVisible.set(false);
  }

  public closeSettings() {
      this.inputService.settingsModalVisible.set(false);
      this.inputService.remappingAction.set(null);
  }

  public startRemap(action: string) {
      if (this.remappingAction() === action) {
          this.inputService.remappingAction.set(null);
      } else {
          this.inputService.remappingAction.set(action);
      }
  }

  private toggleFullscreen() {
      if (document.fullscreenElement) {
          document.exitFullscreen().then(() => this.resize());
      } else {
          document.documentElement.requestFullscreen().then(() => this.resize());
      }
  }

  public async startSystem() {
      if (this.systemReady()) return;

      console.log('[NEON_TERMINAL] System Engagement...');
      
      this.bootTitle.set(OracleGenerator.generateCinematicTitle());

      this.initWebGL();
      this.initShaders().then(() => {
          this.startTime = Date.now();
          this.bootTime = this.startTime; 
          this.systemReady.set(true); 

          this.ngZone.runOutsideAngular(() => this.render());
      });
      
      globalThis.addEventListener('resize', this.onResizeBound);
  }

  private readonly onResizeBound = () => this.resize();

  private resize() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) return;

    const dpr = globalThis.devicePixelRatio || 1;
    const width = globalThis.innerWidth;
    const height = globalThis.innerHeight;
    
    canvas.width = width * dpr * this.resolutionScale;
    canvas.height = height * dpr * this.resolutionScale;
    
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    if (this.gl) {
      this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  private initWebGL() {
    const canvas = this.canvasRef.nativeElement;
    
    // Context Loss Handling
    canvas.addEventListener('webglcontextlost', this.contextLostHandler, false);
    canvas.addEventListener('webglcontextrestored', this.contextRestoredHandler, false);

    const gl = canvas.getContext('webgl2', { 
        antialias: false, depth: false, alpha: false, preserveDrawingBuffer: false 
    });
    
    if (!gl) {
      console.error('WebGL2 not supported');
      return; 
    }
    
    this.gl = gl;
    this.resize();
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }
  
  private onContextLost(event: Event) {
      event.preventDefault(); 
      console.error('[NEON_TERMINAL] GPU CORE DUMP (Context Lost)');
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.gpuCrash.set(true);
  }

  private onContextRestored(event: Event) {
      console.log('[NEON_TERMINAL] GPU RESTORED');
      this.gpuCrash.set(false);
      this.initWebGL(); 
      this.initShaders().then(() => {
           this.ngZone.runOutsideAngular(() => this.render());
      });
  }

  private async initShaders() {
      try {
          const [vsSource, fsSource] = await Promise.all([
              fetch('assets/shaders/vertex.glsl').then(r => r.text()),
              fetch('assets/shaders/fragment.glsl').then(r => r.text())
          ]);
          this.compileShader(vsSource, fsSource);
      } catch (e) {
          console.error('Shader Load Failed', e);
      }
  }

  private compileShader(vsSource: string, fsSource: string) {
      if (!this.gl) return;
      const gl = this.gl;
      
      const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);
      
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
           const log = gl.getProgramInfoLog(this.program) || 'Unknown Link Error';
           console.error('Link Log:', log);
           this.ngZone.run(() => this.errorLog.set('LINK ERROR: ' + log));
           return;
      }
      
      gl.useProgram(this.program);
      
      // Cache Locations
      this.uTime = gl.getUniformLocation(this.program, 'u_time')!;
      this.uBootTime = gl.getUniformLocation(this.program, 'u_boot_time')!;
      this.uResolution = gl.getUniformLocation(this.program, 'u_resolution')!;
      this.uAudio = gl.getUniformLocation(this.program, 'u_audio')!;
      this.uFeedbackTex = gl.getUniformLocation(this.program, 'u_feedback_texture')!;
      
      this.uCameraPos = gl.getUniformLocation(this.program, 'u_camera_pos')!;
      this.uFractalScale = gl.getUniformLocation(this.program, 'u_fractal_scale')!;
      this.uGlobalIntensity = gl.getUniformLocation(this.program, 'u_global_intensity')!;
      this.uGlitchStrength = gl.getUniformLocation(this.program, 'u_glitch_strength')!;
      
      const posLoc = gl.getAttribLocation(this.program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }
  
  private createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(shader) || 'Unknown Compile Error';
          const typeStr = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
          console.error(`${typeStr} Log:`, log);
          this.ngZone.run(() => this.errorLog.set(`${typeStr} SHADER ERROR: ` + log));
          return null;
      }
      return shader;
  }

  // --- Render Loop ---
  private lastFrameTime = 0;
  private readonly TARGET_FPS = 60;

  private readonly FRAME_INTERVAL = 1000 / this.TARGET_FPS;
  private lastFpsUpdate = 0;

  private render(time: number = performance.now()) {
      if (this.gpuCrash()) return; 
      
      // 0. Loop Maintenance
      this.animationId = requestAnimationFrame((t) => this.render(t)); // Schedule next first
      
      const elapsed = time - this.lastFrameTime;
      // UNLOCKED FPS: We calculate dt but do not return early
      this.lastFrameTime = time; // Update immediately for unlocked framerate

      if (!this.gl || !this.program) return;

      const now = Date.now();

      // 2. Performance Monitoring (Optional: Only update UI every 500ms)
      // 2. Performance Monitoring (Throttled to 10Hz for smooth graph)
      // We use a dedicated timer to avoid 'modulo' issues with variable framerates
      if (now - this.lastFpsUpdate > 100) {
         this.lastFpsUpdate = now;
         const currentFps = Math.round(1000 / elapsed);
         
         // Trigger CD only 10 times a second, not 144 times
         this.ngZone.run(() => {
             this.inputService.fps.set(currentFps);
             this.inputService.fpsHistory.update(h => {
                 const next = [...h, currentFps];
                 if (next.length > 50) next.shift(); // 5 seconds history
                 return next;
             });
         });
      }

      // 3. Boot Logic (Simplified: Just run)
      // No simulated boot text phases anymore in shader, but we sync HTML.
      let tBoot = 0;
      if (this.systemReady()) {
          tBoot = (now - this.bootTime) / 1000;
          
          // HTML TITLE CARD SYNC: Show during Scene 4 (Aftermath)
          if (tBoot > 12 && tBoot < 15.5) {
              if (!this.showTitle()) this.ngZone.run(() => this.showTitle.set(true));
          } else if (this.showTitle()) {
              this.ngZone.run(() => this.showTitle.set(false));
          }
      } else {
          tBoot = (now % 10000) / 1000;
      }

      // 4. Data Gathering
      const state = this.inputService.globalState(); 
      const mixture = this.inputService.getBlendedValues(state);
      const w = this.canvasRef.nativeElement.width;
      const h = this.canvasRef.nativeElement.height;

      // 5. Update Uniforms
      this.gl.useProgram(this.program);
      this.gl.viewport(0, 0, w, h);
      
      const t = (now - this.startTime) / 1000;

      this.gl.uniform1f(this.uTime, t);
      this.gl.uniform1f(this.uBootTime, tBoot); 
      this.gl.uniform2f(this.uResolution, w, h);
      this.gl.uniform3f(this.uAudio, state.low_energy, state.mid_energy, state.high_energy);
      
      this.gl.uniform3f(this.uCameraPos, mixture.camX, mixture.camY, mixture.camZ);
      this.gl.uniform1f(this.uFractalScale, mixture.scale);
      this.gl.uniform1f(this.uGlobalIntensity, mixture.intensity);
      this.gl.uniform1f(this.uGlitchStrength, mixture.glitch);

      this.gl.uniform1i(this.uFeedbackTex, 0); 

      // 6. Draw
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private checkPerformance(frameTimes: number[]) {
      if (frameTimes.length < 30) return;
      let sum = 0;
      for(let i=1; i<frameTimes.length; i++) sum += (frameTimes[i] - frameTimes[i-1]);
      const fps = 1000 / (sum / (frameTimes.length - 1));
      
      
      // Aggressive Downscaling
      if (fps < 45 && this.resolutionScale > 0.3) {
          // Drop faster if performance is really bad
          const drop = fps < 30 ? 0.2 : 0.1;
          this.resolutionScale = Math.max(0.3, this.resolutionScale - drop);
          this.resize();
          
          // Debug (Only show occasionally)
          if (Math.random() < 0.05) console.warn(`[Visualizer] Dropped resolution to ${this.resolutionScale.toFixed(2)} (FPS: ${fps.toFixed(1)})`);
      } 
      // Conservative Upscaling (Hysteresis)
      else if (fps > 58 && this.resolutionScale < 1) {
          // Only upscale if we are solidly hitting cap
          this.resolutionScale = Math.min(1, this.resolutionScale + 0.05);
          this.resize();
      }
  }
}
