/**
 * Widget render registry: id → React component.
 * Every component pulls from useHealthData(); none fetch their own
 * data directly (except components delegated to existing tiles).
 */
import {
  Heart, Moon, Footprints, Activity, BedDouble, Sunrise,
  Wind, Droplets, Battery, AlertTriangle, RefreshCw, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { useHealthData } from './DataContext';
import {
  STAGE_COLORS, STAGE_ORDER, STAGE_LABELS,
  fmtDur, fmtMin, fmtTimeAgo,
  ScoreBadge, HypnogramBar, DeltaPill, StatBlock,
  StagesStackedBar, ScheduleScatter, MetricSparkline, ComparisonTable,
} from './primitives';

// Existing components we wrap as widgets
import ProfileCard from '../Health/ProfileCard';
import Heatmap from '../Health/Heatmap';
import RecentDetail from '../Health/RecentDetail';
import FoodDatabase from '../Health/FoodDatabase';
import MealEntry from '../Health/MealEntry';
import ConcernsTracker from '../Health/ConcernsTracker';
import WeightTrend from '../Health/WeightTrend';

// ──────────── Helpers ────────────
function EmptyMini({ children }) {
  return <div className="hd-empty-mini">{children}</div>;
}

function NeedsGarmin() {
  return (
    <EmptyMini>
      <Activity size={14} /> No Garmin data for this window yet.
    </EmptyMini>
  );
}

// ╔═══════════════════════════════════════════════════════════╗
// ║ SLEEP WIDGETS                                              ║
// ╚═══════════════════════════════════════════════════════════╝

function SleepLastNight() {
  const { garmin } = useHealthData();
  const ln = garmin?.last_night;
  if (!ln) return <NeedsGarmin />;

  const totals = ln.stages || {};
  const totalSec = (totals.deep || 0) + (totals.light || 0) + (totals.rem || 0) + (totals.awake || 0);
  const pct = (s) => totalSec > 0 ? Math.round(((totals[s] || 0) / totalSec) * 100) : 0;

  return (
    <motion.div className="hd-hero" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="hd-hero__top">
        <div className="hd-hero__times">
          <BedDouble size={14} />
          <strong>{ln.bedtime || '—'}</strong>
          <span className="hd-hero__arrow">→</span>
          <Sunrise size={14} />
          <strong>{ln.wake || '—'}</strong>
        </div>
        <div className="hd-hero__score">
          <ScoreBadge score={ln.score} />
          <span className="hd-hero__duration">{fmtDur(ln.duration_seconds)}</span>
        </div>
      </div>
      <HypnogramBar segments={ln.hypnogram} bedtime={ln.bedtime} wake={ln.wake} />
      <div className="hd-hero__stages">
        {STAGE_ORDER.map(s => (
          <div key={s} className="hd-hero__stage">
            <span className="hd-legend__swatch" style={{ background: STAGE_COLORS[s] }} />
            <span className="hd-hero__stage-label">{STAGE_LABELS[s]}</span>
            <span className="hd-hero__stage-val">{fmtDur(totals[s])}</span>
            <span className="hd-hero__stage-pct">{pct(s)}%</span>
          </div>
        ))}
      </div>
      <div className="hd-hero__quals">
        {ln.awake_count != null && <span><Activity size={12} /> {ln.awake_count} awakening{ln.awake_count === 1 ? '' : 's'}</span>}
        {ln.avg_respiration != null && <span><Wind size={12} /> {ln.avg_respiration} br/min</span>}
        {ln.avg_spo2 != null && <span><Droplets size={12} /> SpO₂ {Math.round(ln.avg_spo2)}%{ln.lowest_spo2 != null ? ` (low ${ln.lowest_spo2})` : ''}</span>}
        {ln.avg_sleep_stress != null && <span>stress {Math.round(ln.avg_sleep_stress)}</span>}
      </div>
      {ln.score_insight && <p className="hd-hero__insight">{ln.score_insight}</p>}
    </motion.div>
  );
}

function SleepStagesTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return <StagesStackedBar timeline={garmin.timeline} />;
}

function SleepScheduleConsistency() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return <ScheduleScatter timeline={garmin.timeline} bedtimeStats={garmin.stats?.bedtime} wakeStats={garmin.stats?.wake} />;
}

function SleepScoreTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return (
    <MetricSparkline timeline={garmin.timeline} metric="score" color={STAGE_COLORS.rem} />
  );
}

function SleepStressTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return (
    <MetricSparkline timeline={garmin.timeline} metric="avg_sleep_stress" color="#A78BFA" />
  );
}

// ╔═══════════════════════════════════════════════════════════╗
// ║ BODY WIDGETS                                               ║
// ╚═══════════════════════════════════════════════════════════╝

function BodyKeyStats() {
  const { garmin } = useHealthData();
  if (!garmin?.stats) return <NeedsGarmin />;
  const stats = garmin.stats;
  const cmp = (k) => garmin.comparison?.[k];

  return (
    <div className="hd-grid">
      <StatBlock
        icon={Heart} label="Resting HR"
        value={stats.rhr ? `${Math.round(stats.rhr.mean)} bpm` : '—'}
        sub={stats.rhr ? `range ${stats.rhr.min}–${stats.rhr.max}` : null}
        delta={cmp('rhr') && <DeltaPill comparison={cmp('rhr')} />}
      />
      <StatBlock
        icon={Battery} label="Body Battery"
        value={stats.body_battery_max ? `${Math.round(stats.body_battery_max.mean)}` : '—'}
        sub={stats.body_battery_min ? `low ${Math.round(stats.body_battery_min.mean)}` : null}
        delta={cmp('body_battery_max') && <DeltaPill comparison={cmp('body_battery_max')} />}
      />
      <StatBlock
        icon={Footprints} label="Steps"
        value={stats.steps ? Math.round(stats.steps.mean).toLocaleString() : '—'}
        sub={stats.steps ? `peak ${stats.steps.max.toLocaleString()}` : null}
        delta={cmp('steps') && <DeltaPill comparison={cmp('steps')} formatter={(v) => Math.abs(Math.round(v)).toLocaleString()} />}
      />
      <StatBlock
        icon={Activity} label="Stress"
        value={stats.stress_avg ? Math.round(stats.stress_avg.mean) : '—'}
        sub={stats.stress_avg ? `peak ${stats.stress_avg.max}` : null}
        delta={cmp('stress_avg') && <DeltaPill comparison={cmp('stress_avg')} />}
      />
      <StatBlock
        icon={Wind} label="Avg respiration"
        value={stats.avg_respiration ? `${stats.avg_respiration.mean.toFixed(1)} br/min` : '—'}
      />
      <StatBlock
        icon={Droplets} label="Avg SpO₂"
        value={stats.avg_spo2 ? `${Math.round(stats.avg_spo2.mean)}%` : '—'}
        sub={stats.lowest_spo2 ? `low ${Math.round(stats.lowest_spo2.mean)}%` : null}
      />
    </div>
  );
}

function BodyRhrTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return <MetricSparkline timeline={garmin.timeline} metric="rhr" color="#F87171" unit="bpm" />;
}

function BodyStepsTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return <MetricSparkline timeline={garmin.timeline} metric="steps" color="#34D399" fmt={(v) => v?.toLocaleString()} />;
}

function BodyBatteryTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return <MetricSparkline timeline={garmin.timeline} metric="body_battery_max" color="#F59E0B" />;
}

function BodyStressTrend() {
  const { garmin } = useHealthData();
  if (!garmin?.timeline?.length) return <NeedsGarmin />;
  return <MetricSparkline timeline={garmin.timeline} metric="stress_avg" color="#FB923C" />;
}

// ╔═══════════════════════════════════════════════════════════╗
// ║ COMPARE                                                    ║
// ╚═══════════════════════════════════════════════════════════╝

function ComparePeriod() {
  const { garmin, rangeDays } = useHealthData();
  if (!garmin?.comparison) return <NeedsGarmin />;
  return (
    <>
      <div className="hd-section__sub">
        Last {rangeDays}d vs prior {garmin.prior_window_days}d
      </div>
      <ComparisonTable comparison={garmin.comparison} meta={garmin.metric_meta} />
    </>
  );
}

// ╔═══════════════════════════════════════════════════════════╗
// ║ HEALTH PROFILE / NUTRITION                                 ║
// ╚═══════════════════════════════════════════════════════════╝

function HealthProfile() {
  const { profile, refetch } = useHealthData();
  return <ProfileCard profile={profile} onUpdate={refetch} />;
}

function HealthCalorieHeatmap() {
  const { heatmap } = useHealthData();
  if (!heatmap || (Array.isArray(heatmap) && heatmap.length === 0)) {
    return <EmptyMini>No calorie data yet.</EmptyMini>;
  }
  return <Heatmap data={heatmap || []} />;
}

function HealthRecentDetail() {
  const { recent, refetch } = useHealthData();
  if (!recent || (Array.isArray(recent) && recent.length === 0)) {
    return <EmptyMini>No recent days logged.</EmptyMini>;
  }
  return <RecentDetail days={recent || []} onRefresh={refetch} />;
}

function HealthMealEntry() {
  const { refetch } = useHealthData();
  return <MealEntry onSuccess={refetch} />;
}

function HealthFoodDatabase() {
  return <FoodDatabase />;
}

function HealthConcerns() {
  const { concerns, refetch } = useHealthData();
  return <ConcernsTracker concerns={concerns} onUpdate={refetch} />;
}

// ╔═══════════════════════════════════════════════════════════╗
// ║ FITNESS                                                    ║
// ╚═══════════════════════════════════════════════════════════╝

function FitnessWeightTrend() {
  const { measurements, refetch } = useHealthData();
  return <WeightTrend measurements={measurements || []} onRefresh={refetch} />;
}

// ╔═══════════════════════════════════════════════════════════╗
// ║ SYSTEM                                                     ║
// ╚═══════════════════════════════════════════════════════════╝

function SystemGarminSync() {
  const { garminStatus, refetch } = useHealthData();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await fetch('/api/garmin/ingest', { method: 'POST' });
      const j = await r.json();
      setSyncResult(j.ok ? 'ok' : (j.error || 'failed'));
      if (j.ok) await refetch();
    } catch (e) {
      setSyncResult(String(e));
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 4000);
    }
  };

  const isStale = garminStatus?.last_run && (Date.now() - new Date(garminStatus.last_run).getTime()) > 4 * 3600000;
  const hasFailed = garminStatus?.status === 'failure';

  return (
    <div className="hd-sync">
      <div className="hd-sync__row">
        <span className="hd-sync__label">Last sync</span>
        <span className="hd-sync__time">{fmtTimeAgo(garminStatus?.last_run)}</span>
      </div>
      {hasFailed && (
        <div className="hd-sync__row hd-sync__row--warn">
          <AlertTriangle size={12} />
          <span title={garminStatus.error_message}>Last sync failed</span>
        </div>
      )}
      {isStale && !hasFailed && (
        <div className="hd-sync__row hd-sync__row--warn">
          <span>Data may be stale (&gt;4h)</span>
        </div>
      )}
      <button className="hd-sync__btn" onClick={handleSync} disabled={syncing}>
        {syncing ? <RefreshCw size={13} className="hd-spin" /> : <RefreshCw size={13} />}
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
      {syncResult === 'ok' && <span className="hd-sync__result hd-sync__result--ok"><Check size={12} /> Synced</span>}
      {syncResult && syncResult !== 'ok' && <span className="hd-sync__result hd-sync__result--err">{syncResult}</span>}
    </div>
  );
}

// ──────────── Export registry ────────────
export const WIDGET_COMPONENTS = {
  'sleep.last_night':            SleepLastNight,
  'sleep.stages_trend':          SleepStagesTrend,
  'sleep.schedule_consistency':  SleepScheduleConsistency,
  'sleep.score_trend':           SleepScoreTrend,
  'sleep.stress_trend':          SleepStressTrend,

  'body.key_stats':              BodyKeyStats,
  'body.rhr_trend':              BodyRhrTrend,
  'body.steps_trend':            BodyStepsTrend,
  'body.body_battery_trend':     BodyBatteryTrend,
  'body.stress_trend':           BodyStressTrend,

  'compare.period':              ComparePeriod,

  'health.profile':              HealthProfile,
  'health.calorie_heatmap':      HealthCalorieHeatmap,
  'health.recent_detail':        HealthRecentDetail,
  'health.meal_entry':           HealthMealEntry,
  'health.food_database':        HealthFoodDatabase,
  'health.concerns':             HealthConcerns,

  'fitness.weight_trend':        FitnessWeightTrend,

  'system.garmin_sync':          SystemGarminSync,
};
