import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'node:http';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { vibeStore } from '../utils/stateStore';

export class WebSocketGateway {
  private readonly wss: WebSocketServer;
  private backendClient: WebSocket | null = null;
  private reconnectionTimeout: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection established');

      ws.on('message', (message: string) => {
        logger.debug('Received WS message:', message.toString());
        this.broadcast(message.toString());
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket Error:', error);
      });

      ws.send(JSON.stringify({ type: 'WELCOME', message: 'VIBES WS GATEWAY ACTIVE' }));
    });

    this.connectToBackend();
    logger.info('WebSocket Gateway initialized and attached to HTTP server');
  }

  private connectToBackend() {
    const backendUrl = env.BACKEND_URL;
    logger.info(`Attempting uplink to Backend: ${backendUrl}`);

    const connect = () => {
      if (this.reconnectionTimeout) {
        clearTimeout(this.reconnectionTimeout);
        this.reconnectionTimeout = null;
      }

      this.backendClient = new WebSocket(backendUrl);

      this.backendClient.on('open', () => {
        logger.info('Connected to Backend WebSocket Uplink');
      });

      this.backendClient.on('message', (data: string) => {
        try {
          const state = JSON.parse(data.toString());
          vibeStore.update(state);
          // Relay backend state machine updates to all middleware clients
          this.broadcast(data.toString());
        } catch (e) {
          logger.error('Failed to parse backend message:', e);
        }
      });

      this.backendClient.on('close', () => {
        logger.warn('Uplink to Backend lost. Retrying in 5s...');
        this.reconnectionTimeout = setTimeout(connect, 5000);
      });

      this.backendClient.on('error', (err) => {
        logger.error('Backend Uplink Error:', err.message);
        if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCKS === 'true') {
          import('../mocks/vibeMocker').then(({ vibeMocker }) => vibeMocker.start());
        }
      });
    };

    connect();
  }

  public broadcast(message: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public cleanup() {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }
    if (this.backendClient) {
      this.backendClient.close();
    }
    this.wss.close();
    logger.info('WebSocket Gateway resources released');
  }
}
