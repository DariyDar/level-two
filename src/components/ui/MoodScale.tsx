import { useState, useEffect } from 'react';
import './MoodScale.css';

interface MoodScaleProps {
  mood: number;
  moodDelta?: number | null;
  moodDeltaKey?: number | null;
}

export function MoodScale({ mood, moodDelta, moodDeltaKey }: MoodScaleProps) {
  const [flashClass, setFlashClass] = useState('');
  const [showDelta, setShowDelta] = useState<number | null>(null);
  const [deltaAnimKey, setDeltaAnimKey] = useState(0);

  useEffect(() => {
    if (moodDelta != null && moodDelta !== 0 && moodDeltaKey != null) {
      setShowDelta(moodDelta);
      setDeltaAnimKey((k) => k + 1);
      setFlashClass(moodDelta > 0 ? 'mood-scale--flash-positive' : 'mood-scale--flash-negative');
      const timer = setTimeout(() => {
        setFlashClass('');
        setShowDelta(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [moodDeltaKey]);

  // Clamp mood to -10..+10 range
  const clamped = Math.max(-10, Math.min(10, mood));

  // Convert mood (-10..+10) to percentage position (0..100%)
  const percent = ((clamped + 10) / 20) * 100;

  const valueClass =
    clamped > 0
      ? 'mood-scale__value--positive'
      : clamped < 0
        ? 'mood-scale__value--negative'
        : 'mood-scale__value--neutral';

  const sign = clamped > 0 ? '+' : '';

  return (
    <div className={`mood-scale ${flashClass}`}>
      {showDelta !== null && (
        <span
          key={deltaAnimKey}
          className={`mood-scale__delta ${showDelta > 0 ? 'mood-scale__delta--positive' : 'mood-scale__delta--negative'}`}
        >
          {showDelta > 0 ? '+' : ''}{showDelta}
        </span>
      )}
      <div className="mood-scale__bar">
        <div className="mood-scale__zone mood-scale__zone--red" />
        <div className="mood-scale__zone mood-scale__zone--orange" />
        <div className="mood-scale__zone mood-scale__zone--yellow" />
        <div className="mood-scale__zone mood-scale__zone--green" />
        <div
          className="mood-scale__marker"
          style={{ left: `${percent}%` }}
        />
      </div>
      <span className={`mood-scale__value ${valueClass}`}>
        {sign}{clamped}
      </span>
    </div>
  );
}
