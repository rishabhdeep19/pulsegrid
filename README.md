# PulseGrid OS

A distributed API latency and health telemetry dashboard featuring a visionOS-inspired 3D Spatial UI, BullMQ background workers, and Upstash Redis time-series persistence.

**Live Demo:** [pulsegrid-jrg1920.vercel.app](https://pulsegrid-jrg1920.vercel.app)

---

## Architecture & System Flow

1. **Probe Registration (`POST /api/endpoints`):** Users register target endpoints through the Spatial UI (with built-in URL sanitization to strip accidental Markdown formatting).
2. **Distributed Scheduling (BullMQ + Upstash Redis):** The Express backend persists probe metadata in Redis and schedules repeatable BullMQ worker jobs (`concurrency: 5`) with 3x exponential retry backoff for outage resilience.
3. **Time-Series Telemetry:** Each worker measures HTTP response status and round-trip latency, storing capped rolling history windows in Redis via `LPUSH` and `LTRIM`.
4. **Real-Time Spatial Dashboard:** The React frontend polls `/api/endpoints` every 5 seconds, rendering live Recharts sparklines, aggregate fleet health (`Healthy` ratio and `Mean Latency`), and crimson glass outage alerts.

---

## Key Features

- **3D Spatial Glass UI:** Spring-physics card tilt interactions built with Framer Motion and Tailwind CSS v4.
- **Automated Outage Detection & Retries:** Immediate visual incident highlighting on `4xx`/`5xx` or timeout responses, paired with BullMQ exponential backoff retries.
- **Live Telemetry Sparklines:** Real-time latency wave visualizations per service using Recharts.
- **Input URL Sanitizer:** Automatically cleans pasted Markdown links into valid `http(s)://` endpoints prior to queue dispatch.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons |
| **Backend** | Node.js, Express, BullMQ, ioredis |
| **Database & Queue** | Upstash Redis (Serverless persistence + BullMQ broker) |
| **Deployment** | Vercel (Frontend), Render (Backend Web Service) |

---

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- An [Upstash Redis](https://upstash.com) database URL (`rediss://...`)

### 1. Clone the Repository
```bash
git clone [https://github.com/rishabhdeep19/pulsegrid.git](https://github.com/rishabhdeep19/pulsegrid.git)
cd pulsegrid
```

### 2. Configure & Start the Backend (`server/`)
```bash
cd server
npm install
```
Create a `.env` file inside `server/`:
```env
PORT=5000
REDIS_URL=rediss://default:YOUR_UPSTASH_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```
Start the API server and BullMQ worker:
```bash
node src/index.js
```

### 3. Start the Frontend (`client/`)
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/endpoints` | Fetch all registered probes along with their latest latency history and status |
| `POST` | `/api/endpoints` | Register a new endpoint (`{ "name": "...", "url": "..." }`) and schedule its BullMQ probe job |
| `DELETE` | `/api/endpoints/:id` | Remove an endpoint from Redis and cancel its repeatable background job |
