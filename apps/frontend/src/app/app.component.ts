import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerComponent } from './visualizer/visualizer.component';
import { InputManagerService } from './services/input-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, VisualizerComponent],
  template: `
    <!-- MAIN APP CONTENT -->
    <app-visualizer></app-visualizer>

    <!-- CRITICAL SYSTEM LOCKOUT OVERLAY -->
    <div class="lockout-screen" *ngIf="isLocked()">
        <div class="lock-container">
            <div class="lock-icon">🔒</div>
            <div class="lock-title">SYSTEM LOCKED</div>
            <div class="lock-msg">WAITING FOR AI OVERMIND UPLINK</div>
            <div class="lock-status">CONNECTION_STATE: {{ connectionStatus() }}</div>
            <div class="lock-hint"> > INITIALIZING NEURAL HANDSHAKE...</div>
        </div>
    </div>
  `,
  styles: [`
    .lockout-screen {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #000;
        z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Courier New', monospace;
        color: #ff0000;
    }
    .lock-container {
        text-align: center;
        border: 2px solid #ff0000;
        padding: 40px;
        background: rgba(20, 0, 0, 0.9);
        box-shadow: 0 0 50px rgba(255, 0, 0, 0.2);
    }
    .lock-icon { font-size: 48px; margin-bottom: 20px; }
    .lock-title { font-size: 32px; font-weight: bold; letter-spacing: 4px; margin-bottom: 10px; animation: pulse 1s infinite; }
    .lock-msg { font-size: 14px; color: #cc0000; margin-bottom: 20px; letter-spacing: 2px; }
    .lock-status { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #330000; padding-top: 10px; }
    .lock-hint { font-size: 10px; color: #444; margin-top: 5px; animation: blink 2s infinite; }

    @keyframes pulse { 50% { opacity: 0.5; } }
    @keyframes blink { 50% { opacity: 0; } }
  `]
})
export class AppComponent {
  private inputService = inject(InputManagerService);
  
  // System is locked if AI Theme is OFFLINE
  isLocked = computed(() => this.inputService.aiTheme() === 'OFFLINE');
  connectionStatus = this.inputService.connectionStatus;
}

