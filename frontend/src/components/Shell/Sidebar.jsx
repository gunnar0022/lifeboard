import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  DollarSign,
  CalendarCheck,
  HeartPulse,
  TrendingUp,
  Briefcase,
  FolderKanban,
  BookOpen,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NAV_CONFIG, isPanelVisible } from '../../config/navigation';
import './Sidebar.css';

const ICON_MAP = {
  'home': Home,
  'dollar-sign': DollarSign,
  'calendar-check': CalendarCheck,
  'heart-pulse': HeartPulse,
  'trending-up': TrendingUp,
  'briefcase': Briefcase,
  'folder-kanban': FolderKanban,
  'book-open': BookOpen,
  'monitor': Monitor,
};

export default function Sidebar({ activePanel, onNavigate, collapsed, onToggleCollapse, mobileOpen, onMobileClose, wsConnected, panelVisibility }) {
  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="sidebar__header">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              className="sidebar__logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              LifeBoard
            </motion.span>
          )}
        </AnimatePresence>
        <button
          className="sidebar__toggle sidebar__toggle--desktop"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {onMobileClose && (
          <button
            className="sidebar__toggle sidebar__toggle--mobile"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar__nav">
        <SidebarItem
          icon="home"
          label="Home"
          isActive={activePanel === 'home'}
          onClick={() => onNavigate('home')}
          collapsed={collapsed}
          accentColor="var(--text-primary)"
        />

        <div className="sidebar__divider" />

        {Object.entries(NAV_CONFIG).map(([panelId, config]) => {
          if (!isPanelVisible(panelId, panelVisibility || {})) return null;
          return (
            <SidebarItem
              key={panelId}
              icon={config.icon}
              label={config.label}
              isActive={activePanel === panelId}
              onClick={() => onNavigate(panelId)}
              collapsed={collapsed}
              accentColor={config.accent}
            />
          );
        })}

        <div className="sidebar__ws-status" title={wsConnected ? 'Live updates active' : 'Reconnecting...'}>
          <span className={`sidebar__ws-dot ${wsConnected ? 'sidebar__ws-dot--connected' : 'sidebar__ws-dot--disconnected'}`} />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                className="sidebar__ws-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                {wsConnected ? 'Live' : 'Reconnecting...'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </motion.aside>
  );
}

function SidebarItem({ icon, label, isActive, onClick, collapsed, accentColor }) {
  const IconComponent = ICON_MAP[icon] || Home;

  return (
    <button
      className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
      onClick={onClick}
      style={{
        '--item-accent': accentColor,
      }}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar__item-icon">
        <IconComponent size={20} />
      </span>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            className="sidebar__item-label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {isActive && (
        <motion.div
          className="sidebar__active-indicator"
          layoutId="activeIndicator"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}
