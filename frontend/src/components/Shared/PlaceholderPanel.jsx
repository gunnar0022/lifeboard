import { motion } from 'framer-motion';
import {
  HeartPulse,
  TrendingUp,
  Briefcase,
  FolderKanban,
  BookOpen,
} from 'lucide-react';
import './PlaceholderPanel.css';

const ICON_MAP = {
  'heart-pulse': HeartPulse,
  'trending-up': TrendingUp,
  'briefcase': Briefcase,
  'folder-kanban': FolderKanban,
  'book-open': BookOpen,
};

export default function PlaceholderPanel({ agent }) {
  const IconComponent = ICON_MAP[agent.icon] || HeartPulse;

  return (
    <motion.div
      className="placeholder-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="placeholder-panel__card"
        style={{ '--agent-color': agent.accent_color }}
      >
        <div className="placeholder-panel__icon">
          <IconComponent size={48} />
        </div>
        <h2 className="placeholder-panel__name">{agent.name}</h2>
        <p className="placeholder-panel__desc">{agent.description}</p>
        <span className="placeholder-panel__badge">Coming Soon</span>
      </div>
    </motion.div>
  );
}
