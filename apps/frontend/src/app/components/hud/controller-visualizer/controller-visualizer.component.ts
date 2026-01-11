import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-controller-visualizer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hud-container">
      <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
        
        <defs>
          <!-- Shoulder/Bumper Gradient -->
          <linearGradient id="grad-shoulder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#555;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#222;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#111;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grad-shoulder-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#bbb;stop-opacity:1" />
          </linearGradient>

          <!-- D-Pad Gradient -->
          <linearGradient id="grad-dpad" x1="20%" y1="20%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#444" />
            <stop offset="100%" style="stop-color:#000" />
          </linearGradient>

          <!-- Trigger Bar Gradient -->
          <linearGradient id="grad-trigger" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#fff" />
            <stop offset="50%" style="stop-color:#ccc" />
            <stop offset="100%" style="stop-color:#fff" />
          </linearGradient>

          <!-- Stick Head Gradient -->
          <radialGradient id="grad-stick" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#333" />
            <stop offset="30%" style="stop-color:#222" />
            <stop offset="100%" style="stop-color:#000" />
          </radialGradient>
          <radialGradient id="grad-stick-active" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#555" />
            <stop offset="100%" style="stop-color:#222" />
          </radialGradient>

          <!-- Home Button -->
          <radialGradient id="grad-home" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#eee" />
            <stop offset="100%" style="stop-color:#333" />
          </radialGradient>

          <!-- A (Green) -->
          <radialGradient id="grad-btn-a" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#32cd32" />
            <stop offset="100%" style="stop-color:#004400" />
          </radialGradient>
          <radialGradient id="grad-btn-a-active" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#88ff88" />
            <stop offset="100%" style="stop-color:#006400" />
          </radialGradient>

          <!-- B (Red) -->
          <radialGradient id="grad-btn-b" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#ff5555" />
            <stop offset="100%" style="stop-color:#660000" />
          </radialGradient>
          <radialGradient id="grad-btn-b-active" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#ff8888" />
            <stop offset="100%" style="stop-color:#800000" />
          </radialGradient>

          <!-- X (Blue) -->
          <radialGradient id="grad-btn-x" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#4da6ff" />
            <stop offset="100%" style="stop-color:#000066" />
          </radialGradient>
          <radialGradient id="grad-btn-x-active" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#88ccff" />
            <stop offset="100%" style="stop-color:#0000aa" />
          </radialGradient>

          <!-- Y (Yellow) -->
          <radialGradient id="grad-btn-y" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#ffd700" />
            <stop offset="100%" style="stop-color:#8B4500" />
          </radialGradient>
          <radialGradient id="grad-btn-y-active" cx="50%" cy="50%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" style="stop-color:#ffff88" />
            <stop offset="100%" style="stop-color:#daa520" />
          </radialGradient>
        </defs>
        
        <!-- LEFT SIDE PANEL (LB & LT) -->
        <g transform="translate(60, 130)">
            <rect #btnLB id="btn-lb" class="btn bumper-rect" x="0" y="-7" width="80" height="40" rx="5" />
            <text x="40" y="18" class="side-label" pointer-events="none">LB</text>
            
            <g transform="translate(25, 70)">
                <text x="15" y="-10" class="side-label">LT</text>
                <rect class="trigger-bg" x="0" y="0" width="30" height="120" rx="4" />
                <rect #btnLT id="btn-lt-bar" class="active" x="0" y="0" width="30" height="0" rx="4" />
            </g>
        </g>

        <!-- RIGHT SIDE PANEL (RB & RT) -->
        <g transform="translate(660, 130)">
            <rect #btnRB id="btn-rb" class="btn bumper-rect" x="0" y="-7" width="80" height="40" rx="5" />
            <text x="40" y="18" class="side-label" pointer-events="none">RB</text>

            <g transform="translate(25, 70)">
                <text x="15" y="-10" class="side-label">RT</text>
                <rect class="trigger-bg" x="0" y="0" width="30" height="120" rx="4" />
                <rect #btnRT id="btn-rt-bar" class="active" x="0" y="0" width="30" height="0" rx="4" />
            </g>
        </g>

        <!-- MAIN CONTROLLER (Centered) -->
        <g transform="translate(100, 0)">
            
            <!-- Connectivity Indicator -->
            <circle #connectivityLED id="connectivity-led" cx="300" cy="115" r="4" />

            <!-- D-Pad -->
            <g transform="translate(250, 230)">
                <path #btnUp id="btn-up" class="btn dpad-path" d="M-15,-45 L15,-45 L15,-15 L-15,-15 Z" />
                <path #btnDown id="btn-down" class="btn dpad-path" d="M-15,15 L15,15 L15,45 L-15,45 Z" />
                <path #btnLeft id="btn-left" class="btn dpad-path" d="M-45,-15 L-15,-15 L-15,15 L-45,15 Z" />
                <path #btnRight id="btn-right" class="btn dpad-path" d="M15,-15 L45,-15 L45,15 L15,15 Z" />
            </g>

            <!-- Left Stick -->
            <g transform="translate(140, 200)">
                <circle class="analog-stick" cx="0" cy="0" r="35" />
                <g #stickL id="stick-l" class="stick-group">
                    <circle class="stick-head" cx="0" cy="0" r="20" />
                    <path #stickLArrow id="stick-l-arrow" class="stick-arrow" d="M16,0 L2,6 L2,-6 Z" />
                </g>
            </g>

            <!-- Right Stick -->
            <g transform="translate(380, 260)">
                <circle class="analog-stick" cx="0" cy="0" r="35" />
                <g #stickR id="stick-r" class="stick-group">
                    <circle class="stick-head" cx="0" cy="0" r="20" />
                    <path #stickRArrow id="stick-r-arrow" class="stick-arrow" d="M16,0 L2,6 L2,-6 Z" />
                </g>
            </g>

            <!-- Face Buttons -->
            <g transform="translate(450, 200)">
                <circle #btnY id="btn-y" class="btn" cx="0" cy="-35" r="14" />
                <text x="0" y="-30" text-anchor="middle" class="btn-label">Y</text>
                
                <circle #btnX id="btn-x" class="btn" cx="-35" cy="0" r="14" />
                <text x="-35" y="5" text-anchor="middle" class="btn-label">X</text>
                
                <circle #btnB id="btn-b" class="btn" cx="35" cy="0" r="14" />
                <text x="35" y="5" text-anchor="middle" class="btn-label">B</text>
                
                <circle #btnA id="btn-a" class="btn" cx="0" cy="35" r="14" />
                <text x="0" y="40" text-anchor="middle" class="btn-label">A</text>
            </g>

            <!-- Center Buttons -->
            <g transform="translate(300, 200)">
                <circle #btnView id="btn-view" class="btn" cx="-40" cy="-40" r="8" />
                <circle #btnMenu id="btn-menu" class="btn" cx="40" cy="-40" r="8" />
                <circle #btnHome id="btn-home" class="btn" cx="0" cy="-60" r="16" />
            </g>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: transparent;
      --xbox-green: #32cd32;
      --xbox-red: #ff5555;
      --xbox-blue: #4da6ff;
      --xbox-yellow: #ffd700;
    }

    .hud-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      box-sizing: border-box;
    }

    svg {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      display: block;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));
    }

    .btn {
      stroke: #333;
      stroke-width: 1;
      transition: all 0.05s linear;
    }

    #connectivity-led {
        fill: #222;
        transition: fill 0.3s, filter 0.3s;
    }
    #connectivity-led.connected {
        fill: #0f0;
        filter: drop-shadow(0 0 5px #0f0);
    }
    #connectivity-led.disconnected {
        fill: #f00;
        filter: drop-shadow(0 0 5px #f00);
    }

    #btn-a { fill: url(#grad-btn-a); }
    #btn-a.active { 
        fill: url(#grad-btn-a-active) !important; 
        filter: drop-shadow(0 0 8px var(--xbox-green)); 
        transform: scale(0.95); transform-box: fill-box; transform-origin: center; 
    }

    #btn-b { fill: url(#grad-btn-b); }
    #btn-b.active { 
        fill: url(#grad-btn-b-active) !important; 
        filter: drop-shadow(0 0 8px var(--xbox-red)); 
        transform: scale(0.95); transform-box: fill-box; transform-origin: center; 
    }

    #btn-x { fill: url(#grad-btn-x); }
    #btn-x.active { 
        fill: url(#grad-btn-x-active) !important; 
        filter: drop-shadow(0 0 8px var(--xbox-blue)); 
        transform: scale(0.95); transform-box: fill-box; transform-origin: center; 
    }

    #btn-y { fill: url(#grad-btn-y); }
    #btn-y.active { 
        fill: url(#grad-btn-y-active) !important; 
        filter: drop-shadow(0 0 8px var(--xbox-yellow)); 
        transform: scale(0.95); transform-box: fill-box; transform-origin: center; 
    }

    .bumper-rect { fill: url(#grad-shoulder); stroke: #555; stroke-width: 1; }
    .bumper-rect.active { fill: url(#grad-shoulder-active) !important; filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6)); }

    .dpad-path { fill: url(#grad-dpad); stroke: #111; stroke-width: 1; }
    .dpad-path.active { fill: #555 !important; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5)); transform: scale(0.95); transform-box: fill-box; transform-origin: center; }

    .analog-stick { stroke: #333; stroke-width: 3; fill: #0d0d0d; }
    .stick-head { fill: url(#grad-stick); stroke: #222; stroke-width: 1; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.8)); }
    .stick-group.pressed .stick-head { fill: url(#grad-stick-active); transform: scale(0.9); }

    .stick-arrow { fill: #00eaff; filter: drop-shadow(0 0 4px #00eaff); opacity: 0; transition: opacity 0.1s; }

    .trigger-bg { fill: #111; stroke: #333; stroke-width: 1; }
    #btn-lt-bar, #btn-rt-bar { fill: url(#grad-trigger); filter: drop-shadow(0 0 3px rgba(255,255,255,0.4)); }

    #btn-view, #btn-menu { fill: url(#grad-dpad); }
    #btn-home { fill: url(#grad-home); stroke: #eee; stroke-width: 1; }
    #btn-home.active { filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); fill: #fff; }

    .side-label { fill: #888; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 700; text-anchor: middle; }
    .btn-label { font-family: 'Segoe UI', sans-serif; font-weight: 900; font-size: 14px; fill: rgba(255,255,255,0.9); text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none; }
  `]
})
export class ControllerVisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stickL') stickL!: ElementRef<SVGGElement>;
  @ViewChild('stickR') stickR!: ElementRef<SVGGElement>;
  @ViewChild('stickLArrow') stickLArrow!: ElementRef<SVGPathElement>;
  @ViewChild('stickRArrow') stickRArrow!: ElementRef<SVGPathElement>;
  @ViewChild('btnUp') btnUp!: ElementRef<SVGPathElement>;
  @ViewChild('btnDown') btnDown!: ElementRef<SVGPathElement>;
  @ViewChild('btnLeft') btnLeft!: ElementRef<SVGPathElement>;
  @ViewChild('btnRight') btnRight!: ElementRef<SVGPathElement>;
  @ViewChild('btnA') btnA!: ElementRef<SVGCircleElement>;
  @ViewChild('btnB') btnB!: ElementRef<SVGCircleElement>;
  @ViewChild('btnX') btnX!: ElementRef<SVGCircleElement>;
  @ViewChild('btnY') btnY!: ElementRef<SVGCircleElement>;
  @ViewChild('btnLB') btnLB!: ElementRef<SVGRectElement>;
  @ViewChild('btnRB') btnRB!: ElementRef<SVGRectElement>;
  @ViewChild('btnView') btnView!: ElementRef<SVGCircleElement>;
  @ViewChild('btnMenu') btnMenu!: ElementRef<SVGCircleElement>;
  @ViewChild('btnHome') btnHome!: ElementRef<SVGCircleElement>;
  @ViewChild('btnLT') triggerL!: ElementRef<SVGRectElement>;
  @ViewChild('btnRT') triggerR!: ElementRef<SVGRectElement>;
  @ViewChild('connectivityLED') connectivityLED!: ElementRef<SVGCircleElement>;

  private readonly ngZone = inject(NgZone);
  private animId = 0;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.loop();
    });
  }

  ngOnDestroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  private loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    
    // Always check for gamepad status to update LED
    const gps = navigator.getGamepads();
    const gpArray = Array.from(gps).filter(g => g !== null) as Gamepad[];
    const gp = gpArray[0];

    if (this.connectivityLED?.nativeElement) {
        const led = this.connectivityLED.nativeElement;
        if (gp) {
            led.classList.add('connected');
            led.classList.remove('disconnected');
        } else {
            led.classList.remove('connected');
            led.classList.add('disconnected');
        }
    }

    if (!gp) return;

    // Buttons
    this.updateButton(this.btnA, gp.buttons[0]);
    this.updateButton(this.btnB, gp.buttons[1]);
    this.updateButton(this.btnX, gp.buttons[2]);
    this.updateButton(this.btnY, gp.buttons[3]);
    this.updateButton(this.btnLB, gp.buttons[4]);
    this.updateButton(this.btnRB, gp.buttons[5]);
    this.updateButton(this.btnView, gp.buttons[8]);
    this.updateButton(this.btnMenu, gp.buttons[9]);
    this.updateButton(this.btnHome, gp.buttons[16]);
    this.updateButton(this.btnUp, gp.buttons[12]);
    this.updateButton(this.btnDown, gp.buttons[13]);
    this.updateButton(this.btnLeft, gp.buttons[14]);
    this.updateButton(this.btnRight, gp.buttons[15]);

    // Triggers
    if (this.triggerL?.nativeElement) {
      this.triggerL.nativeElement.setAttribute('height', (gp.buttons[6].value * 120).toString());
    }
    if (this.triggerR?.nativeElement) {
      this.triggerR.nativeElement.setAttribute('height', (gp.buttons[7].value * 120).toString());
    }

    // Sticks
    this.updateStick(this.stickL, this.stickLArrow, gp.axes[0], gp.axes[1], gp.buttons[10]?.pressed || false);
    this.updateStick(this.stickR, this.stickRArrow, gp.axes[2], gp.axes[3], gp.buttons[11]?.pressed || false);
  }

  private updateButton(ref: ElementRef, button: GamepadButton) {
    if (!ref?.nativeElement) return;
    if (button?.pressed) {
      ref.nativeElement.classList.add('active');
    } else {
      ref.nativeElement.classList.remove('active');
    }
  }

  private updateStick(group: ElementRef, arrow: ElementRef, x: number, y: number, pressed: boolean) {
    if (!group?.nativeElement || !arrow?.nativeElement) return;
    
    const head = group.nativeElement.querySelector('.stick-head') as SVGCircleElement;
    if (!head) return;

    const deadzone = 0.15;
    const mag = Math.hypot(x, y);
    
    if (mag > deadzone) {
      const angle = Math.atan2(y, x);
      const dist = Math.min(15, (mag - deadzone) / (1 - deadzone) * 15);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      
      head.setAttribute('cx', tx.toString());
      head.setAttribute('cy', ty.toString());
      
      arrow.nativeElement.style.opacity = '1';
      arrow.nativeElement.setAttribute('transform', `translate(${tx}, ${ty}) rotate(${angle * 180 / Math.PI})`);
    } else {
      head.setAttribute('cx', '0');
      head.setAttribute('cy', '0');
      arrow.nativeElement.style.opacity = '0';
    }

    if (pressed) {
      group.nativeElement.classList.add('pressed');
    } else {
      group.nativeElement.classList.remove('pressed');
    }
  }
}
