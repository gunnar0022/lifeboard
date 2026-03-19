import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './FloatingSnippets.css';

export default function FloatingSnippets({ snippets }) {
  const [focusIndex, setFocusIndex] = useState(0);

  const positioned = useMemo(() => {
    if (!snippets || snippets.length === 0) return [];
    return snippets.map((s, i) => ({
      ...s,
      x: 3 + (i % 4) * 22 + Math.random() * 10,
      y: 8 + Math.floor(i / 4) * 28 + Math.random() * 15,
      size: 1.1 + Math.random() * 0.25,
      drift: 6 + Math.random() * 12,
      duration: 25 + Math.random() * 20,
      delay: Math.random() * -10,
    }));
  }, [snippets]);

  // Cycle focus every 6 seconds
  useEffect(() => {
    if (positioned.length === 0) return;
    const interval = setInterval(() => {
      setFocusIndex(prev => (prev + 1) % positioned.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [positioned.length]);

  return (
    <div className="floating-snippets card">
      {positioned.length === 0 ? (
        <div className="floating-snippets__empty">
          Your words will appear here as you write
        </div>
      ) : (
        positioned.map((s, i) => {
          const isFocused = i === focusIndex;
          return (
            <motion.div
              key={i}
              className={`floating-snippets__item ${isFocused ? 'floating-snippets__item--focus' : ''}`}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                fontSize: `${s.size}rem`,
                zIndex: isFocused ? 10 : 1,
              }}
              animate={{
                opacity: isFocused ? 1 : 0.2,
                x: [0, s.drift, -s.drift / 2, 0],
                y: [0, -s.drift / 2, s.drift / 3, 0],
              }}
              transition={{
                opacity: { duration: 0.8, ease: 'easeInOut' },
                x: { duration: s.duration, repeat: Infinity, ease: 'linear', delay: s.delay },
                y: { duration: s.duration, repeat: Infinity, ease: 'linear', delay: s.delay },
              }}
            >
              {s.text.length > 120 ? s.text.slice(0, 120) + '...' : s.text}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
