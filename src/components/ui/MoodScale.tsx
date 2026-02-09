import './MoodScale.css';

interface MoodScaleProps {
  mood: number;
}

export function MoodScale({ mood }: MoodScaleProps) {
  // Clamp mood to -50..+50 range
  const clamped = Math.max(-50, Math.min(50, mood));

  // Convert mood (-50..+50) to percentage position (0..100%)
  const percent = ((clamped + 50) / 100) * 100;

  const valueClass =
    clamped > 0
      ? 'mood-scale__value--positive'
      : clamped < 0
        ? 'mood-scale__value--negative'
        : 'mood-scale__value--neutral';

  const sign = clamped > 0 ? '+' : '';

  return (
    <div className="mood-scale">
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
