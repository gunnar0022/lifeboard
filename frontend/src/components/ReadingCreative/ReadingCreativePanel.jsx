import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Feather, Swords } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import FloatingSnippets from './FloatingSnippets';
import ReadingLog from './ReadingLog';
import CreativeWorkspace from './CreativeWorkspace';
import CharacterList from './DnD/CharacterList';
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
  const { data: characters, refetch: refetchCharacters } = useApi('/api/dnd/characters');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [dndView, setDndView] = useState(null); // null | 'list' | { id, editMode }

  const handleSelectCharacter = useCallback((id, editMode) => {
    setDndView({ id, editMode });
  }, []);

  const handleBackFromSheet = useCallback(() => {
    refetchCharacters();
    setDndView('list');
  }, [refetchCharacters]);

  const handleBackFromList = useCallback(() => {
    setDndView(null);
  }, []);

  // Sub-views
  if (workspaceOpen) {
    return <CreativeWorkspace onBack={() => setWorkspaceOpen(false)} />;
  }

  if (dndView === 'list') {
    return (
      <div className="rc-panel rc-panel--dnd dnd-root">
        <div className="rc-panel__sub-header">
          <button className="rc-panel__back-btn" onClick={handleBackFromList}>
            &larr; Back
          </button>
        </div>
        <CharacterList
          characters={characters || []}
          onSelect={handleSelectCharacter}
          onRefresh={refetchCharacters}
        />
      </div>
    );
  }

  if (dndView && typeof dndView === 'object') {
    return (
      <div className="rc-panel rc-panel--dnd dnd-root">
        <CharacterSheet
          characterId={dndView.id}
          initialEditMode={dndView.editMode}
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
            onClick={() => setDndView('list')}
          >
            <div className="rc-panel__workspace-info">
              <Swords size={20} />
              <div>
                <strong>Characters</strong>
                <span>{characters?.length || 0} character sheets</span>
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
