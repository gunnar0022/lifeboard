import { useState } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';

/**
 * Two-gate deletion confirmation modal.
 *   Gate 1: warning + Cancel / Continue
 *   Gate 2: type the item's name (or DELETE) to enable the final Delete button
 *
 * Props:
 *   itemType  — 'character' | 'campaign' (label only)
 *   name      — item name, shown and required to type at gate 2
 *   warning   — optional extra warning line (e.g. campaign notes)
 *   onConfirm — async () => void, called once the user fully confirms
 *   onCancel  — () => void
 */
export default function DeleteConfirm({ itemType, name, warning, onConfirm, onCancel }) {
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const displayName = (name || '').trim();
  const confirmText = displayName || 'DELETE';
  const matches = typed.trim().toLowerCase() === confirmText.toLowerCase();

  const handleDelete = async () => {
    if (!matches || deleting) return;
    setDeleting(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error('Delete failed:', e);
      setDeleting(false);
    }
  };

  return (
    <div className="dnd-delete-overlay" onClick={deleting ? undefined : onCancel}>
      <div className="dnd-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="dnd-delete-modal__icon">
          <AlertTriangle size={28} />
        </div>

        {step === 1 ? (
          <>
            <h3 className="dnd-delete-modal__title">
              Delete {itemType} {displayName ? `"${displayName}"` : ''}?
            </h3>
            <p className="dnd-delete-modal__body">
              This permanently deletes this {itemType} and cannot be undone.
              {warning ? ` ${warning}` : ''}
            </p>
            <div className="dnd-delete-modal__btns">
              <button className="dnd-delete-modal__btn" onClick={onCancel}>Cancel</button>
              <button
                className="dnd-delete-modal__btn dnd-delete-modal__btn--danger"
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="dnd-delete-modal__title">Are you absolutely sure?</h3>
            <p className="dnd-delete-modal__body">
              Type <strong>{confirmText}</strong> below to permanently delete this {itemType}.
            </p>
            <input
              className="dnd-delete-modal__input"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={confirmText}
              autoFocus
              disabled={deleting}
              onKeyDown={e => { if (e.key === 'Enter') handleDelete(); if (e.key === 'Escape') onCancel(); }}
            />
            <div className="dnd-delete-modal__btns">
              <button className="dnd-delete-modal__btn" onClick={onCancel} disabled={deleting}>Cancel</button>
              <button
                className="dnd-delete-modal__btn dnd-delete-modal__btn--danger"
                onClick={handleDelete}
                disabled={!matches || deleting}
              >
                {deleting ? <><Loader size={13} className="dnd-sheet__spinner-sm" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
