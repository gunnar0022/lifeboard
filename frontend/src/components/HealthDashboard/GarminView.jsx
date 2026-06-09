/**
 * GarminView — a clean, curated, fixed layout for all Garmin device data.
 *
 * Unlike the customizable Tracker, this view is a static arrangement so the
 * device metrics always read as one coherent dashboard. Widgets pull their
 * own data from useHealthData(); here we just compose them into sections.
 */
import { Moon, HeartPulse, GitCompareArrows, Watch } from 'lucide-react';

import { useHealthData } from './DataContext';
import { WIDGET_COMPONENTS } from './widgets';
import { WIDGET_BY_ID } from './registry';

// A single titled card wrapping one widget by id.
function GCard({ id, span }) {
  const Component = WIDGET_COMPONENTS[id];
  const meta = WIDGET_BY_ID[id];
  if (!Component) return null;
  return (
    <div className={`hd-frame hd-gcard ${span ? 'hd-gcard--full' : ''}`}>
      <div className="hd-gcard__label">{meta?.label || id}</div>
      <div className="hd-frame__body">
        <Component />
      </div>
    </div>
  );
}

function GSection({ icon: Icon, title, children }) {
  return (
    <section className="hd-gsection">
      <h3 className="hd-gsection__title">
        {Icon && <Icon size={15} />}
        {title}
      </h3>
      <div className="hd-ggrid">{children}</div>
    </section>
  );
}

export default function GarminView() {
  const { garmin, garminStatus, loading } = useHealthData();

  const hasData = !!(
    garmin && (garmin.last_night || garmin.timeline?.length || garmin.stats)
  );

  // Empty state — never synced or no data in window. Still surface the sync card.
  if (!loading && !hasData) {
    return (
      <div className="hd-garmin">
        <GCard id="system.garmin_sync" />
        <div className="hd__empty">
          <Watch size={36} />
          <h3>No Garmin data yet</h3>
          <p>
            {garminStatus?.last_run
              ? 'No device data for this window. Try a wider range or sync again.'
              : 'Connect and sync your Garmin to see sleep, body battery, and more.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hd-garmin">
      <GCard id="system.garmin_sync" />

      <GSection icon={Moon} title="Sleep">
        <GCard id="sleep.last_night" span />
        <GCard id="sleep.stages_trend" span />
        <GCard id="sleep.schedule_consistency" span />
        <GCard id="sleep.score_trend" />
        <GCard id="sleep.stress_trend" />
      </GSection>

      <GSection icon={HeartPulse} title="Body & activity">
        <GCard id="body.key_stats" span />
        <GCard id="body.rhr_trend" />
        <GCard id="body.steps_trend" />
        <GCard id="body.body_battery_trend" />
        <GCard id="body.stress_trend" />
      </GSection>

      <GSection icon={GitCompareArrows} title="Comparison">
        <GCard id="compare.period" span />
      </GSection>
    </div>
  );
}
