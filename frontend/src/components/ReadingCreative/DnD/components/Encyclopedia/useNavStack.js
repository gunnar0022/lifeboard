import { useState, useCallback } from 'react';

/**
 * Browser-like navigation stack for the encyclopedia. A frame is
 * `{ view, nodeId?, title, accent? }`. The stack always has a home frame at the
 * base, so popping can never empty it.
 *
 *   views: 'home' | 'raceList' | 'classList' | 'spellList' | 'node' | 'spell'
 *
 * Spells never link back outward, and the two trees are shallow
 * (race→subrace, class→subclass→spellList→spell), so a plain push/pop stack is
 * sufficient — no cycles to guard against.
 */
const HOME = { view: 'home', title: 'Encyclopedia' };

export default function useNavStack() {
  const [stack, setStack] = useState([HOME]);

  const push = useCallback((frame) => setStack(s => [...s, frame]), []);
  const pop = useCallback(() => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const home = useCallback(() => setStack([HOME]), []);
  // Jump back to a specific crumb (index into the stack).
  const goto = useCallback((index) => setStack(s => s.slice(0, index + 1)), []);

  const current = stack[stack.length - 1];
  return { stack, current, push, pop, home, goto };
}
