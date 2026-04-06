import { useState } from 'react';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import FloatingSnippets from '../ReadingCreative/FloatingSnippets';
import CreativeWorkspace from '../ReadingCreative/CreativeWorkspace';
import '../ReadingCreative/ReadingCreativePanel.css';
import './Creative.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function CreativeWorkspaceTab() {
  const { data: projects, loading } = useApi('/api/reading_creative/projects');
  const { data: snippets } = useApi('/api/reading_creative/snippets?count=52');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  if (workspaceOpen) {
    return <CreativeWorkspace onBack={() => setWorkspaceOpen(false)} />;
  }

  if (loading) {
    return (
      <div className="creative-tab">
        <div className="creative-tab__loading">
          <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

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
      </motion.div>
    </div>
  );
}
