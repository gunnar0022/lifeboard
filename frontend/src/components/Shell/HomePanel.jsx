import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  CalendarCheck,
  HeartPulse,
  TrendingUp,
  Briefcase,
  FolderKanban,
  BookOpen,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import './HomePanel.css';

const ICON_MAP = {
  'dollar-sign': DollarSign,
  'calendar-check': CalendarCheck,
  'heart-pulse': HeartPulse,
  'trending-up': TrendingUp,
  'briefcase': Briefcase,
  'folder-kanban': FolderKanban,
  'book-open': BookOpen,
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

export default function HomePanel({ agents, config, onNavigate }) {
  const displayName = config?.display_name || 'friend';

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
        {agents.map((agent, i) => (
          <PulseCard
            key={agent.id}
            agent={agent}
            index={i}
            onClick={() => agent.v1 && onNavigate(agent.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function PulseCard({ agent, index, onClick }) {
  const isPlaceholder = !agent.v1;
  const IconComponent = ICON_MAP[agent.icon] || DollarSign;

  // Fetch pulse data for active agents
  const pulseEndpoint = agent.id === 'life_manager' ? '/api/life/pulse' : `/api/${agent.id}/pulse`;
  const { data: pulseData } = useApi(pulseEndpoint, { skip: isPlaceholder, panelKey: 'home' });

  return (
    <motion.div
      className={`pulse-card ${isPlaceholder ? 'pulse-card--placeholder' : ''}`}
      style={{ '--agent-color': agent.accent_color }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.2 + index * 0.06,
        ease: [0.4, 0, 0.2, 1],
      }}
      onClick={onClick}
      role={isPlaceholder ? undefined : 'button'}
      tabIndex={isPlaceholder ? undefined : 0}
    >
      <div className="pulse-card__header">
        <span className="pulse-card__icon">
          <IconComponent size={18} />
        </span>
        <span className="pulse-card__name">{agent.name}</span>
      </div>

      {isPlaceholder ? (
        <div className="pulse-card__coming-soon">Coming soon</div>
      ) : (
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
