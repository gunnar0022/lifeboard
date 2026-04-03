import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor, Cpu, MemoryStick, HardDrive, Network, Activity,
  Server, Database, Container,
} from 'lucide-react';
import './SystemHealthPanel.css';

const POLL_INTERVAL = 5000;

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

function formatRate(bytesPerSec) {
  if (bytesPerSec === null || bytesPerSec === undefined) return 'measuring...';
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function UsageBar({ percent, color = 'var(--color-health)' }) {
  return (
    <div className="sh-bar">
      <div
        className="sh-bar__fill"
        style={{ width: `${Math.min(percent, 100)}%`, background: color }}
      />
    </div>
  );
}

function PercentColor(pct) {
  if (pct < 60) return 'var(--color-success)';
  if (pct < 85) return '#f59e0b';
  return 'var(--color-alert)';
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function SystemHealthPanel() {
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef(null);

  const fetchHealth = () => {
    fetch('/api/system-health')
      .then(r => {
        if (!r.ok) throw new Error('Not ok');
        return r.json();
      })
      .then(d => {
        if (!d || !d.system) throw new Error('Invalid data');
        setData(d);
        setLastUpdated(new Date());
        setError(false);
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    fetchHealth();
    intervalRef.current = setInterval(fetchHealth, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (!data) {
    return (
      <div className="sh-panel">
        <div className="sh-panel__header">
          <div className="sh-panel__title-group">
            <span className="sh-panel__icon"><Monitor size={24} /></span>
            <h2 className="sh-panel__title">System Health</h2>
          </div>
        </div>
        <div className="sh-panel__loading">
          <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="skeleton" style={{ height: 140, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 140, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 140, borderRadius: 12 }} />
          </div>
          <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  const { system, cpu, memory, disk, network, top_processes, services } = data;

  return (
    <motion.div
      className="sh-panel"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="sh-panel__header">
        <div className="sh-panel__title-group">
          <span className="sh-panel__icon"><Monitor size={24} /></span>
          <h2 className="sh-panel__title">System Health</h2>
        </div>
        <div className="sh-panel__status">
          <span className={`sh-panel__pulse ${error ? 'sh-panel__pulse--error' : ''}`} />
          <span className="sh-panel__last-updated">
            {error ? 'Connection lost' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
          </span>
        </div>
      </motion.div>

      {/* System Identity */}
      <motion.div variants={fadeUp} className="sh-identity card">
        <div className="sh-identity__item">
          <span className="sh-identity__label">Host</span>
          <span className="sh-identity__value">{system.hostname}</span>
        </div>
        <div className="sh-identity__item">
          <span className="sh-identity__label">macOS</span>
          <span className="sh-identity__value">{system.macos_version}</span>
        </div>
        <div className="sh-identity__item">
          <span className="sh-identity__label">Chip</span>
          <span className="sh-identity__value">{system.chip} ({system.architecture})</span>
        </div>
        <div className="sh-identity__item">
          <span className="sh-identity__label">Uptime</span>
          <span className="sh-identity__value">{formatUptime(system.uptime_seconds)}</span>
        </div>
      </motion.div>

      {/* Resource Gauges */}
      <motion.div variants={fadeUp} className="sh-gauges">
        {/* CPU */}
        <div className="sh-gauge card">
          <div className="sh-gauge__header">
            <Cpu size={16} />
            <span>CPU</span>
          </div>
          <div className="sh-gauge__big-number" style={{ color: PercentColor(cpu.overall_percent) }}>
            {cpu.overall_percent.toFixed(1)}%
          </div>
          <UsageBar percent={cpu.overall_percent} color={PercentColor(cpu.overall_percent)} />
          <div className="sh-gauge__detail">{cpu.core_count} cores</div>
          {cpu.temperature_celsius !== null && (
            <div className="sh-gauge__detail">{cpu.temperature_celsius}°C</div>
          )}
          <div className="sh-cores">
            {cpu.per_core_percent.map((pct, i) => (
              <div
                key={i}
                className="sh-cores__cell"
                style={{ background: PercentColor(pct), opacity: 0.3 + (pct / 100) * 0.7 }}
                title={`Core ${i}: ${pct}%`}
              />
            ))}
          </div>
        </div>

        {/* Memory */}
        <div className="sh-gauge card">
          <div className="sh-gauge__header">
            <MemoryStick size={16} />
            <span>Memory</span>
          </div>
          <div className="sh-gauge__big-number" style={{ color: PercentColor(memory.percent) }}>
            {memory.percent.toFixed(1)}%
          </div>
          <UsageBar percent={memory.percent} color={PercentColor(memory.percent)} />
          <div className="sh-gauge__detail">
            {formatBytes(memory.used_bytes)} / {formatBytes(memory.total_bytes)}
          </div>
          <div className="sh-gauge__detail sh-gauge__detail--muted">
            Available: {formatBytes(memory.available_bytes)}
          </div>
          {memory.swap_used_bytes > 0 && (
            <div className="sh-gauge__detail sh-gauge__detail--muted">
              Swap: {formatBytes(memory.swap_used_bytes)} / {formatBytes(memory.swap_total_bytes)}
            </div>
          )}
        </div>

        {/* Disk */}
        <div className="sh-gauge card">
          <div className="sh-gauge__header">
            <HardDrive size={16} />
            <span>Disk</span>
          </div>
          {disk.volumes.map(vol => (
            <div key={vol.mount_point}>
              <div className="sh-gauge__big-number" style={{ color: PercentColor(vol.percent) }}>
                {vol.percent.toFixed(1)}%
              </div>
              <UsageBar percent={vol.percent} color={PercentColor(vol.percent)} />
              <div className="sh-gauge__detail">
                {formatBytes(vol.used_bytes)} / {formatBytes(vol.total_bytes)}
              </div>
              <div className="sh-gauge__detail sh-gauge__detail--muted">
                Free: {formatBytes(vol.free_bytes)}
              </div>
            </div>
          ))}
          <div className="sh-gauge__detail sh-gauge__detail--muted">
            <Database size={12} /> DB: {formatBytes(disk.lifeboard_db_size_bytes)}
          </div>
        </div>
      </motion.div>

      {/* Network */}
      <motion.div variants={fadeUp} className="sh-network card">
        <div className="sh-network__header">
          <Network size={16} />
          <span>Network</span>
        </div>
        <div className="sh-network__rates">
          <div className="sh-network__rate">
            <span className="sh-network__rate-label">Download</span>
            <span className="sh-network__rate-value mono">{formatRate(network.recv_rate_bytes_per_sec)}</span>
          </div>
          <div className="sh-network__rate">
            <span className="sh-network__rate-label">Upload</span>
            <span className="sh-network__rate-value mono">{formatRate(network.send_rate_bytes_per_sec)}</span>
          </div>
          <div className="sh-network__rate">
            <span className="sh-network__rate-label">Total Recv</span>
            <span className="sh-network__rate-value mono">{formatBytes(network.bytes_recv_total)}</span>
          </div>
          <div className="sh-network__rate">
            <span className="sh-network__rate-label">Total Sent</span>
            <span className="sh-network__rate-value mono">{formatBytes(network.bytes_sent_total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Top Processes */}
      <motion.div variants={fadeUp} className="sh-processes">
        <div className="sh-procs-table card">
          <div className="sh-procs-table__header">
            <Activity size={16} />
            <span>Top by CPU</span>
          </div>
          <div className="sh-procs-table__list">
            <div className="sh-procs-table__row sh-procs-table__row--header">
              <span>Process</span>
              <span>PID</span>
              <span>CPU</span>
              <span>Memory</span>
            </div>
            {top_processes.by_cpu.map(p => (
              <div key={`cpu-${p.pid}`} className="sh-procs-table__row">
                <span className="sh-procs-table__name">{p.name}</span>
                <span className="mono">{p.pid}</span>
                <span className="mono">{p.cpu_percent.toFixed(1)}%</span>
                <span className="mono">{p.memory_mb} MB</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sh-procs-table card">
          <div className="sh-procs-table__header">
            <MemoryStick size={16} />
            <span>Top by Memory</span>
          </div>
          <div className="sh-procs-table__list">
            <div className="sh-procs-table__row sh-procs-table__row--header">
              <span>Process</span>
              <span>PID</span>
              <span>CPU</span>
              <span>Memory</span>
            </div>
            {top_processes.by_memory.map(p => (
              <div key={`mem-${p.pid}`} className="sh-procs-table__row">
                <span className="sh-procs-table__name">{p.name}</span>
                <span className="mono">{p.pid}</span>
                <span className="mono">{p.cpu_percent.toFixed(1)}%</span>
                <span className="mono">{p.memory_mb} MB</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Services */}
      <motion.div variants={fadeUp} className="sh-services card">
        <div className="sh-services__header">
          <Server size={16} />
          <span>LifeBoard Services</span>
        </div>
        <div className="sh-services__list">
          <div className="sh-services__item">
            <span className="sh-services__dot sh-services__dot--ok" />
            <span className="sh-services__name">FastAPI</span>
            <span className="sh-services__detail mono">
              PID {services.fastapi.pid} · {services.fastapi.memory_mb} MB · up {formatUptime(services.fastapi.uptime_seconds)}
            </span>
          </div>
          <div className="sh-services__item">
            <span className="sh-services__dot sh-services__dot--ok" />
            <span className="sh-services__name">SQLite DB</span>
            <span className="sh-services__detail mono">{formatBytes(services.db_size_bytes)}</span>
          </div>
          {services.docker_containers.length > 0 ? (
            services.docker_containers.map(c => (
              <div key={c.id} className="sh-services__item">
                <span className={`sh-services__dot ${c.status?.includes('Up') ? 'sh-services__dot--ok' : 'sh-services__dot--warn'}`} />
                <span className="sh-services__name">{c.name}</span>
                <span className="sh-services__detail mono">{c.image} · {c.status}</span>
              </div>
            ))
          ) : (
            <div className="sh-services__item">
              <span className="sh-services__dot sh-services__dot--grey" />
              <span className="sh-services__name">Docker</span>
              <span className="sh-services__detail">No containers</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
