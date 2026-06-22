/**
 * Mech — renders rules prose with mechanical tokens highlighted so a page reads
 * as more than a wall of text. Wraps dice (2d6, 1d8+2), distances (30 ft,
 * 1 mile), and bare numbers / ordinals / signed modifiers (+2, 3rd) in colored
 * spans. Pure presentational; the encyclopedia, creation, and (later) the sheet
 * can all share one highlighter so the visual language stays consistent.
 */

// One combined matcher; order matters — dice and distances must win over the
// bare-number rule, so they come first in the alternation.
const TOKEN = /(\d+d\d+(?:\s*[+\-]\s*\d+)?|\b\d+\s?(?:ft\.?|feet|foot|miles?)\b|[+\-]\d+|\b\d+(?:st|nd|rd|th)?\b)/g;

function classify(tok) {
  if (/\d+d\d+/.test(tok)) return 'mech--dice';
  if (/(ft\.?|feet|foot|miles?)/.test(tok)) return 'mech--dist';
  return 'mech--num';
}

export default function Mech({ text, className = '' }) {
  if (!text) return null;
  const parts = String(text).split(TOKEN);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        // Odd indices are the captured tokens; even indices are plain text.
        i % 2 === 1
          ? <span key={i} className={`mech ${classify(part)}`}>{part}</span>
          : part
      )}
    </span>
  );
}
