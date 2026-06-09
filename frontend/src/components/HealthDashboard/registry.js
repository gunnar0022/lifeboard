/**
 * Widget registry — single source of truth for the widget catalog.
 * Each entry: id, default label, group, optional `requiresGarmin` flag.
 *
 * Order here is the canonical "first-run" order; the user's saved
 * order in user_config.json wins once they customize.
 */
export const WIDGET_GROUPS = {
  sleep:   { label: 'Sleep' },
  body:    { label: 'Body & activity' },
  compare: { label: 'Comparisons' },
  health:  { label: 'Profile & nutrition' },
  fitness: { label: 'Fitness' },
  system:  { label: 'System' },
};

export const WIDGETS = [
  // ── Sleep ──
  { id: 'sleep.last_night',           label: 'Last night',                  group: 'sleep',   requiresGarmin: true,
    description: 'Bedtime, wake, score, hypnogram, stage breakdown.' },
  { id: 'sleep.stages_trend',         label: 'Sleep stages per night',     group: 'sleep',   requiresGarmin: true,
    description: 'Stacked bar of deep/light/REM/awake per night.' },
  { id: 'sleep.schedule_consistency', label: 'Bedtime & wake consistency', group: 'sleep',   requiresGarmin: true,
    description: 'Scatter of when you went to bed and woke up.' },
  { id: 'sleep.score_trend',          label: 'Sleep score trend',          group: 'sleep',   requiresGarmin: true,
    description: 'Sparkline of nightly sleep score.' },
  { id: 'sleep.stress_trend',         label: 'Sleep stress trend',         group: 'sleep',   requiresGarmin: true,
    description: 'How stressed you slept, night by night.' },

  // ── Body ──
  { id: 'body.key_stats',             label: 'Body averages',              group: 'body',    requiresGarmin: true,
    description: 'Resting HR, body battery, steps, stress.' },
  { id: 'body.rhr_trend',             label: 'Resting HR trend',           group: 'body',    requiresGarmin: true,
    description: 'Sparkline of resting heart rate.' },
  { id: 'body.steps_trend',           label: 'Steps trend',                group: 'body',    requiresGarmin: true,
    description: 'Sparkline of daily steps.' },
  { id: 'body.body_battery_trend',    label: 'Body Battery trend',         group: 'body',    requiresGarmin: true,
    description: 'Sparkline of daily Body Battery max.' },
  { id: 'body.stress_trend',          label: 'Daytime stress trend',       group: 'body',    requiresGarmin: true,
    description: 'Sparkline of daily average stress.' },

  // ── Comparison ──
  { id: 'compare.period',             label: 'Current vs prior period',    group: 'compare', requiresGarmin: true,
    description: 'Side-by-side comparison of every metric.' },

  // ── Profile / nutrition ──
  { id: 'health.profile',             label: 'Health profile',             group: 'health',
    description: 'Height, weight, age, activity, calorie goal.' },
  { id: 'health.calorie_heatmap',     label: 'Calorie heatmap',            group: 'health',
    description: 'Year-view heatmap of calorie intake.' },
  { id: 'health.recent_detail',       label: 'Recent days detail',         group: 'health',
    description: 'Per-day meal/exercise breakdown.' },
  { id: 'health.meal_entry',          label: 'Log meal or exercise',       group: 'health',
    description: 'Quick form to log a meal or workout.' },
  { id: 'health.food_database',       label: 'Food database',              group: 'health',
    description: 'Add and browse known foods.' },
  { id: 'health.concerns',            label: 'Health concerns',            group: 'health',
    description: 'Active and resolved concerns log.' },

  // ── Fitness ──
  { id: 'fitness.weight_trend',       label: 'Weight trend',               group: 'fitness',
    description: 'Long-term weight chart.' },

  // ── System ──
  { id: 'system.garmin_sync',         label: 'Garmin sync status',         group: 'system',  requiresGarmin: true,
    description: 'Last sync time and a manual sync button.' },
];

export const WIDGET_BY_ID = Object.fromEntries(WIDGETS.map(w => [w.id, w]));
