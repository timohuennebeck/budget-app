import { useEffect, useMemo, useState } from 'react';

// Simulated speech recognition: reveals the sample sentence word by word so
// the listening screen behaves like live dictation. Swap for a real speech
// recognition module later; the screen only needs `transcript` and `stop`.
const WORDS_PER_SECOND = 3;

export function useVoiceTranscript(sample: string) {
  const words = useMemo(() => sample.split(/\s+/), [sample]);
  const [count, setCount] = useState(0);
  const [listening, setListening] = useState(true);

  useEffect(() => {
    if (!listening) return;
    const timer = setInterval(() => {
      setCount((current) => Math.min(words.length, current + 1));
    }, 1000 / WORDS_PER_SECOND);
    return () => clearInterval(timer);
  }, [listening, words.length]);

  return { transcript: words.slice(0, count).join(' '), stop: () => setListening(false) };
}
