use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tokio::sync::broadcast;

pub struct AudioEngine {
    stream: cpal::Stream,
}

use crate::state_machine::AudioMetadata;

impl AudioEngine {
    pub fn new(
        tx: broadcast::Sender<AudioFeatures>,
    ) -> Result<(Self, AudioMetadata), Box<dyn std::error::Error>> {
        let host = cpal::default_host();

        // FORCE: Only use system audio loopback devices (NEVER microphone)
        let mut target_device = None;
        println!("🔍 [Audio] Scanning for System Audio Loopback (NO MICROPHONE):");

        // List of valid system audio loopback device names
        let loopback_keywords = vec![
            "Stereo Mix",
            "Wave Out Mix",
            "What U Hear",
            "Loopback",
            "Mix Out",
            "System Audio",
            "WASAPI Loopback"
        ];

        for device in host.input_devices()? {
            let name = device.name().unwrap_or("Unknown".to_string());
            println!("   - {}", name);

            // Check if device name contains any loopback keyword
            for keyword in &loopback_keywords {
                if name.contains(keyword) {
                    target_device = Some(device);
                    println!("   ✓ SELECTED: {}", name);
                    break;
                }
            }

            if target_device.is_some() {
                break;
            }
        }

        // STRICT: Only use loopback device, fail if not found
        let device = target_device.ok_or(
            "❌ CRITICAL: No system audio loopback device found! \
             Please enable 'Stereo Mix' in Windows Sound Settings. \
             MICROPHONE INPUT IS DISABLED FOR PRIVACY."
        )?;

        let device_name = device.name().unwrap_or("Unknown Device".to_string());
        println!("🎤 Input device: {}", device_name);

        let config = device.default_input_config()?;
        println!("🎛️  Default config: {:?}", config);

        // Capture metadata
        let metadata = AudioMetadata {
            device_name: device_name.clone(),
            sample_rate: config.sample_rate().0,
            channels: config.channels(),
        };

        // Create the stream
        let tx_clone = tx.clone();
        let sr_u32 = config.sample_rate().0;

        let err_fn = |err| eprintln!("an error occurred on stream: {}", err);

        // State for spectral flux (persistence across callback fires)
        let mut prev_flux_f32 = Vec::new();
        let mut prev_flux_i16 = Vec::new();
        let mut prev_flux_u16 = Vec::new();

        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &_| write_input_data(data, &tx_clone, sr_u32, &mut prev_flux_f32),
                err_fn,
                None,
            )?,
            cpal::SampleFormat::I16 => device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &_| write_input_data(data, &tx_clone, sr_u32, &mut prev_flux_i16),
                err_fn,
                None,
            )?,
            cpal::SampleFormat::U16 => device.build_input_stream(
                &config.into(),
                move |data: &[u16], _: &_| write_input_data(data, &tx_clone, sr_u32, &mut prev_flux_u16),
                err_fn,
                None,
            )?,
            _ => return Err("Unsupported sample format".into()),
        };

        stream.play()?;

        Ok((Self { stream }, metadata))
    }
}

impl Drop for AudioEngine {
    fn drop(&mut self) {
        println!("🛑 Stopping Audio Engine Stream...");
        // Explicitly stopping the stream is handled by Drop if the stream is owned,
        // but printing provides verification for the audit.
    }
}

#[derive(Clone, Debug, Default)]
pub struct AudioFeatures {
    pub low_energy: f32,
    pub mid_energy: f32,
    pub high_energy: f32,
    pub spectral_flux: f32,
}

// use cpal::Sample; // Removed to avoid warning if not needed, but generic constraint uses it path-wise.
use rustfft::{num_complex::Complex, FftPlanner};

pub trait AudioSample: cpal::Sample {
    fn to_f32_custom(self) -> f32;
}

impl AudioSample for f32 {
    fn to_f32_custom(self) -> f32 {
        self
    }
}

impl AudioSample for i16 {
    fn to_f32_custom(self) -> f32 {
        (self as f32) / 32768.0
    }
}

impl AudioSample for u16 {
    fn to_f32_custom(self) -> f32 {
        (self as f32 - 32768.0) / 32768.0
    }
}

// Thread-local FFT planner to avoid repeated allocations
use std::cell::RefCell;
thread_local! {
    static FFT_PLANNER: RefCell<FftPlanner<f32>> = RefCell::new(FftPlanner::new());
}

fn write_input_data<T>(
    input: &[T],
    tx: &broadcast::Sender<AudioFeatures>,
    sample_rate: u32,
    prev_spectrum: &mut Vec<f32>,
) where
    T: AudioSample,
{
    if input.is_empty() {
        return;
    }

    // Convert to F32 for analysis (optimized: pre-allocate capacity)
    let mut samples = Vec::with_capacity(input.len());
    for s in input.iter() {
        samples.push(s.to_f32_custom());
    }

    // 1. FFT Analysis (optimized: reuse thread-local planner)
    let mut buffer: Vec<Complex<f32>> = Vec::with_capacity(samples.len());
    for &x in samples.iter() {
        buffer.push(Complex { re: x, im: 0.0 });
    }

    FFT_PLANNER.with(|planner| {
        let mut planner = planner.borrow_mut();
        let fft = planner.plan_fft_forward(samples.len());
        fft.process(&mut buffer);
    });

    // Calculate bands (0-150Hz, 150-2500Hz, 2500Hz+)
    let bin_size = sample_rate as f32 / samples.len() as f32;

    let mut low = 0.0f32;
    let mut mid = 0.0f32;
    let mut high = 0.0f32;
    
    // Store current magnitudes for flux calculation
    let half_len = samples.len() / 2;
    let mut current_spectrum = Vec::with_capacity(half_len);

    for (i, complex) in buffer.iter().enumerate().take(half_len) {
        let freq = i as f32 * bin_size;
        // Manual norm calculation to avoid trait issues
        let mag = (complex.re * complex.re + complex.im * complex.im).sqrt();
        
        current_spectrum.push(mag);

        if freq < 150.0 {
            low += mag;
        } else if freq < 2500.0 {
            mid += mag;
        } else {
            high += mag;
        }
    }

    // 2. Spectral Flux (Onset Detection)
    // Sum of positive differences between current and previous frame bins
    let mut flux = 0.0f32;
    if prev_spectrum.len() == current_spectrum.len() {
        for (curr, prev) in current_spectrum.iter().zip(prev_spectrum.iter()) {
            let diff = curr - prev;
            if diff > 0.0 {
                flux += diff;
            }
        }
    }
    
    // Update previous spectrum
    *prev_spectrum = current_spectrum;

    // Normalize by buffer size
    let norm = samples.len() as f32;
    // Normalize flux (heuristic scaling)
    let flux_norm = (flux / norm).min(1.0f32);

    let features = AudioFeatures {
        low_energy: (low / norm).min(1.0f32),
        mid_energy: (mid / norm).min(1.0f32),
        high_energy: (high / norm).min(1.0f32),
        spectral_flux: flux_norm,
    };

    // Send with error handling (avoid silent failures)
    if let Err(e) = tx.send(features) {
        // Only log if there are no receivers (not just lagging)
        if tx.receiver_count() == 0 {
            eprintln!("⚠️ [Audio] No active subscribers for audio features: {}", e);
        }
    }
}
