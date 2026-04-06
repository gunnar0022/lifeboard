import { motion } from 'framer-motion';
import { NAV_CONFIG, getVisibleSubTabs } from '../../config/navigation';
import './SubTabBar.css';

export default function SubTabBar({ panelId, activeSubTab, onSubTabChange, panelVisibility }) {
  const config = NAV_CONFIG[panelId];
  if (!config?.subtabs) return null;

  const visibleTabs = getVisibleSubTabs(panelId, panelVisibility);
  if (visibleTabs.length <= 1) return null;

  return (
    <div className="subtab-bar" style={{ '--tab-accent': config.accent }}>
      <div className="subtab-bar__tabs">
        {visibleTabs.map(tab => (
          <button
            key={tab.key}
            className={`subtab-bar__tab ${activeSubTab === tab.key ? 'subtab-bar__tab--active' : ''}`}
            onClick={() => onSubTabChange(tab.key)}
          >
            {tab.label}
            {activeSubTab === tab.key && (
              <motion.div
                className="subtab-bar__indicator"
                layoutId="subtabIndicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
