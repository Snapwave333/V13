import { vibeStore } from '../utils/stateStore';
import { logger } from '../utils/logger';

/**
 * VibeMocker: Professional testing utility to simulate backend activity.
 * Used for development/CI environments where the Rust backend is unavailable.
 */
export class VibeMocker {
    private interval: NodeJS.Timeout | null = null;

    public start() {
        if (this.interval) return;
        
        logger.warn('⚠️ [MOCK] VibeMocker started. Generating simulated telemetry.');
        
        this.interval = setInterval(() => {
            const mockState = {
                low_energy: Math.random() * 0.4 + 0.1,
                mid_energy: Math.random() * 0.3 + 0.1,
                high_energy: Math.random() * 0.2 + 0.1,
                glitch_factor: Math.random() > 0.9 ? 1 : 0,
                state: 'Chill',
                genre: 'Ambient',
                bpm: 120,
                is_mock: true,
                timestamp: new Date().toISOString()
            };
            
            vibeStore.update(mockState);
        }, 2000);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger.info('[MOCK] VibeMocker stopped.');
        }
    }
}

export const vibeMocker = new VibeMocker();
