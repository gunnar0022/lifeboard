import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Feather, Swords } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import FloatingSnippets from './FloatingSnippets';
import ReadingLog from './ReadingLog';
import CreativeWorkspace from './CreativeWorkspace';
import DnDSelectionScreen from './DnD/DnDSelectionScreen';
import CharacterSheet from './DnD/CharacterSheet';
import './ReadingCreativePanel.css';
import './DnD/dndStyles.css';

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
  const { data: snippets } = useApi('/api/reading_creative/snippets?count=52');
  const { data: campaigns } = useApi('/api/dnd/campaigns');
  const { data: characters } = useApi('/api/dnd/characters');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [dndView, setDndView] = useState(null); // null | 'selection' | { id, editMode, campaignId }

  const handleSelectCharacter = useCallback((id, editMode, campaignId) => {
    setDndView({ id, editMode, campaignId });
  }, []);

  const handleBackFromSheet = useCallback(() => {
    setDndView('selection');
  }, []);

  const handleBackFromSelection = useCallback(() => {
    setDndView(null);
  }, []);

  // Sub-views
  if (workspaceOpen) {
    return <CreativeWorkspace onBack={() => setWorkspaceOpen(false)} />;
  }

  if (dndView === 'selection') {
    return (
      <div className="rc-panel rc-panel--dnd dnd-root">
        <div className="rc-panel__sub-header">
          <button className="rc-panel__back-btn" onClick={handleBackFromSelection}>
            &larr; Back
          </button>
        </div>
        <DnDSelectionScreen onSelectCharacter={handleSelectCharacter} />
      </div>
    );
  }

  if (dndView && typeof dndView === 'object') {
    return (
      <div className="rc-panel rc-panel--dnd dnd-root">
        <CharacterSheet
          characterId={dndView.id}
          initialEditMode={dndView.editMode}
          campaignId={dndView.campaignId}
          onBack={handleBackFromSheet}
        />
      </div>
    );
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

  const totalDnD = (campaigns?.length || 0) + (characters?.length || 0);

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
          <button
            className="rc-panel__workspace-btn card"
            onClick={() => setDndView('selection')}
          >
            <div className="rc-panel__workspace-info">
              <Swords size={20} />
              <div>
                <strong>D&D</strong>
                <span>{campaigns?.length || 0} campaigns, {characters?.length || 0} characters</span>
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
