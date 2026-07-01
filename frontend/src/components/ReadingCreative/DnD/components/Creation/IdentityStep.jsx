/**
 * Identity step — the flavor, saved for last. Name, appearance, and the classic
 * personality/ideal/bond/flaw prompts (written into the existing Personality
 * custom box so they show on the sheet).
 */
export default function IdentityStep({ draft, setDraft }) {
  const meta = draft.meta || {};
  const boxes = draft.customBoxes || [];
  const personality = boxes.find(b => b.title === 'Personality');
  const fieldValue = (label) => personality?.fields?.find(f => f.label === label)?.value || '';

  const setPersonality = (label, value) => {
    const next = boxes.map(b => b.title === 'Personality'
      ? { ...b, fields: b.fields.map(f => f.label === label ? { ...f, value } : f) }
      : b);
    setDraft({ customBoxes: next });
  };

  return (
    <div className="crt-identity">
      <div className="crt-field">
        <label>Name</label>
        <input className="dnd-field" value={meta.name || ''} placeholder="Your character's name"
          onChange={e => setDraft({ meta: { name: e.target.value } })} />
      </div>
      <div className="crt-field">
        <label>Appearance</label>
        <textarea className="dnd-field dnd-field--textarea" rows={2} value={meta.appearance || ''}
          placeholder="A quick sketch — build, features, dress, anything memorable"
          onChange={e => setDraft({ meta: { appearance: e.target.value } })} />
      </div>

      {personality && (
        <div className="crt-personality">
          <h4 className="crt-subhead">Personality</h4>
          {['Trait', 'Ideal', 'Bond', 'Flaw'].map(label => (
            <div key={label} className="crt-field">
              <label>{label}</label>
              <input className="dnd-field" value={fieldValue(label)}
                placeholder={`A ${label.toLowerCase()}…`}
                onChange={e => setPersonality(label, e.target.value)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
