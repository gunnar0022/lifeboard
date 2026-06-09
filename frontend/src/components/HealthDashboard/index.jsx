/**
 * HealthDashboard — the Health & Fitness panel.
 *
 * Two views, selected by the `view` prop (driven by the sub-tab bar):
 *   • "tracker" — a customizable dashboard of manual-entry widgets
 *     (profile, nutrition, weight, concerns). Each supports data entry,
 *     editing, and deletion. Layout is persisted in user_config.json.
 *   • "garmin"  — a clean, fixed layout of read-only Garmin device data.
 *
 * Both share a single HealthDataProvider so the API is fetched once.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Check, HeartPulse, Watch } from 'lucide-react';

import { useApi, apiPut } from '../../hooks/useApi';
import { HealthDataProvider } from './DataContext';
import WidgetFrame from './Frame';
import WidgetPicker from './Picker';
import GarminView from './GarminView';
import { WIDGET_BY_ID } from './registry';
import { WIDGET_COMPONENTS } from './widgets';

import './HealthDashboard.css';

const RANGE_OPTIONS = [7, 14, 30, 90];

// Tracker shows only non-Garmin widgets; Garmin widgets live in the Garmin view.
const isTrackerWidget = (id) => !WIDGET_BY_ID[id]?.requiresGarmin;

export default function HealthDashboard({ view = 'tracker' }) {
  const { data: settings, refetch: refetchSettings } = useApi('/api/settings');
  const [editMode, setEditMode] = useState(false);
  const [localDashboard, setLocalDashboard] = useState(null);
  const persistTimer = useRef(null);

  // Hydrate local state from settings (only the first time we get a value)
  useEffect(() => {
    if (settings?.health_dashboard && !localDashboard) {
      setLocalDashboard({
        range_days: settings.health_dashboard.range_days || 14,
        widgets: settings.health_dashboard.widgets || [],
      });
    }
  }, [settings, localDashboard]);

  // Debounced persist to backend
  const persist = useCallback((next) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      apiPut('/api/settings', { health_dashboard: next })
        .then(() => refetchSettings())
        .catch(e => console.error('Failed to save dashboard layout:', e));
    }, 400);
  }, [refetchSettings]);

  const updateDashboard = useCallback((updater) => {
    setLocalDashboard(prev => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }, [persist]);

  // Leaving the Garmin view should never strand us in edit mode.
  useEffect(() => {
    if (view !== 'tracker' && editMode) setEditMode(false);
  }, [view, editMode]);

  if (!localDashboard) {
    return (
      <div className="hd hd--loading">
        <div className="skeleton" style={{ height: 56, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
      </div>
    );
  }

  const { range_days, widgets } = localDashboard;
  const enabledWidgets = widgets.filter(
    w => w.enabled && WIDGET_COMPONENTS[w.id] && isTrackerWidget(w.id)
  );

  // ── Mutators ───────────────────────────────────────────────
  const moveWidget = (id, direction) => {
    updateDashboard(d => {
      const widgets = [...d.widgets];
      const enabledIds = widgets.filter(w => w.enabled && isTrackerWidget(w.id)).map(w => w.id);
      const enabledIdx = enabledIds.indexOf(id);
      const swapWith = enabledIds[enabledIdx + direction];
      if (!swapWith) return d;
      const i1 = widgets.findIndex(w => w.id === id);
      const i2 = widgets.findIndex(w => w.id === swapWith);
      [widgets[i1], widgets[i2]] = [widgets[i2], widgets[i1]];
      return { ...d, widgets };
    });
  };

  const hideWidget = (id) => {
    updateDashboard(d => ({
      ...d,
      widgets: d.widgets.map(w => w.id === id ? { ...w, enabled: false } : w),
    }));
  };

  const enableWidget = (id) => {
    updateDashboard(d => {
      const widgets = [...d.widgets];
      const idx = widgets.findIndex(w => w.id === id);
      if (idx === -1) {
        widgets.push({ id, enabled: true, label: null });
      } else {
        widgets[idx] = { ...widgets[idx], enabled: true };
      }
      return { ...d, widgets };
    });
  };

  const renameWidget = (id, label) => {
    updateDashboard(d => ({
      ...d,
      widgets: d.widgets.map(w => w.id === id ? { ...w, label } : w),
    }));
  };

  const setRange = (n) => {
    updateDashboard(d => ({ ...d, range_days: n }));
  };

  const isGarmin = view === 'garmin';

  return (
    <HealthDataProvider rangeDays={range_days}>
      <div className="hd">
        <DashboardHeader
          view={view}
          editMode={editMode}
          onToggleEditMode={() => setEditMode(m => !m)}
          rangeDays={range_days}
          onSetRange={setRange}
        />

        {isGarmin ? (
          <GarminView />
        ) : enabledWidgets.length === 0 ? (
          <EmptyState editMode={editMode} onEnter={() => setEditMode(true)} />
        ) : (
          <div className="hd__list">
            {enabledWidgets.map((w, i) => {
              const meta = WIDGET_BY_ID[w.id];
              const Component = WIDGET_COMPONENTS[w.id];
              if (!meta || !Component) return null;
              return (
                <WidgetFrame
                  key={w.id}
                  widgetId={w.id}
                  defaultLabel={meta.label}
                  customLabel={w.label}
                  editMode={editMode}
                  isFirst={i === 0}
                  isLast={i === enabledWidgets.length - 1}
                  onMoveUp={() => moveWidget(w.id, -1)}
                  onMoveDown={() => moveWidget(w.id, 1)}
                  onHide={() => hideWidget(w.id)}
                  onRename={(label) => renameWidget(w.id, label)}
                >
                  <Component />
                </WidgetFrame>
              );
            })}
          </div>
        )}

        {!isGarmin && editMode && (
          <WidgetPicker widgets={widgets} onEnable={enableWidget} filter={isTrackerWidget} />
        )}
      </div>
    </HealthDataProvider>
  );
}

// ──────────── Header ────────────
function DashboardHeader({ view, editMode, onToggleEditMode, rangeDays, onSetRange }) {
  const isGarmin = view === 'garmin';
  return (
    <div className="hd__header">
      <div className="hd__title">
        {isGarmin ? <Watch size={20} /> : <HeartPulse size={20} />}
        <h2>{isGarmin ? 'Garmin' : 'Tracker'}</h2>
      </div>
      <div className="hd__controls">
        {isGarmin ? (
          <div className="hd__range-btns" role="group" aria-label="Trend window">
            {RANGE_OPTIONS.map(d => (
              <button
                key={d}
                className={`hd__range-btn ${rangeDays === d ? 'hd__range-btn--active' : ''}`}
                onClick={() => onSetRange(d)}
              >{d}d</button>
            ))}
          </div>
        ) : (
          <button
            className={`hd__edit-btn ${editMode ? 'hd__edit-btn--active' : ''}`}
            onClick={onToggleEditMode}
            title={editMode ? 'Exit edit mode' : 'Customize dashboard'}
          >
            {editMode ? <><Check size={14} /> Done</> : <><Pencil size={13} /> Customize</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────── Empty state ────────────
function EmptyState({ editMode, onEnter }) {
  return (
    <div className="hd__empty">
      <HeartPulse size={36} />
      <h3>Your tracker is empty</h3>
      <p>Add some widgets to start logging your health.</p>
      {!editMode && (
        <button className="hd__edit-btn hd__edit-btn--active" onClick={onEnter}>
          <Pencil size={13} /> Customize
        </button>
      )}
    </div>
  );
}
