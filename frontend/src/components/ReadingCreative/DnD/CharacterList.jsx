import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { CLASS_COLORS, NEW_CHARACTER_DATA } from './dndUtils';

export default function CharacterList({ characters, onSelect, onRefresh }) {
  const [deleting, setDeleting] = useState(null);

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

  const deleteCharacter = async (id, e) => {
    e.stopPropagation();
    if (deleting === id) {
      // Confirmed
      try {
        await fetch(`/api/dnd/characters/${id}`, { method: 'DELETE' });
        onRefresh();
      } catch (e) {
        console.error('Failed to delete:', e);
      }
      setDeleting(null);
    } else {
      setDeleting(id);
      setTimeout(() => setDeleting(null), 3000);
    }
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
          const classColor = CLASS_COLORS[char.class_name] || '#3a3228';
          const updated = char.updated_at ? new Date(char.updated_at).toLocaleDateString() : '';

          return (
            <motion.button
              key={char.id}
              className="dnd-list__card"
              onClick={() => onSelect(char.id, false)}
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
                className={`dnd-list__card-delete ${deleting === char.id ? 'dnd-list__card-delete--confirm' : ''}`}
                onClick={e => deleteCharacter(char.id, e)}
                title={deleting === char.id ? 'Click again to confirm' : 'Delete'}
              >
                <Trash2 size={14} />
              </button>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
