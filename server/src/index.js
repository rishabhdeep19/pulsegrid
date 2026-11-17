import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import endpointsRouter from './routes/endpoints.js';
import './queues/monitorWorker.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/endpoints', endpointsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`🚀 PulseGrid server running on http://localhost:${PORT}`);
});