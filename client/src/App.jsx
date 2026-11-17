import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Plus,
  Trash2,
  Globe,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts';
import SpatialCard from './components/SpatialCard';

const API_URL = 'http://localhost:5000/api/endpoints';

export default function App() {
  const [endpoints, setEndpoints] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [intervalMs, setIntervalMs] = useState(15000);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchEndpoints = async () => {
    try {
      const { data } = await axios.get(API_URL);
      setEndpoints(data);
    } catch (err) {
      console.error('Telemetry sync error:', err.message);
    }
  };

  useEffect(() => {
    fetchEndpoints();
    const timer = setInterval(fetchEndpoints, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setLoading(true);
    try {
      const match = url.match(/https?:\/\/[^\s\])]+/);
      const formattedUrl = match ? match[0] : `https://${url.trim()}`;
      await axios.post(API_URL, { name, url: formattedUrl, intervalMs: Number(intervalMs) });
      setName('');
      setUrl('');
      setIsAdding(false);
      await fetchEndpoints();
    } catch (err) {
      console.error('Failed to add endpoint:', err.message);
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async (e, id) => {
    e.stopPropagation();
    // Optimistically remove from UI immediately
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (err) {
      console.error('Failed to delete endpoint:', err.message);
      fetchEndpoints(); // Re-sync if backend failed
    }
  };

  const totalEndpoints = endpoints.length;
  const healthyCount = endpoints.filter((ep) => {
    const latest = ep.metrics?.[ep.metrics.length - 1];
    return !latest || latest.healthy;
  }).length;

  const avgLatency = (() => {
    const allLatest = endpoints
      .map((ep) => ep.metrics?.[ep.metrics.length - 1]?.latency)
      .filter((val) => typeof val === 'number');
    if (!allLatest.length) return 0;
    return Math.round(allLatest.reduce((a, b) => a + b, 0) / allLatest.length);
  })();

  return (
    <div className="min-h-screen px-4 py-8 md:px-10">
      {/* Floating Spatial Command Dock */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="spatial-dock mx-auto mb-10 flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-full px-6 py-3.5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <Radio className="h-5 w-5 text-sky-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              PulseGrid <span className="text-xs font-normal text-sky-400">OS</span>
            </h1>
            <p className="text-[11px] text-slate-400">Distributed BullMQ + Redis Telemetry</p>
          </div>
        </div>

        {/* Live Spatial Metrics Pills */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 border border-white/10">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">Healthy:</span>
            <span className="font-semibold text-white">
              {healthyCount}/{totalEndpoints}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 border border-white/10">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-slate-400">Mean Latency:</span>
            <span className="font-semibold text-white">{avgLatency} ms</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAdding((prev) => !prev)}
          className="flex items-center gap-2 rounded-full bg-sky-500/90 px-5 py-2 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:bg-sky-400 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Probe
        </motion.button>
      </motion.header>

      {/* Floating Spatial Modal Drawer for Adding Probes */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="spatial-glass mx-auto mb-10 max-w-3xl rounded-3xl p-6"
          >
            <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>
              <div className="md:col-span-5">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  placeholder="https://api.github.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Interval
                </label>
                <select
                  value={intervalMs}
                  onChange={(e) => setIntervalMs(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/90 px-3 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                >
                  <option value={10000}>Every 10s</option>
                  <option value={15000}>Every 15s</option>
                  <option value={30000}>Every 30s</option>
                  <option value={60000}>Every 60s</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 md:col-span-12 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-full px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.45)] hover:bg-emerald-300 transition cursor-pointer"
                >
                  {loading ? 'Scheduling...' : 'Deploy Worker Probe'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Spatial Canvas Grid */}
      <main className="mx-auto max-w-6xl">
        {endpoints.length === 0 ? (
          <div className="spatial-glass mx-auto max-w-lg rounded-3xl p-12 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-sky-400/80" />
            <h2 className="text-xl font-semibold text-white">No Active Probes in Orbit</h2>
            <p className="mt-2 text-sm text-slate-400">
              Click <span className="text-sky-400 font-medium">+ New Probe</span> above to dispatch a BullMQ worker and visualize real-time latency telemetry.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((ep) => {
              const latest = ep.metrics?.[ep.metrics.length - 1];
              const isHealthy = !latest || latest.healthy;
              const chartData = (ep.metrics || []).map((m, idx) => ({
                idx,
                latency: m.latency,
                time: new Date(m.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              }));

              return (
                <SpatialCard key={ep.id} isHealthy={isHealthy}>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isHealthy
                              ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                              : 'bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-ping'
                          }`}
                        />
                        <h3 className="font-semibold text-white tracking-tight">{ep.name}</h3>
                      </div>
                      <a
                        href={ep.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 truncate max-w-[220px]"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{ep.url}</span>
                      </a>
                    </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, ep.id)}
                    className="relative z-20 rounded-full p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
                    title="Remove Probe"
                  >
                  <Trash2 className="h-4 w-4" />
                  </button>
                  </div>

                  {/* Telemetry Metrics Row */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/10">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">Latency</p>
                      <p className="mt-0.5 text-xl font-semibold text-white">
                        {latest ? `${latest.latency} ms` : 'Pending...'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/10">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">Status</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {isHealthy ? (
                          <span className="text-xl font-semibold text-emerald-400">
                            {latest ? latest.status : 'INIT'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-lg font-semibold text-rose-400">
                            <AlertTriangle className="h-4 w-4" />
                            {latest?.status || 'ERR'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Latency Area Sparkline */}
                  <div className="mt-5 h-28 w-full rounded-2xl bg-black/25 p-2 border border-white/5">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id={`grad-${ep.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={isHealthy ? '#38bdf8' : '#f43f5e'}
                                stopOpacity={0.45}
                              />
                              <stop
                                offset="95%"
                                stopColor={isHealthy ? '#38bdf8' : '#f43f5e'}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.85)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#fff',
                            }}
                            formatter={(value) => [`${value} ms`, 'Latency']}
                          />
                          <Area
                            type="monotone"
                            dataKey="latency"
                            stroke={isHealthy ? '#38bdf8' : '#f43f5e'}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#grad-${ep.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        Waiting for first worker ping...
                      </div>
                    )}
                  </div>
                </SpatialCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}