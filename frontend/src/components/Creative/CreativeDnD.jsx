import { useCallback } from 'react';
import { motion } from 'framer-motion';
import DnDSelectionScreen from '../ReadingCreative/DnD/DnDSelectionScreen';
import CharacterSheet from '../ReadingCreative/DnD/CharacterSheet';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import '../ReadingCreative/DnD/styles/index.css';
import './Creative.css';

export default function CreativeDnD() {
  // Persisted so a refresh / remount reopens the same character + mode.
  const [dndView, setDndView] = useLocalStorageState('lifeboard-dnd-view', 'selection'); // 'selection' | { id, editMode, campaignId }

  const handleSelectCharacter = useCallback((id, editMode, campaignId) => {
    setDndView({ id, editMode, campaignId });
  }, [setDndView]);

  const handleBackFromSheet = useCallback(() => {
    setDndView('selection');
  }, [setDndView]);

  const handleEditModeChange = useCallback((editMode) => {
    setDndView(prev => (prev && typeof prev === 'object' ? { ...prev, editMode } : prev));
  }, [setDndView]);

  if (dndView && typeof dndView === 'object') {
    return (
      <motion.div
        className="creative-tab dnd-root"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <CharacterSheet
          characterId={dndView.id}
          initialEditMode={dndView.editMode}
          campaignId={dndView.campaignId}
          onBack={handleBackFromSheet}
          onEditModeChange={handleEditModeChange}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="creative-tab dnd-root"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <DnDSelectionScreen onSelectCharacter={handleSelectCharacter} />
    </motion.div>
  );
}
