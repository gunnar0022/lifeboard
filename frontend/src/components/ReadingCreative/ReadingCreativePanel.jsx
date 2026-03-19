import { useState } from 'react';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import FloatingSnippets from './FloatingSnippets';
import ReadingLog from './ReadingLog';
import CreativeWorkspace from './CreativeWorkspace';
import './ReadingCreativePanel.css';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function ReadingCreativePanel() {
  const { data: projects, loading } = useApi('/api/reading_creative/projects');
  const { data: books, refetch: refetchBooks } = useApi('/api/reading_creative/books');
  const { data: snippets } = useApi('/api/reading_creative/snippets?count=40');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  if (workspaceOpen) {
    return <CreativeWorkspace onBack={() => setWorkspaceOpen(false)} />;
  }

  if (loading) {
    return (
      <div className="rc-panel">
        <div className="rc-panel__header">
          <div className="rc-panel__title-group">
            <span className="rc-panel__icon"><Feather size={24} /></span>
            <h2 className="rc-panel__title">Reading & Creative</h2>
          </div>
        </div>
        <div className="rc-panel__loading">
          <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 160, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rc-panel">
      {/* Background layer: floating text everywhere */}
      <FloatingSnippets snippets={snippets || []} />

      {/* Foreground content: centered column */}
      <motion.div
        className="rc-panel__content"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="rc-panel__header">
          <div className="rc-panel__title-group">
            <span className="rc-panel__icon"><Feather size={24} /></span>
            <h2 className="rc-panel__title">Reading & Creative</h2>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <button
            className="rc-panel__workspace-btn card"
            onClick={() => setWorkspaceOpen(true)}
          >
            <div className="rc-panel__workspace-info">
              <Feather size={20} />
              <div>
                <strong>Open Workspace</strong>
                <span>{projects?.length || 0} projects</span>
              </div>
            </div>
            <span className="rc-panel__workspace-arrow">&rarr;</span>
          </button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ReadingLog books={books || []} onRefresh={refetchBooks} />
        </motion.div>
      </motion.div>
    </div>
  );
}
