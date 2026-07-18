import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { createSocketServer } from './realtime/socket';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`BiteDash API listening on port ${env.PORT}`);
});

createSocketServer(server);

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
