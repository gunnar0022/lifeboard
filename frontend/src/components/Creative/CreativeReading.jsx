import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import FloatingSnippets from '../ReadingCreative/FloatingSnippets';
import ReadingLog from '../ReadingCreative/ReadingLog';
import './Creative.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function CreativeReading() {
  const { data: books, refetch: refetchBooks } = useApi('/api/reading_creative/books');
  const { data: snippets } = useApi('/api/reading_creative/snippets?count=52');

  return (
    <div className="creative-tab">
      <FloatingSnippets snippets={snippets || []} />
      <motion.div
        className="creative-tab__content"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={fadeUp}>
          <ReadingLog books={books || []} onRefresh={refetchBooks} />
        </motion.div>
      </motion.div>
    </div>
  );
}
