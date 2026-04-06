import { motion } from 'framer-motion';
import DocumentSearch from '../LifeManager/DocumentSearch';
import './Organizer.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function OrganizerDocuments() {
  return (
    <motion.div
      className="organizer-tab"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={fadeUp}>
        <DocumentSearch />
      </motion.div>
    </motion.div>
  );
}
