import { motion } from 'framer-motion';
import {
  DollarSign,
  CalendarCheck,
  HeartPulse,
  TrendingUp,
  FolderKanban,
  BookOpen,
  Monitor,
} from 'lucide-react';
import { NAV_CONFIG, isPanelVisible } from '../../config/navigation';
import { useApi } from '../../hooks/useApi';
import './HomePanel.css';

const ICON_MAP = {
  'dollar-sign': DollarSign,
  'calendar-check': CalendarCheck,
  'heart-pulse': HeartPulse,
  'trending-up': TrendingUp,
  'folder-kanban': FolderKanban,
  'book-open': BookOpen,
  'monitor': Monitor,
};

// Maps new panel IDs to backend agent pulse endpoints
const PULSE_ENDPOINTS = {
  organizer: { endpoint: '/api/life/pulse', panelKey: 'home' },
  health_fitness: { endpoint: '/api/health_body/pulse', panelKey: 'home' },
  money: { endpoint: '/api/finance/pulse', panelKey: 'home' },
  creative: { endpoint: '/api/reading_creative/pulse', panelKey: 'home' },
  projects: null, // no pulse
  system: null,   // no pulse
};

function getGreeting(displayName) {
  const hour = new Date().getHours();
  let timeGreeting;
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';
  return `${timeGreeting}, ${displayName}`;
}

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HomePanel({ config, panelVisibility, onNavigate }) {
  const displayName = config?.display_name || 'friend';

  const visiblePanels = Object.entries(NAV_CONFIG).filter(
    ([id]) => isPanelVisible(id, panelVisibility || {})
  );

  return (
    <motion.div
      className="home-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="home-panel__greeting"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="home-panel__greeting-text">{getGreeting(displayName)}</h1>
        <p className="home-panel__date">{getTodayString()}</p>
      </motion.div>

      <div className="home-panel__pulse-strip">
        {visiblePanels.map(([panelId, config], i) => (
          <PulseCard
            key={panelId}
            panelId={panelId}
            config={config}
            index={i}
            onClick={() => onNavigate(panelId)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function PulseCard({ panelId, config, index, onClick }) {
  const IconComponent = ICON_MAP[config.icon] || DollarSign;
  const pulseConfig = PULSE_ENDPOINTS[panelId];
  const hasPulse = !!pulseConfig;

  const { data: pulseData } = useApi(
    pulseConfig?.endpoint || '/api/config',
    { skip: !hasPulse, panelKey: hasPulse ? pulseConfig.panelKey : null }
  );

  return (
    <motion.div
      className="pulse-card"
      style={{ '--agent-color': config.accent }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.2 + index * 0.06,
        ease: [0.4, 0, 0.2, 1],
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="pulse-card__header">
        <span className="pulse-card__icon">
          <IconComponent size={18} />
        </span>
        <span className="pulse-card__name">{config.label}</span>
      </div>

      {hasPulse ? (
        <div className="pulse-card__metrics">
          {pulseData?.metrics?.map((metric, i) => (
            <PulseMetric key={i} metric={metric} />
          )) || (
            <>
              <div className="skeleton pulse-card__skeleton" />
              <div className="skeleton pulse-card__skeleton" />
              <div className="skeleton pulse-card__skeleton" />
            </>
          )}
        </div>
      ) : (
        <div className="pulse-card__metrics">
          <div className="pulse-card__no-pulse">{config.label}</div>
        </div>
      )}
    </motion.div>
  );
}

function PulseMetric({ metric }) {
  return (
    <div className="pulse-metric">
      <span className="pulse-metric__value mono">
        {metric.prefix || ''}{metric.value}{metric.suffix || ''}
      </span>
      <span className="pulse-metric__label">{metric.label}</span>
    </div>
  );
}
