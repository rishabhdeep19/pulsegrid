import { Worker } from 'bullmq';
import axios from 'axios';
import { redisConnection } from '../configure/redis.js';

export const monitorWorker = new Worker(
'url-monitor',
async (job) => {
    const { id, name, url } = job.data;
    const start = Date.now();

    try {
    const response = await axios.get(url, { timeout: 5000 });
    const latency = Date.now() - start;

    const logEntry = {
        timestamp: new Date().toISOString(),
        status: response.status,
        latency,
        healthy: response.status >= 200 && response.status < 400,
    };

      // Store latest 30 ping metrics per endpoint directly in Redis
    await redisConnection.lpush(`metrics:${id}`, JSON.stringify(logEntry));
    await redisConnection.ltrim(`metrics:${id}`, 0, 29);

    console.log(`[UP] ${name} (${url}) -> ${response.status} in ${latency}ms`);
    return logEntry;
    } catch (error) {
    const latency = Date.now() - start;
    const logEntry = {
        timestamp: new Date().toISOString(),
        status: error.response?.status || 503,
        latency,
        healthy: false,
        error: error.message,
    };

    await redisConnection.lpush(`metrics:${id}`, JSON.stringify(logEntry));
    await redisConnection.ltrim(`metrics:${id}`, 0, 29);

    console.log(`[DOWN] ${name} (${url}) -> ${logEntry.error}`);
      throw error; // Triggers BullMQ exponential retry
    }
},
{ connection: redisConnection, concurrency: 5 }
);