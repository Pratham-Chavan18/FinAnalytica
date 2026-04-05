import { useState, useEffect, useRef, useCallback } from 'react';

export default function AnimatedHeading({
  text,
  as: Tag = 'h3',
  className = '',
  staggerMs = 40,
  initialDelayMs = 200,
  replay = false,
}) {
  const containerRef = useRef(null);
  const [letterStates, setLetterStates] = useState(
    () => text.split('').map(() => false)
  );
  const [hasPlayed, setHasPlayed] = useState(false);

  const triggerAnimation = useCallback(() => {
    setLetterStates(text.split('').map(() => false));
    text.split('').forEach((_, i) => {
      setTimeout(() => {
        setLetterStates(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, initialDelayMs + i * staggerMs);
    });
  }, [text, staggerMs, initialDelayMs]);

  // Animate when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          setHasPlayed(true);
          triggerAnimation();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPlayed, triggerAnimation]);

  // Replay on click
  const handleClick = () => {
    if (!replay) return;
    setHasPlayed(false);
    setLetterStates(text.split('').map(() => false));
    setTimeout(() => {
      setHasPlayed(true);
      triggerAnimation();
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ cursor: replay ? 'pointer' : 'default' }}
    >
      <Tag className={`animated-heading ${className}`}>
        {text.split('').map((char, i) => (
          <span
            key={`${i}-${char}`}
            style={{
              display: 'inline-block',
              opacity: letterStates[i] ? 1 : 0,
              transform: letterStates[i]
                ? 'translateY(0px)'
                : 'translateY(28px)',
              filter: letterStates[i]
                ? 'blur(0px)'
                : 'blur(10px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, filter 0.6s ease-out',
              transitionDelay: `${i * staggerMs}ms`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </Tag>
    </div>
  );
}
