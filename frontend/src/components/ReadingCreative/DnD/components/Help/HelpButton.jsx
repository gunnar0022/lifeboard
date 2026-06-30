import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import HelpModal from './HelpModal';

/**
 * The little "?" affordance shown next to a tab title (or other UI). Opens the
 * beginner help dialog for the given topic. `size` and `className` let callers
 * tune it for inline placement (e.g. next to the Edit toggle).
 */
export default function HelpButton({ topic, label = 'What is this?', size = 16, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`dnd-help-btn ${className}`}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={label}
        title={label}
      >
        <HelpCircle size={size} />
      </button>
      {open && <HelpModal topic={topic} onClose={() => setOpen(false)} />}
    </>
  );
}
