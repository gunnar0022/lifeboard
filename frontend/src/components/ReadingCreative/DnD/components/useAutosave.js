import { useState, useEffect, useRef } from 'react';

export default function useAutosave(character, characterId) {
  const [saveStatus, setSaveStatus] = useState('saved');
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (!character || !characterId) return;
    const serialized = JSON.stringify(character);
    if (serialized === lastSavedRef.current) return;

    // On first load, just record the initial state
    if (lastSavedRef.current === null) {
      lastSavedRef.current = serialized;
      return;
    }

    setSaveStatus('unsaved');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await fetch(`/api/dnd/characters/${characterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: character }),
        });
        lastSavedRef.current = serialized;
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('unsaved');
        console.error('Autosave failed:', e);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [character, characterId]);

  return saveStatus;
}
