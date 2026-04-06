import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import ProfileCard from '../Health/ProfileCard';
import Heatmap from '../Health/Heatmap';
import RecentDetail from '../Health/RecentDetail';
import FoodDatabase from '../Health/FoodDatabase';
import MealEntry from '../Health/MealEntry';
import ConcernsTracker from '../Health/ConcernsTracker';
import './HealthFitness.css';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function HealthTab() {
  const { data: profile, loading } = useApi('/api/health_body/profile', { panelKey: 'health' });
  const { data: heatmap } = useApi('/api/health_body/heatmap?days=90', { panelKey: 'health' });
  const { data: recent } = useApi('/api/health_body/recent', { panelKey: 'health' });
  const { data: concerns } = useApi('/api/health_body/concerns', { panelKey: 'health' });

  if (loading) {
    return (
      <div className="hf-tab">
        <div className="hf-tab__loading">
          <div className="skeleton" style={{ height: 80, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 160, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <motion.div className="hf-tab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="hf-tab__empty">
          <div className="hf-tab__empty-icon"><HeartPulse size={40} /></div>
          <h3>No health profile yet</h3>
          <p>Message the Telegram bot to set up your profile. Tell it your height, weight, age, and activity level to get started.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="hf-tab" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp}>
        <ProfileCard profile={profile} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <Heatmap data={heatmap || []} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <RecentDetail days={recent || []} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <MealEntry onSuccess={() => { /* refetch handled by websocket */ }} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <FoodDatabase />
      </motion.div>

      {concerns && (concerns.active?.length > 0 || concerns.resolved?.length > 0) && (
        <motion.div variants={fadeUp}>
          <ConcernsTracker concerns={concerns} />
        </motion.div>
      )}
    </motion.div>
  );
}
