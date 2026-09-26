import { useEffect, useMemo, useState } from 'react';

// Simulated speech recognition: reveals the sample sentence word by word so
// the listening screen behaves like live dictation. Swap for a real speech
// recognition module later; the screen only needs `transcript` and `stop`.
export function useVoiceTranscript(sample: string, wordsPerSecond = 3) {
  const words = useMemo(() => sample.split(/\s+/), [sample]);
  const [count, setCount] = useState(0);
  const [listening, setListening] = useState(true);

  useEffect(() => {
    if (!listening) return;
    const timer = setInterval(() => {
      setCount((current) => Math.min(words.length, current + 1));
    }, 1000 / wordsPerSecond);
    return () => clearInterval(timer);
  }, [listening, wordsPerSecond, words.length]);

  return { transcript: words.slice(0, count).join(' '), stop: () => setListening(false) };
}
