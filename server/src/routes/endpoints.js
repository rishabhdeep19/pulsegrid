import express from 'express';
import { redisConnection } from '../configure/redis.js';
import { scheduleEndpointCheck, monitorQueue } from '../queues/monitorQueue.js';

const router = express.Router();

// Register a new URL to monitor
router.post('/', async (req, res) => {
const { name, url, intervalMs = 15000 } = req.body;
if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
}

const id = Date.now().toString();
const endpoint = { id, name, url, intervalMs, createdAt: new Date().toISOString() };

await redisConnection.hset('endpoints', id, JSON.stringify(endpoint));
await scheduleEndpointCheck(endpoint);

res.status(201).json(endpoint);
});

// Fetch all monitored URLs + their latest 30 latency metrics
router.get('/', async (req, res) => {
const rawEndpoints = await redisConnection.hgetall('endpoints');
const endpoints = await Promise.all(
    Object.values(rawEndpoints).map(async (item) => {
    const ep = JSON.parse(item);
    const rawMetrics = await redisConnection.lrange(`metrics:${ep.id}`, 0, 29);
    return {
        ...ep,
        metrics: rawMetrics.map((m) => JSON.parse(m)).reverse(),
    };
    })
);

res.json(endpoints);
});

// Delete a monitored URL and remove its repeatable job
router.delete('/:id', async (req, res) => {
const { id } = req.params;
try {
    await redisConnection.hdel('endpoints', id);
    await redisConnection.del(`metrics:${id}`);

    const repeatableJobs = await monitorQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
    if (job.id === `monitor-${id}` || job.key?.includes(id)) {
        await monitorQueue.removeRepeatableByKey(job.key);
    }
    }

    console.log(`🗑️ Deleted endpoint ${id}`);
    res.json({ deleted: id });
} catch (err) {
    console.error('Delete route error:', err);
    res.status(500).json({ error: err.message });
}
});

export default router;