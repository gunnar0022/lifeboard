import { useState, useEffect } from 'react';
import { Bell, Settings, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './TopBar.css';

// Initialize theme from localStorage on first load
function useInitTheme() {
  useEffect(() => {
    const saved = localStorage.getItem('lifeboard-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
}

export default function TopBar({ nudges = [], sidebarCollapsed, onMobileMenuToggle, onNavigateSettings }) {
  useInitTheme();
  const [now, setNow] = useState(new Date());
  const [showNudges, setShowNudges] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sortedNudges = [...nudges].sort((a, b) => {
    const order = { alert: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const topNudge = sortedNudges[0];

  return (
    <header
      className="topbar"
      style={{
        left: sidebarCollapsed ? 72 : 260,
      }}
    >
      <div className="topbar__left">
        {onMobileMenuToggle && (
          <button className="topbar__hamburger" onClick={onMobileMenuToggle} aria-label="Menu">
            <Menu size={22} />
          </button>
        )}
        <h1 className="topbar__title">LifeBoard</h1>
      </div>

      <div className="topbar__center">
        <span className="topbar__date">{dateStr}</span>
        <span className="topbar__time">{timeStr}</span>
      </div>

      <div className="topbar__right">
        {topNudge && (
          <span className={`topbar__nudge-text topbar__nudge-text--${topNudge.severity}`}>
            {topNudge.text}
          </span>
        )}

        <button
          className="topbar__theme-btn"
          onClick={onNavigateSettings}
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        <button
          className="topbar__notification-btn"
          onClick={() => setShowNudges(!showNudges)}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {nudges.length > 0 && (
            <span className="topbar__badge">{nudges.length}</span>
          )}
        </button>

        <AnimatePresence>
          {showNudges && (
            <>
              <motion.div
                className="topbar__nudge-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNudges(false)}
              />
              <motion.div
                className="topbar__nudge-dropdown"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {sortedNudges.length === 0 ? (
                  <div className="topbar__nudge-empty">
                    All clear — nothing to worry about!
                  </div>
                ) : (
                  sortedNudges.map((nudge, i) => (
                    <div
                      key={i}
                      className={`topbar__nudge-item topbar__nudge-item--${nudge.severity}`}
                    >
                      <span className="topbar__nudge-dot" />
                      <span>{nudge.text}</span>
                    </div>
                  ))
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
