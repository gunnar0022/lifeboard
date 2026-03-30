import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import ProfileCard from './ProfileCard';
import Heatmap from './Heatmap';
import RecentDetail from './RecentDetail';
import WeightTrend from './WeightTrend';
import ConcernsTracker from './ConcernsTracker';
import './HealthPanel.css';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function HealthPanel() {
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi('/api/health_body/profile', { panelKey: 'health' });
  const { data: heatmap, refetch: refetchHeatmap } = useApi('/api/health_body/heatmap?days=90', { panelKey: 'health' });
  const { data: recent, refetch: refetchRecent } = useApi('/api/health_body/recent', { panelKey: 'health' });
  const { data: measurements, refetch: refetchMeasurements } = useApi('/api/health_body/measurements', { panelKey: 'health' });
  const { data: concerns } = useApi('/api/health_body/concerns', { panelKey: 'health' });

  const hasProfile = profile && profile.id;

  if (profileLoading) {
    return (
      <div className="health-panel">
        <div className="health-panel__header">
          <div className="health-panel__title-group">
            <span className="health-panel__icon"><HeartPulse size={24} /></span>
            <h2 className="health-panel__title">Health & Body</h2>
          </div>
        </div>
        <div className="health-panel__loading">
          <div className="skeleton" style={{ height: 80, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 160, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <motion.div
        className="health-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="health-panel__header">
          <div className="health-panel__title-group">
            <span className="health-panel__icon"><HeartPulse size={24} /></span>
            <h2 className="health-panel__title">Health & Body</h2>
          </div>
          <p className="health-panel__subtitle">Exercise, nutrition, mood tracking</p>
        </div>
        <div className="health-panel__empty">
          <div className="health-panel__empty-icon"><HeartPulse size={40} /></div>
          <h3>No health profile yet</h3>
          <p>
            Message the Telegram bot to set up your profile.
            Tell it your height, weight, age, and activity level to get started.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="health-panel"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="health-panel__header">
        <div className="health-panel__title-group">
          <span className="health-panel__icon"><HeartPulse size={24} /></span>
          <h2 className="health-panel__title">Health & Body</h2>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <ProfileCard profile={profile} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <Heatmap data={heatmap || []} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <RecentDetail days={recent || []} />
      </motion.div>

      {measurements && measurements.length > 0 && (
        <motion.div variants={fadeUp}>
          <WeightTrend measurements={measurements} />
        </motion.div>
      )}

      {concerns && (concerns.active?.length > 0 || concerns.resolved?.length > 0) && (
        <motion.div variants={fadeUp}>
          <ConcernsTracker concerns={concerns} />
        </motion.div>
      )}
    </motion.div>
  );
}
