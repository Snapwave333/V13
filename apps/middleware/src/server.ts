import http from 'node:http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import { WebSocketGateway } from './websocket/gateway';

dotenv.config();

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Initialize WebSocket Gateway
export const wsGateway = new WebSocketGateway(server);

server.listen(PORT, () => {
  logger.info(`Middleware Service running on port ${PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
