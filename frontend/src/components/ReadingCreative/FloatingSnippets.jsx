import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './FloatingSnippets.css';

export default function FloatingSnippets({ snippets }) {
  const [focusIndex, setFocusIndex] = useState(0);

  const positioned = useMemo(() => {
    if (!snippets || snippets.length === 0) return [];
    return snippets.map((s, i) => ({
      ...s,
      // Spread across the full area — use the gutters and gaps
      x: 2 + Math.random() * 88,
      y: 3 + Math.random() * 90,
      size: 0.82 + Math.random() * 0.3,
      drift: 5 + Math.random() * 10,
      duration: 30 + Math.random() * 25,
      delay: Math.random() * -15,
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

  if (positioned.length === 0) {
    return (
      <div className="floating-snippets">
        <div className="floating-snippets__empty">
          Your words will appear here as you write
        </div>
      </div>
    );
  }

  return (
    <div className="floating-snippets">
      {positioned.map((s, i) => {
        const isFocused = i === focusIndex;
        return (
          <motion.div
            key={i}
            className={`floating-snippets__item ${isFocused ? 'floating-snippets__item--focus' : ''}`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: `${s.size}rem`,
              zIndex: isFocused ? 2 : 0,
            }}
            animate={{
              opacity: isFocused ? 0.85 : 0.12,
              x: [0, s.drift, -s.drift / 2, 0],
              y: [0, -s.drift / 2, s.drift / 3, 0],
            }}
            transition={{
              opacity: { duration: 1, ease: 'easeInOut' },
              x: { duration: s.duration, repeat: Infinity, ease: 'linear', delay: s.delay },
              y: { duration: s.duration, repeat: Infinity, ease: 'linear', delay: s.delay },
            }}
          >
            {s.text.length > 100 ? s.text.slice(0, 100) + '...' : s.text}
          </motion.div>
        );
      })}
    </div>
  );
}
