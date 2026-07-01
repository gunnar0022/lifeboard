import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import BackgroundDetailView from '../Encyclopedia/BackgroundDetailView';
import ChooserShell from './ChooserShell';

const NONE_ID = '__none__';
const strip = (arr, remove) => (arr || []).filter(x => !remove.includes(x));
const dedupAdd = (arr, add) => Array.from(new Set([...(arr || []), ...add]));

/**
 * Background step. Lists the backgrounds library; the detail pane reuses the
 * encyclopedia BackgroundDetailView. Selecting one applies its skill/tool
 * proficiencies and languages to the draft (auto-apply, editable later) and sets
 * meta.background. Switching backgrounds first strips the previous one's grants,
 * derived from the previously-selected background's own lists (no hidden marker).
 */
export default function BackgroundStep({ draft, setDraft }) {
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/dnd/backgrounds?limit=300')
      .then(r => r.json())
      .then(rows => { if (alive) setBackgrounds(Array.isArray(rows) ? rows : []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const current = draft.meta.background || '';
  const byName = (name) => backgrounds.find(b => b.name === name);

  const items = [
    { id: NONE_ID, name: 'Custom / none', meta: 'fill in yourself' },
    ...backgrounds.map(b => ({
      id: b.name,
      name: b.name,
      meta: (b.skill_proficiencies || []).length ? b.skill_proficiencies.join(', ') : undefined,
    })),
  ];

  const applySelection = (name) => {
    const old = byName(current);
    // Strip the previously-applied grants (if the old selection was a library bg).
    let skills = draft.skillProficiencies || [];
    let tools = draft.proficiencies?.tools || [];
    let langs = draft.meta.languages || [];
    if (old) {
      skills = strip(skills, old.skill_proficiencies || []);
      tools = strip(tools, old.tool_proficiencies || []);
      langs = strip(langs, old.languages || []);
    }

    if (name === NONE_ID) {
      setDraft({
        meta: { background: '', languages: langs },
        skillProficiencies: skills,
        proficiencies: { ...(draft.proficiencies || {}), tools },
      });
      return;
    }

    const bg = byName(name);
    if (!bg) { setDraft({ meta: { background: name } }); return; }
    setDraft({
      meta: { background: bg.name, languages: dedupAdd(langs, bg.languages || []) },
      skillProficiencies: dedupAdd(skills, bg.skill_proficiencies || []),
      proficiencies: { ...(draft.proficiencies || {}), tools: dedupAdd(tools, bg.tool_proficiencies || []) },
    });
  };

  const selectedId = current ? current : NONE_ID;

  const renderDetail = (id) => {
    if (id === NONE_ID) {
      return (
        <div className="crt-none-detail">
          <p>No library background selected. You can type a background name and add proficiencies yourself on the sheet, or pick one from the list to auto-apply its grants.</p>
        </div>
      );
    }
    const bg = byName(id);
    if (!bg) return <p className="crt-chooser__empty">Background not found.</p>;
    return (
      <div>
        <div className="crt-applied-note"><Check size={14} /> Selecting this applies its proficiencies & languages to your sheet (editable later).</div>
        <BackgroundDetailView key={bg.id} bgId={bg.id} preview={bg} editMode={false} />
      </div>
    );
  };

  return (
    <ChooserShell
      items={items}
      selectedId={selectedId}
      onSelect={applySelection}
      renderDetail={renderDetail}
      loading={loading}
      emptyHint="Pick a background to see what it grants."
    />
  );
}
