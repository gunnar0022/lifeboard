import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, Check, Sparkles } from 'lucide-react';
import { deepMerge, NEW_CHARACTER_DATA } from '../../dndUtils';
import { freshAbilityBuild } from '../AbilityBuildPanel';
import { finalizeDraft } from './creationUtils';
import { CREATION_HELP } from './creationHelp';
import RaceStep from './RaceStep';
import ClassStep from './ClassStep';
import AbilitiesStep from './AbilitiesStep';
import BackgroundStep from './BackgroundStep';
import AlignmentStep from './AlignmentStep';
import IdentityStep from './IdentityStep';
import ReviewStep from './ReviewStep';

const STEPS = [
  { key: 'race', label: 'Race', Component: RaceStep, required: true, complete: d => !!d.meta.race },
  { key: 'class', label: 'Class', Component: ClassStep, required: true, complete: d => !!d.meta.className },
  { key: 'abilities', label: 'Abilities', Component: AbilitiesStep, complete: () => true },
  { key: 'background', label: 'Background', Component: BackgroundStep, complete: () => true },
  { key: 'alignment', label: 'Alignment', Component: AlignmentStep, complete: () => true },
  { key: 'identity', label: 'Identity', Component: IdentityStep, complete: () => true },
  { key: 'review', label: 'Review', Component: ReviewStep, complete: () => true },
];

// A fresh creation draft: the blank-character shape with a point-buy build seeded
// (all base 8) and the name cleared so the Identity step invites input.
function initialDraft() {
  const base = deepMerge(NEW_CHARACTER_DATA, freshAbilityBuild());
  return deepMerge(base, { meta: { name: '' } });
}

export default function CreationFlow({ onCreate, onExit }) {
  const [draft, setDraftState] = useState(initialDraft);
  const [idx, setIdx] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const setDraft = (patch) => setDraftState(prev => deepMerge(prev, patch));

  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const canAdvance = !step.required || step.complete(draft);
  const help = CREATION_HELP[step.key];

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await onCreate(await finalizeDraft(draft));
    } finally {
      setCreating(false);
    }
  };

  const StepComponent = step.Component;

  return (
    <div className="crt-overlay">
      <div className="crt" role="dialog" aria-modal="true">
        <header className="crt__head">
          <div className="crt__title">
            <Sparkles size={18} /> <span>Create a Character</span>
          </div>
          <div className="crt__head-actions">
            <button className="crt-linkbtn" onClick={create} disabled={creating}>Skip to sheet</button>
            <button className="crt__close" onClick={onExit} aria-label="Cancel"><X size={18} /></button>
          </div>
        </header>

        <nav className="crt__tabs">
          {STEPS.map((s, i) => {
            const done = s.required && s.complete(draft);
            return (
              <button
                key={s.key}
                className={`crt__tab ${i === idx ? 'crt__tab--active' : ''} ${done ? 'crt__tab--done' : ''}`}
                onClick={() => setIdx(i)}
              >
                <span className="crt__tab-num">{done ? <Check size={12} /> : i + 1}</span>
                <span className="crt__tab-label">{s.label}</span>
              </button>
            );
          })}
        </nav>

        {help && (
          <div className={`crt__help ${helpOpen ? 'crt__help--open' : ''}`}>
            <button className="crt__help-toggle" onClick={() => setHelpOpen(o => !o)}>
              <HelpCircle size={14} /> New to this? {help.title}
            </button>
            {helpOpen && (
              <div className="crt__help-body">
                {help.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        )}

        <div className="crt__body">
          <StepComponent draft={draft} setDraft={setDraft} />
        </div>

        <footer className="crt__foot">
          <button className="crt-btn" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>
            <ChevronLeft size={16} /> Back
          </button>
          <span className="crt__foot-step">{idx + 1} / {STEPS.length} · {step.label}</span>
          {isLast ? (
            <button className="crt-btn crt-btn--accent" onClick={create} disabled={creating}>
              {creating ? 'Creating…' : 'Create Character'}
            </button>
          ) : (
            <button
              className="crt-btn crt-btn--accent"
              onClick={() => setIdx(i => Math.min(STEPS.length - 1, i + 1))}
              disabled={!canAdvance}
              title={canAdvance ? '' : `Choose a ${step.label.toLowerCase()} to continue`}
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
