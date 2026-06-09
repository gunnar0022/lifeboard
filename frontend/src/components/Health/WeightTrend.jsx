import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus, Plus, Check, X, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '../../hooks/useApi';
import './WeightTrend.css';

const CHART_W = 600;
const CHART_H = 140;
const PAD = { top: 10, right: 20, bottom: 24, left: 44 };
const todayStr = () => new Date().toISOString().split('T')[0];

function WeightChart({ data }) {
  const [hover, setHover] = useState(null);

  if (data.length < 2) return null;

  const weights = data.map(d => d.kg);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const rangeW = maxW - minW || 1;

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * plotW,
    y: PAD.top + (1 - (d.kg - minW) / rangeW) * plotH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`;

  const ticks = [];
  const step = rangeW > 3 ? 1 : 0.5;
  for (let v = Math.ceil(minW / step) * step; v <= maxW; v += step) {
    ticks.push(v);
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="weight-trend__svg"
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-health-body)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-health-body)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map(v => {
        const y = PAD.top + (1 - (v - minW) / rangeW) * plotH;
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="3,3" />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" className="weight-trend__tick">{v.toFixed(1)}</text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#weightGrad)" />
      <path d={linePath} fill="none" stroke="var(--color-health-body)" strokeWidth="2" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r={hover === i ? 5 : 3}
          fill={hover === i ? 'var(--color-health-body)' : 'var(--bg-card)'}
          stroke="var(--color-health-body)" strokeWidth="2"
          onMouseEnter={() => setHover(i)}
          style={{ cursor: 'default' }}
        />
      ))}

      {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
        <text key={i} x={points[i].x} y={CHART_H - 4} textAnchor="middle" className="weight-trend__date-label">
          {data[i].date.slice(5)}
        </text>
      ))}

      {hover !== null && (
        <text x={points[hover].x} y={points[hover].y - 10} textAnchor="middle" className="weight-trend__hover-label">
          {points[hover].kg.toFixed(1)} kg
        </text>
      )}
    </svg>
  );
}

export default function WeightTrend({ measurements, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState(todayStr());
  const [newKg, setNewKg] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [showLog, setShowLog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editKg, setEditKg] = useState('');
  const [editDate, setEditDate] = useState('');
  const [busyId, setBusyId] = useState(null);

  const data = useMemo(() => {
    if (!measurements) return [];
    return [...measurements]
      .filter(m => m.weight_g)
      .reverse()
      .map(m => ({ date: m.date, kg: m.weight_g / 1000 }));
  }, [measurements]);

  const handleAdd = async () => {
    if (!newKg) return;
    setSaving(true);
    try {
      await apiPost('/api/health_body/measurements', {
        weight_g: Math.round(parseFloat(newKg) * 1000),
        date: newDate,
        notes: newNotes.trim() || null,
      });
      setNewKg('');
      setNewNotes('');
      setNewDate(todayStr());
      setAdding(false);
      onRefresh?.();
    } catch (e) {
      console.error('Failed to add measurement:', e);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setEditKg((m.weight_g / 1000).toFixed(1));
    setEditDate(m.date);
  };

  const handleSaveEdit = async (id) => {
    setBusyId(id);
    try {
      await apiPut(`/api/health_body/measurements/${id}`, {
        weight_g: Math.round(parseFloat(editKg) * 1000),
        date: editDate,
      });
      setEditId(null);
      onRefresh?.();
    } catch (e) {
      console.error('Failed to edit measurement:', e);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await apiDelete(`/api/health_body/measurements/${id}`);
      onRefresh?.();
    } catch (e) {
      console.error('Failed to delete measurement:', e);
    } finally {
      setBusyId(null);
    }
  };

  // Trend summary (chart needs >= 2 points)
  let trendEl = null;
  if (data.length >= 2) {
    const first = data[0].kg;
    const last = data[data.length - 1].kg;
    const diff = last - first;
    const TrendIcon = diff < -0.3 ? TrendingDown : diff > 0.3 ? TrendingUp : Minus;
    const trendColor = diff < -0.3 ? 'var(--color-success)' : diff > 0.3 ? 'var(--color-alert)' : 'var(--text-tertiary)';
    trendEl = (
      <div className="weight-trend__current" style={{ color: trendColor }}>
        <TrendIcon size={16} />
        <span className="mono">{last.toFixed(1)} kg</span>
        <span className="weight-trend__diff mono">({diff > 0 ? '+' : ''}{diff.toFixed(1)})</span>
      </div>
    );
  } else if (data.length === 1) {
    trendEl = (
      <div className="weight-trend__current">
        <span className="mono">{data[0].kg.toFixed(1)} kg</span>
      </div>
    );
  }

  return (
    <div className="weight-trend card">
      <div className="weight-trend__header">
        <h3 className="weight-trend__title">Weight Trend</h3>
        <div className="weight-trend__header-right">
          {trendEl}
          <button className="weight-trend__add-toggle" onClick={() => setAdding(a => !a)} title="Log weight">
            <Plus size={14} /> Log
          </button>
        </div>
      </div>

      {adding && (
        <div className="weight-trend__add-form">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="weight-trend__input" />
          <input type="number" step="0.1" value={newKg} onChange={e => setNewKg(e.target.value)} placeholder="kg" className="weight-trend__input weight-trend__input--num" />
          <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes (optional)" className="weight-trend__input weight-trend__input--notes" />
          <button className="weight-trend__btn weight-trend__btn--save" onClick={handleAdd} disabled={saving || !newKg}>
            <Check size={14} />
          </button>
          <button className="weight-trend__btn" onClick={() => setAdding(false)} disabled={saving}>
            <X size={14} />
          </button>
        </div>
      )}

      {data.length >= 2 && <WeightChart data={data} />}
      {data.length === 0 && !adding && (
        <p className="weight-trend__empty">No weigh-ins yet. Click “Log” to add one.</p>
      )}

      {measurements && measurements.length > 0 && (
        <div className="weight-trend__log">
          <button className="weight-trend__log-toggle" onClick={() => setShowLog(s => !s)}>
            {showLog ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            History ({measurements.length})
          </button>
          {showLog && (
            <div className="weight-trend__log-list">
              {measurements.map(m => (
                <div key={m.id} className="weight-trend__log-item">
                  {editId === m.id ? (
                    <>
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="weight-trend__input" />
                      <input type="number" step="0.1" value={editKg} onChange={e => setEditKg(e.target.value)} className="weight-trend__input weight-trend__input--num" />
                      <button className="weight-trend__btn weight-trend__btn--save" onClick={() => handleSaveEdit(m.id)} disabled={busyId === m.id}>
                        <Check size={13} />
                      </button>
                      <button className="weight-trend__btn" onClick={() => setEditId(null)} disabled={busyId === m.id}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="weight-trend__log-date mono">{m.date}</span>
                      <span className="weight-trend__log-kg mono">{(m.weight_g / 1000).toFixed(1)} kg</span>
                      {m.notes && <span className="weight-trend__log-notes">{m.notes}</span>}
                      <button className="weight-trend__btn weight-trend__btn--icon" onClick={() => startEdit(m)} title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button className="weight-trend__btn weight-trend__btn--icon weight-trend__btn--danger" onClick={() => handleDelete(m.id)} disabled={busyId === m.id} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
