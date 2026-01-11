// Local interface for Vibe telemetry state
interface TelemetryState {
    low_energy: number;
    mid_energy: number;
    high_energy: number;
    glitch_factor: number;
    state: string;
    genre: string;
    bpm: number;
    [key: string]: any;
}

class VibeStateStore {
    private static instance: VibeStateStore;
    private lastState: any = null;

    private constructor() {}

    public static getInstance(): VibeStateStore {
        if (!VibeStateStore.instance) {
            VibeStateStore.instance = new VibeStateStore();
        }
        return VibeStateStore.instance;
    }

    public update(state: any) {
        this.lastState = state;
    }

    public getLatest() {
        return this.lastState;
    }
}

export const vibeStore = VibeStateStore.getInstance();
