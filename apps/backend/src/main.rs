mod audio_engine;
mod state_machine;
pub mod websocket;

use crate::audio_engine::AudioEngine;
use crate::state_machine::{Overmind, AudioMetadata};
use std::sync::Arc;
use tokio::sync::broadcast;

mod ai_metrics;
mod llm_engine; // Add module

use crate::llm_engine::LlmDirector;
use tokio::time::{sleep, Duration};
use tracing::info;
use tracing_subscriber::{EnvFilter, FmtSubscriber};

async fn ensure_ollama_ready() {
    tokio::spawn(async move {
        println!("🔍 [SYSTEM] Checking Ollama service status (Background)...");

        let ollama_host = std::env::var("OLLAMA_HOST").expect("OLLAMA_HOST environment variable must be set");
        println!("ℹ️ [SYSTEM] Using OLLAMA_HOST: {}", ollama_host);

        // If host is NOT localhost, skip local process management
        if !ollama_host.contains("localhost") && !ollama_host.contains("127.0.0.1") {
            println!("⚡ [SYSTEM] Remote Ollama host detected. Skipping local spawn.");
        } else {
            // Only check/spawn if we expect it locally
            let port_busy = std::net::TcpListener::bind("127.0.0.1:11434").is_err();
            if !port_busy {
                println!("⚡ [SYSTEM] Ollama not detected on port 11434. Attempting to spawn...");
                let spawn_res = std::process::Command::new("ollama")
                    .arg("serve")
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn();
                
                 if let Err(e) = spawn_res {
                    println!("⚠️ [SYSTEM] Failed to spawn Ollama binary: {}. Assuming external service...", e);
                 } else {
                    println!("⏳ [SYSTEM] Ollama spawned. Waiting for initialization...");
                 }
            }
        }

        // 3. Readiness Probe
        let client = reqwest::Client::new();
        let probe_url = format!("{}/api/tags", ollama_host);
        
        for i in 0..60 { // Extended wait time for background process
            match client.get(&probe_url).send().await {
                Ok(resp) if resp.status().is_success() => {
                    println!("🚀 [SYSTEM] Ollama API is READY (Probe Success).");
                    return;
                }
                _ => {
                    if i % 5 == 0 { println!("... [{}/60] Awaiting response from {}...", i + 1, probe_url); }
                    sleep(Duration::from_secs(1)).await;
                }
            }
        }

        println!("⚠️ [SYSTEM] Ollama service did not respond in time. AI features disabled.");
    });
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    println!("INIT: Starting VIBES Backend...");

    // 0. Initialize Tracing
    let subscriber = FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env())
        .with_ansi(true)
        .finish();
    if let Err(e) = tracing::subscriber::set_global_default(subscriber) {
        println!("WARN: Failed to set subscriber: {}", e);
    }

    info!("🚀 [SYSTEM] VIBE Backend Initialization Started.");

    // 0. Hardened Ollama Boot (ASYNC BACKGROUND)
    ensure_ollama_ready().await;

    // 1. Audio Engine
    let (tx_audio, mut rx_audio) = broadcast::channel(16);
    
    // Attempt to initialize Audio Engine, NO FALLBACK
    let (_audio_engine_guard, audio_meta) = match AudioEngine::new(tx_audio.clone()) {
        Ok((engine, meta)) => {
            info!("✅ Audio Engine Initialized");
            (Some(engine), meta)
        },
        Err(e) => {
            println!("⚠️ [Audio] Audio Engine Initialization Failed: {}", e);
            println!("🛑 [Audio] Running in NO_AUDIO mode (0 data).");
            
            let dummy_meta = AudioMetadata {
                device_name: "NO_AUDIO_DEVICE".to_string(),
                sample_rate: 0,
                channels: 0,
            };
            (None, dummy_meta)
        }
    };


    // 2. State Machine (The Overmind)
    let (tx_state, _): (broadcast::Sender<state_machine::GlobalState>, _) = broadcast::channel(16);

    // Initialize AI Director
    let llm_director = Arc::new(LlmDirector::new());

    // 2. Start AI Director Loop (Async)
    let director_clone = llm_director.clone();
    let mut rx_state_for_director = tx_state.subscribe();

    tokio::spawn(async move {
        println!("⚡ [LLM] Director Loop Started.");
        loop {
            // Wait for a state update to analyze (throttled)
            if let Ok(state) = rx_state_for_director.recv().await {
                let genre_str = format!("{:?}", state.genre);
                let chaos =
                    if state.state == crate::state_machine::VibeState::Chaos { 1.0 } else { 0.0 };
                let trend = state.energy_trend.clone();

                // Consult Oracle with REAL data
                director_clone.consult_oracle(&genre_str, chaos, &trend).await;
            }
            sleep(Duration::from_secs(5)).await;
        }
    });

    // 3. Start Overmind Loop
    let tx_state_clone = tx_state.clone();
    let director_ref = llm_director.clone();
    let audio_running = _audio_engine_guard.is_some();

    tokio::spawn(async move {
        let mut overmind = Overmind::new(audio_meta);
        
        // If we have no audio engine (guard is None), we just loop sending 0 data
        if !audio_running {
             loop {
                // Send heartbeat of 0 energy
                let mut new_state = overmind.update(0.0, 0.0, 0.0, 0.0);
                
                // Inject AI Context even in silence
                let ai_ctx = director_ref.context.lock().await;
                new_state.ai_theme = ai_ctx.theme.clone();
                new_state.ai_primary_color = ai_ctx.primary_color.clone();
                new_state.ai_secondary_color = ai_ctx.secondary_color.clone();
                new_state.ai_directive = ai_ctx.directive.clone();
                drop(ai_ctx);

                let _ = tx_state_clone.send(new_state);
                sleep(Duration::from_millis(33)).await; // ~30 FPS heartbeat
             }
        } else {
            while let Ok(features) = rx_audio.recv().await {
                let mut new_state =
                    overmind.update(features.low_energy, features.mid_energy, features.high_energy, features.spectral_flux);

                // Inject AI Context
                let ai_ctx = director_ref.context.lock().await;
                new_state.ai_theme = ai_ctx.theme.clone();
                new_state.ai_primary_color = ai_ctx.primary_color.clone();
                new_state.ai_secondary_color = ai_ctx.secondary_color.clone();
                new_state.ai_directive = ai_ctx.directive.clone();
                drop(ai_ctx); // Explicit drop for clarity (though not strictly needed)

                // Broadcast new state to all connected clients
                let _ = tx_state_clone.send(new_state);
                
                // Yield to scheduler to prevent tight-loop starvation in single-core envs
                tokio::task::yield_now().await; 
            }
        }
    });

    // 4. Start WebSocket Server IMMEDIATELY
    websocket::start_server(tx_state, llm_director).await;

    Ok(())
}
