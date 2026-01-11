use jsonschema::JSONSchema;
use lazy_static::lazy_static;
use moka::future::Cache;
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio_retry::strategy::{jitter, ExponentialBackoff};
use tokio_retry::Retry;
use tracing::{error, info, instrument};

use crate::ai_metrics::MetricsCollector;
use std::time::Instant;

lazy_static! {
    static ref AI_SCHEMA: serde_json::Value = serde_json::json!({
        "type": "object",
        "properties": {
            "theme": { "type": "string" },
            "primary_color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
            "secondary_color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
            "directive": { "type": "string" }
        },
        "required": ["theme", "primary_color", "secondary_color", "directive"]
    });
    static ref COMPILED_SCHEMA: JSONSchema =
        JSONSchema::compile(&AI_SCHEMA).expect("Invalid AI JSON Schema");
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiContext {
    pub theme: String,
    pub primary_color: String,
    pub secondary_color: String,
    pub directive: String,
}



pub struct LlmDirector {
    client: reqwest::Client,
    pub context: Arc<Mutex<AiContext>>,
    cache: Cache<String, AiContext>,
    pub metrics: Arc<MetricsCollector>,
}

impl LlmDirector {
    pub fn new(initial_context: AiContext) -> Self {
        dotenv::dotenv().ok();

        let cache =
            Cache::builder().max_capacity(100).time_to_live(Duration::from_secs(300)).build();

        Self {
            client: reqwest::Client::new(),
            context: Arc::new(Mutex::new(initial_context)),
            cache,
            metrics: Arc::new(MetricsCollector::new()),
        }
    }


    #[instrument(skip(self), fields(score = %score))]
    pub async fn update_boredom(&self, score: f32) {
        let mut ctx = self.context.lock().await;
        // Simple logic: If boredom > 80% and not already in chaos, force a directive
        if score > 0.8 && ctx.directive != "CHAOS_INJECTION" {
             println!("🤖 [AI OVERMIND] High Boredom Detected ({:.1}%). Triggering CHAOS.", score * 100.0);
             ctx.directive = "CHAOS_INJECTION".to_string();
             ctx.primary_color = "#FF0000".to_string(); // Red Alert
             ctx.theme = "SYSTEM_FAILURE".to_string();
        }
    }

    #[instrument(skip(self), fields(genre = %genre, chaos = %chaos, trend = %trend))]
    pub async fn consult_oracle(&self, genre: &str, chaos: f32, trend: &str) {
        let start_time = Instant::now();
        self.metrics.record_request();

        let cache_key = format!("{}_{:.1}_{}", genre, (chaos * 10.0).round() / 10.0, trend);

        if let Some(cached_ctx) = self.cache.get(&cache_key).await {
            info!(event = "cache_hit", key = %cache_key);
            self.metrics.record_cache_hit();
            let mut ctx = self.context.lock().await;
            *ctx = cached_ctx;
            self.metrics.record_latency(start_time.elapsed());
            return;
        }

        // Check circuit breaker before attempting AI call
        let can_attempt = {
            let mut cb = self.circuit_breaker.lock().await;
            cb.can_attempt()
        };

        if !can_attempt {
            // Use fallback immediately
            let fallback_ctx = self.generate_fallback_context(genre, chaos, trend);
            let mut ctx = self.context.lock().await;
            *ctx = fallback_ctx.clone();
            self.cache.insert(cache_key, fallback_ctx).await;
            self.metrics.record_latency(start_time.elapsed());
            return;
        }

        info!(event = "oracle_request", genre = %genre, trend = %trend);

        // Get Previous Context for Continuity
        let prev_theme = {
            let ctx = self.context.lock().await;
            ctx.theme.clone()
        };

        let prompt = format!(
            "IDENTITY: You are the VIBE_OVERMIND, a Cyber-Oracle controlling a futuristic visualizer.
            CONTEXT:
            - Genre: '{}'
            - Chaos Level: {:.2}
            - Energy Trend: '{}' (IMPORTANT: React to this!)
            - Previous Theme: '{}' (Do not repeat this if possible)

            DIRECTIVE:
            1. Generate a visually distinct Theme for this moment.
            2. Choose colors that match the Genre + Trend (e.g., Rising = Brightening, Falling = Darkening).
            3. The 'directive' field must be a short, cool, sci-fi command (e.g., 'INITIATE_DROP_SEQUENCE', 'PURGE_SYSTEMS').

            Output JSON only:
            {{
                \"theme\": \"UPPERCASE_THEME_NAME\",
                \"primary_color\": \"#HEX\",
                \"secondary_color\": \"#HEX\",
                \"directive\": \"TECHNICAL_COMMAND\"
            }}",
            genre, chaos, trend, prev_theme
        );

        let model = env::var("OLLAMA_MODEL").expect("OLLAMA_MODEL environment variable must be set");
        let body = serde_json::json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
            "format": "json"
        });

        let retry_strategy = ExponentialBackoff::from_millis(100).map(jitter).take(3);

        let host = env::var("OLLAMA_HOST").expect("OLLAMA_HOST environment variable must be set");
        let url = format!("{}/api/generate", host);

        let request_result = Retry::spawn(retry_strategy, || async {
            self.client
                .post(&url)
                .timeout(Duration::from_secs(10))
                .json(&body)
                .send()
                .await
        })
        .await;

        match request_result {
            Ok(resp) => {
                if let Ok(json_resp) = resp.json::<serde_json::Value>().await {
                    if let Some(response_text) = json_resp.get("response").and_then(|v| v.as_str())
                    {
                        match serde_json::from_str::<serde_json::Value>(response_text) {
                            Ok(validated_json) => {
                                if let Err(errors) = COMPILED_SCHEMA.validate(&validated_json) {
                                    error!(event = "schema_validation_failed", errors = ?errors.collect::<Vec<_>>());
                                    // Record failure and use fallback
                                    let mut cb = self.circuit_breaker.lock().await;
                                    cb.record_failure();
                                    drop(cb);

                                    let fallback_ctx = self.generate_fallback_context(genre, chaos, trend);
                                    let mut ctx = self.context.lock().await;
                                    *ctx = fallback_ctx;
                                    return;
                                }

                                if let Ok(new_context) =
                                    serde_json::from_value::<AiContext>(validated_json)
                                {
                                    info!(event = "oracle_success", theme = %new_context.theme);

                                    // Record success in circuit breaker
                                    let mut cb = self.circuit_breaker.lock().await;
                                    cb.record_success();
                                    drop(cb);

                                    let mut ctx = self.context.lock().await;
                                    *ctx = new_context.clone();
                                    self.cache.insert(cache_key, new_context).await;
                                    self.metrics.record_latency(start_time.elapsed());
                                }
                            }
                            Err(e) => {
                                error!(event = "json_parse_failed", error = %e);
                                self.metrics.record_error();

                                // Record failure and use fallback
                                let mut cb = self.circuit_breaker.lock().await;
                                cb.record_failure();
                                drop(cb);

                                let fallback_ctx = self.generate_fallback_context(genre, chaos, trend);
                                let mut ctx = self.context.lock().await;
                                *ctx = fallback_ctx;
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!(event = "oracle_uplink_failed", error = %e);
                self.metrics.record_error();

                // Record failure in circuit breaker
                let mut cb = self.circuit_breaker.lock().await;
                cb.record_failure();
                drop(cb);

                // Use fallback context
                let fallback_ctx = self.generate_fallback_context(genre, chaos, trend);
                let mut ctx = self.context.lock().await;
                *ctx = fallback_ctx;
            }
        }
    }
}
