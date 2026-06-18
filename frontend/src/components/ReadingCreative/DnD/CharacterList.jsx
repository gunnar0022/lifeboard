import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { CLASS_COLORS, NEW_CHARACTER_DATA } from './dndUtils';
import DeleteConfirm from './DeleteConfirm';

export default function CharacterList({ characters, onSelect, onRefresh }) {
  const [confirmChar, setConfirmChar] = useState(null);

  const createCharacter = async () => {
    try {
      const res = await fetch('/api/dnd/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: NEW_CHARACTER_DATA }),
      });
      const result = await res.json();
      onSelect(result.id, true); // open in edit mode
    } catch (e) {
      console.error('Failed to create character:', e);
    }
  };

  const deleteCharacter = async () => {
    if (!confirmChar) return;
    await fetch(`/api/dnd/characters/${confirmChar.id}`, { method: 'DELETE' });
    setConfirmChar(null);
    onRefresh();
  };

  return (
    <div className="dnd-list">
      <div className="dnd-list__header">
        <h2 className="dnd-list__title">Characters</h2>
      </div>
      <div className="dnd-list__grid">
        {/* New character card */}
        <motion.button
          className="dnd-list__card dnd-list__card--new"
          onClick={createCharacter}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={32} />
          <span>New Character</span>
        </motion.button>

        {(characters || []).map(char => {
          const classColor = CLASS_COLORS[char.class_name] || 'var(--dnd-border)';
          const updated = char.updated_at ? new Date(char.updated_at).toLocaleDateString() : '';

          return (
            <motion.div
              key={char.id}
              className="dnd-list__card"
              role="button"
              tabIndex={0}
              onClick={() => onSelect(char.id, false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(char.id, false); } }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              style={{ borderLeftColor: classColor }}
            >
              <div className="dnd-list__card-content">
                <span className="dnd-list__card-name">{char.name}</span>
                <span className="dnd-list__card-class">
                  {char.class_name ? `${char.class_name} ${char.level}` : 'No class'}
                </span>
                <span className="dnd-list__card-updated">{updated}</span>
              </div>
              <button
                className="dnd-list__card-delete"
                onClick={e => { e.stopPropagation(); setConfirmChar(char); }}
                title="Delete character"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {confirmChar && (
        <DeleteConfirm
          itemType="character"
          name={confirmChar.name}
          onConfirm={deleteCharacter}
          onCancel={() => setConfirmChar(null)}
        />
      )}
    </div>
  );
}
