use crate::state_machine::GlobalState;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::broadcast;
use futures_util::{stream::StreamExt, SinkExt};

pub struct AppState {
    pub tx: broadcast::Sender<GlobalState>,
    pub director: Arc<crate::llm_engine::LlmDirector>,
}

pub async fn start_server(
    tx: broadcast::Sender<GlobalState>,
    director: Arc<crate::llm_engine::LlmDirector>,
) {
    let app_state = Arc::new(AppState { tx, director });

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/api/v1/ai/metrics", get(metrics_handler))
        .with_state(app_state);

    let port = std::env::var("PORT").expect("PORT environment variable must be set");
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
    println!("API/WebSocket server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn metrics_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let metrics = state.director.metrics.get_snapshot();
    axum::Json(metrics)
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<Arc<AppState>>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

// Incoming Telemetry Schema
#[derive(serde::Deserialize, Debug)]
struct ClientTelemetry {
    boredom_score: f32,
    // Add other cues here: human_activity, etc.
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    // 1. Spawn Sender Task (Server -> Client)
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json = serde_json::to_string(&msg).unwrap();
            if sender.send(Message::Text(json.into())).await.is_err() {
                break;
            }
        }
    });

    // 2. Spawn Receiver Task (Client -> Server)
    let director_ref = state.director.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                if let Ok(telemetry) = serde_json::from_str::<ClientTelemetry>(&text) {
                    //Pass to AI Director
                    director_ref.update_boredom(telemetry.boredom_score).await;
                }
            }
        }
    });

    // 3. Wait for either to finish (disconnection)
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
