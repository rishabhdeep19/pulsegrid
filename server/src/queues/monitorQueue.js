import { Queue } from 'bullmq';
import { redisConnection } from '../configure/redis.js';

export const monitorQueue = new Queue('url-monitor', {
connection: redisConnection,
});

export async function scheduleEndpointCheck(endpoint) {
await monitorQueue.add(
    'ping-url',
    endpoint,
    {
    jobId: `monitor-${endpoint.id}`,
    repeat: { every: endpoint.intervalMs || 15000 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 50,
    }
);
}