import { Queue } from 'bullmq';
import { redis } from '../db/redis';

const connection = { host: redis.options.host, port: redis.options.port as number };

// One queue per worker type
export const ingestionQueue = new Queue('ingestion', { connection });
export const matchingQueue = new Queue('matching', { connection });
export const aiScoringQueue = new Queue('ai-scoring', { connection });
export const notificationQueue = new Queue('notification', { connection });
export const bankOfferQueue = new Queue('bank-offer', { connection });

export const QUEUE_NAMES = {
  INGESTION: 'ingestion',
  MATCHING: 'matching',
  AI_SCORING: 'ai-scoring',
  NOTIFICATION: 'notification',
  BANK_OFFER: 'bank-offer',
} as const;
