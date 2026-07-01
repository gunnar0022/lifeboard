const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export function blankFeatDraft() {
  // Default to a standard (official) entry — most hand-added feats are real feats,
  // not homebrew. Flip the Type toggle to homebrew when authoring something custom.
  return { name: '', prerequisite: '', description: '', benefits: '', asiAbility: '', source: 'PHB', is_custom: false };
}

export function featToDraft(feat) {
  const fixed = feat.asi && feat.asi.fixed ? Object.keys(feat.asi.fixed)[0] : '';
  return {
    name: feat.name || '',
    prerequisite: feat.prerequisite || '',
    description: feat.description || '',
    benefits: (feat.benefits || []).join('\n'),
    asiAbility: fixed || '',
    source: feat.source || 'PHB',
    is_custom: !!feat.is_custom,
  };
}

export function featDraftToPayload(draft) {
  return {
    name: draft.name.trim(),
    prerequisite: draft.prerequisite.trim(),
    description: draft.description.trim(),
    benefits: draft.benefits.split('\n').map(b => b.trim()).filter(Boolean),
    asi: draft.asiAbility ? { fixed: { [draft.asiAbility]: 1 } } : {},
    source: draft.source || 'Homebrew',
    is_custom: draft.is_custom,
  };
}

/** Shared feat editor — used by the create modal and the detail-edit screen. */
export default function FeatForm({ draft, onChange }) {
  const set = (patch) => onChange({ ...draft, ...patch });
  return (
    <div className="spell-modal__create-form">
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Name *</label>
        <input className="dnd-field" value={draft.name} onChange={e => set({ name: e.target.value })} />
      </div>
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Prerequisite</label>
        <input className="dnd-field" value={draft.prerequisite} onChange={e => set({ prerequisite: e.target.value })}
          placeholder="e.g. Strength 13 or higher (optional)" />
      </div>
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Description *</label>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={draft.description}
          onChange={e => set({ description: e.target.value })} placeholder="Flavor / summary of the feat" />
      </div>
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Benefits (one per line)</label>
        <textarea className="dnd-field dnd-field--textarea" rows={4} value={draft.benefits}
          onChange={e => set({ benefits: e.target.value })} placeholder={'You have advantage on…\nYou gain proficiency in…'} />
      </div>
      <div className="spell-modal__form-field">
        <label>Ability Score rider</label>
        <select className="dnd-field" value={draft.asiAbility} onChange={e => set({ asiAbility: e.target.value })}>
          <option value="">No ability increase</option>
          {ABILITIES.map(a => <option key={a} value={a}>+1 {a}</option>)}
        </select>
      </div>
      <SourceTypeField draft={draft} set={set} />
    </div>
  );
}

/**
 * Homebrew vs. standard (official) toggle, shared by the Feat and Background
 * editors. Standard entries carry a source book so a hand-typed PHB feat isn't
 * mislabeled as homebrew.
 */
export function SourceTypeField({ draft, set }) {
  const homebrew = !!draft.is_custom;
  return (
    <>
      <div className="spell-modal__form-field">
        <label>Type</label>
        <select
          className="dnd-field"
          value={homebrew ? 'homebrew' : 'standard'}
          onChange={e => {
            const hb = e.target.value === 'homebrew';
            set({
              is_custom: hb,
              source: hb ? 'Homebrew' : (draft.source && draft.source !== 'Homebrew' ? draft.source : 'PHB'),
            });
          }}
        >
          <option value="standard">Standard (official)</option>
          <option value="homebrew">Homebrew</option>
        </select>
      </div>
      {!homebrew && (
        <div className="spell-modal__form-field">
          <label>Source book</label>
          <input
            className="dnd-field"
            value={draft.source === 'Homebrew' ? '' : (draft.source || '')}
            onChange={e => set({ source: e.target.value })}
            placeholder="PHB, XGE, TCE, SCAG…"
          />
        </div>
      )}
    </>
  );
}
