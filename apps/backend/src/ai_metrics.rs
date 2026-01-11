use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

#[derive(Debug, Serialize, Clone, Default)]
pub struct PipelineMetrics {
    pub total_requests: u64,
    pub cache_hits: u64,
    pub error_count: u64,
    pub avg_latency_ms: f64,
    pub last_latency_ms: u64,
}

pub struct MetricsCollector {
    total_requests: AtomicU64,
    cache_hits: AtomicU64,
    error_count: AtomicU64,
    total_latency_ns: AtomicU64,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self {
            total_requests: AtomicU64::new(0),
            cache_hits: AtomicU64::new(0),
            error_count: AtomicU64::new(0),
            total_latency_ns: AtomicU64::new(0),
        }
    }

    pub fn record_request(&self) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_cache_hit(&self) {
        self.cache_hits.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_error(&self) {
        self.error_count.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_latency(&self, duration: Duration) {
        self.total_latency_ns.fetch_add(duration.as_nanos() as u64, Ordering::Relaxed);
    }

    pub fn get_snapshot(&self) -> PipelineMetrics {
        let total = self.total_requests.load(Ordering::Relaxed);
        let latency_ns = self.total_latency_ns.load(Ordering::Relaxed);

        PipelineMetrics {
            total_requests: total,
            cache_hits: self.cache_hits.load(Ordering::Relaxed),
            error_count: self.error_count.load(Ordering::Relaxed),
            avg_latency_ms: if total > 0 {
                (latency_ns as f64 / total as f64) / 1_000_000.0
            } else {
                0.0
            },
            last_latency_ms: 0, // Simplified for now
        }
    }
}
