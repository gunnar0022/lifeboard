import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import WeightTrend from '../Health/WeightTrend';
import GarminTile from './GarminTile';
import './HealthFitness.css';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function FitnessTab() {
  const { data: measurements } = useApi('/api/health_body/measurements', { panelKey: 'health' });

  return (
    <motion.div className="hf-tab" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp}>
        <GarminTile />
      </motion.div>

      {measurements && measurements.length > 0 && (
        <motion.div variants={fadeUp}>
          <WeightTrend measurements={measurements} />
        </motion.div>
      )}

      {(!measurements || measurements.length === 0) && (
        <motion.div variants={fadeUp} className="fitness-empty card">
          <p>No weight measurements yet. Log your weight via Telegram to start tracking trends.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
