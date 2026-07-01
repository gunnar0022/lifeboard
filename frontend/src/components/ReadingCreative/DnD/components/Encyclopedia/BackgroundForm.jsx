import { SourceTypeField } from './FeatForm';

// Backgrounds store their lists as arrays; the form edits them as one-per-line
// text for a light authoring experience.
const linesToList = (s) => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
const listToLines = (l) => (l || []).join('\n');

export function blankBackgroundDraft() {
  return {
    name: '', description: '',
    skill_proficiencies: '', tool_proficiencies: '', languages: '', equipment: '',
    feature_name: '', feature_desc: '',
    source: 'PHB', is_custom: false,
  };
}

export function backgroundToDraft(bg) {
  return {
    name: bg.name || '',
    description: bg.description || '',
    skill_proficiencies: listToLines(bg.skill_proficiencies),
    tool_proficiencies: listToLines(bg.tool_proficiencies),
    languages: listToLines(bg.languages),
    equipment: listToLines(bg.equipment),
    feature_name: bg.feature_name || '',
    feature_desc: bg.feature_desc || '',
    source: bg.source || 'PHB',
    is_custom: !!bg.is_custom,
  };
}

export function backgroundDraftToPayload(draft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    skill_proficiencies: linesToList(draft.skill_proficiencies),
    tool_proficiencies: linesToList(draft.tool_proficiencies),
    languages: linesToList(draft.languages),
    equipment: linesToList(draft.equipment),
    feature_name: draft.feature_name.trim(),
    feature_desc: draft.feature_desc.trim(),
    source: draft.source || 'Homebrew',
    is_custom: draft.is_custom,
  };
}

/** Shared background editor — used by the create modal and the detail-edit screen. */
export default function BackgroundForm({ draft, onChange }) {
  const set = (patch) => onChange({ ...draft, ...patch });
  return (
    <div className="spell-modal__create-form">
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Name *</label>
        <input className="dnd-field" value={draft.name} onChange={e => set({ name: e.target.value })} />
      </div>
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Description</label>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={draft.description}
          onChange={e => set({ description: e.target.value })} placeholder="Flavor — who this character was before adventuring" />
      </div>

      <div className="spell-modal__form-field">
        <label>Skill proficiencies (one per line)</label>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={draft.skill_proficiencies}
          onChange={e => set({ skill_proficiencies: e.target.value })} placeholder={'Athletics\nAcrobatics'} />
      </div>
      <div className="spell-modal__form-field">
        <label>Tool proficiencies (one per line)</label>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={draft.tool_proficiencies}
          onChange={e => set({ tool_proficiencies: e.target.value })} placeholder={"Smith's tools\nVehicles (land)"} />
      </div>
      <div className="spell-modal__form-field">
        <label>Languages (one per line)</label>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={draft.languages}
          onChange={e => set({ languages: e.target.value })} placeholder={'One of your choice'} />
      </div>
      <div className="spell-modal__form-field">
        <label>Starting equipment (one per line)</label>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={draft.equipment}
          onChange={e => set({ equipment: e.target.value })} placeholder={'A set of common clothes\nA belt pouch with 10 gp'} />
      </div>

      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Feature name</label>
        <input className="dnd-field" value={draft.feature_name} onChange={e => set({ feature_name: e.target.value })}
          placeholder="e.g. Echoes of Victory" />
      </div>
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Feature description</label>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={draft.feature_desc}
          onChange={e => set({ feature_desc: e.target.value })} placeholder="The social / roleplay benefit this background grants" />
      </div>

      <SourceTypeField draft={draft} set={set} />
    </div>
  );
}
