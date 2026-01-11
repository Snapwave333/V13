use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum VibeState {
    Chill,
    Build,
    Chaos,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Genre {
    Unknown,
    Ambient,
    Techno,
    DnB,
    Dubstep,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalState {
    pub state: VibeState,
    pub genre: Genre, 
    pub bpm: f32,
    pub glitch_factor: f32,
    pub low_energy: f32,
    pub mid_energy: f32,
    pub high_energy: f32,
    pub spectral_flux: f32, // NEW: Onset detection / Kick
    pub energy_trend: String, // NEW: "RISING", "FALLING", "STABLE"
    // AI Director Context
    pub ai_theme: String,
    pub ai_primary_color: String,
    pub ai_secondary_color: String,
    pub ai_directive: String,
    // System Telemetry
    pub system_stats: SystemStats,
    pub audio_meta: AudioMetadata,
}


#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub memory_used: u64,
    pub memory_total: u64,
    pub uptime: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AudioMetadata {
    pub device_name: String,
    pub sample_rate: u32,
    pub channels: u16,
}


impl Default for GlobalState {
    fn default() -> Self {
        Self {
            state: VibeState::Chill,
            genre: Genre::Unknown,
            bpm: 128.0,
            glitch_factor: 0.0,
            low_energy: 0.0,
            mid_energy: 0.0,
            high_energy: 0.0,
            spectral_flux: 0.0,
            energy_trend: "STABLE".to_string(), // Default
            ai_theme: "BOOT_SEQUENCE".to_string(),
            ai_primary_color: "#FFFFFF".to_string(),
            ai_secondary_color: "#000000".to_string(),
            ai_directive: "INITIALIZING".to_string(),
            system_stats: SystemStats::default(),
            audio_meta: AudioMetadata {
                device_name: "Scanning...".to_string(),
                sample_rate: 0,
                channels: 0,
            },
        }
    }
}

use sysinfo::System;
use std::collections::VecDeque;

pub struct Overmind {
    state: GlobalState,
    frame_count: u64,
    sys_monitor: System,
    energy_history: VecDeque<f32>, // Store last N frames of total energy
}

impl Overmind {
    pub fn new(metadata: AudioMetadata) -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        let mut state = GlobalState::default();
        state.audio_meta = metadata;

        Self { 
            state, 
            frame_count: 0, 
            sys_monitor: sys,
            energy_history: VecDeque::with_capacity(150), // ~5 seconds @ 30fps
        }
    }

    pub fn update(&mut self, low: f32, mid: f32, high: f32, flux: f32) -> GlobalState {
        self.frame_count += 1;

        self.state.low_energy = low;
        self.state.mid_energy = mid;
        self.state.high_energy = high;
        self.state.spectral_flux = flux;

        // --- Trend Analysis ---
        let total_energy = (low + mid + high) / 3.0;
        if self.energy_history.len() >= 150 {
            self.energy_history.pop_front();
        }
        self.energy_history.push_back(total_energy);

        // Every 30 frames (1s), calculate trend
        if self.frame_count % 30 == 0 && self.energy_history.len() > 30 {
            let recent_avg: f32 = self.energy_history.iter().skip(self.energy_history.len() - 30).sum::<f32>() / 30.0;
            let old_avg: f32 = self.energy_history.iter().take(30).sum::<f32>() / 30.0;
            
            let delta = recent_avg - old_avg;
            if delta > 0.1 {
                self.state.energy_trend = "RISING".to_string();
            } else if delta < -0.1 {
                self.state.energy_trend = "FALLING".to_string();
            } else {
                self.state.energy_trend = "STABLE".to_string();
            }
        }

        // --- Vibe Logic ---
        // Enhanced onset detection using spectral flux
        if flux > 0.6 || low > 0.8 {
            self.state.state = VibeState::Chaos;
            self.state.glitch_factor = 1.0;
        } else if flux > 0.3 || mid > 0.5 {
            self.state.state = VibeState::Build;
            self.state.glitch_factor = 0.3;
        } else {
            self.state.state = VibeState::Chill;
            self.state.glitch_factor = 0.0;
        }

        // --- Genre & Rhythm Analysis ---
        // Classification based on real energy profile signatures (Heuristic V1)
        if self.frame_count % 300 == 0 {
            // Every ~10 seconds (was 5, slowing down for better samples)
            if low < 0.15 && mid < 0.15 {
                self.state.genre = Genre::Ambient;
                self.state.bpm = 90.0;
            } else if low > 0.65 && high > 0.65 {
                self.state.genre = Genre::DnB;
                self.state.bpm = 174.0;
            } else if low > 0.45 && mid > 0.35 {
                self.state.genre = Genre::Techno;
                self.state.bpm = 128.0;
            } else if low > 0.3 && mid > 0.2 {
                self.state.genre = Genre::Dubstep;
                self.state.bpm = 140.0;
            } else {
                self.state.genre = Genre::Unknown;
                self.state.bpm = 120.0;
            }

            #[cfg(debug_assertions)]
            println!("[STATE] Classification: {:?} | BPM: {} | Trend: {}", self.state.genre, self.state.bpm, self.state.energy_trend);
        }

        // Monitor System Stats (Every ~1s)
        if self.frame_count % 30 == 0 {
            self.sys_monitor.refresh_cpu();
            self.sys_monitor.refresh_memory();

            self.state.system_stats.cpu_usage = self.sys_monitor.global_cpu_info().cpu_usage();
            self.state.system_stats.memory_used = self.sys_monitor.used_memory();
            self.state.system_stats.memory_total = self.sys_monitor.total_memory();
            self.state.system_stats.uptime = System::uptime();
        }

        self.state.clone()
    }
}
