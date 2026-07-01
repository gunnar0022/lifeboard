import { Sparkles, FileText, X } from 'lucide-react';

/**
 * The single gate between "New Character" and building one. Offers the guided
 * flow (recommended) or the original straight-to-blank-sheet path, so power users
 * aren't slowed down.
 */
export default function CreationGate({ onGuided, onBlank, onClose }) {
  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div className="crt-gate__overlay" onClick={onOverlayClick}>
      <div className="crt-gate" role="dialog" aria-modal="true">
        <button className="crt-gate__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h3 className="crt-gate__title">New Character</h3>
        <p className="crt-gate__lede">How do you want to start?</p>
        <div className="crt-gate__options">
          <button className="crt-gate__opt crt-gate__opt--primary" onClick={onGuided}>
            <Sparkles size={22} />
            <span className="crt-gate__opt-name">Guided setup</span>
            <span className="crt-gate__opt-blurb">Walk through race, class, abilities, background, and more — with tips along the way.</span>
            <span className="crt-gate__opt-rec">Recommended</span>
          </button>
          <button className="crt-gate__opt" onClick={onBlank}>
            <FileText size={22} />
            <span className="crt-gate__opt-name">Start blank</span>
            <span className="crt-gate__opt-blurb">Jump straight to an empty sheet and fill everything in yourself.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
