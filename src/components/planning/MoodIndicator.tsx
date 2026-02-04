import type { MoodLevel } from '../../core/types';
import './MoodIndicator.css';

interface MoodIndicatorProps {
  mood: MoodLevel;
}

// Emoji for each mood level (1-5)
const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😟',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '😄',
};

export function MoodIndicator({ mood }: MoodIndicatorProps) {
  return (
    <div className="mood-indicator">
      <div className="mood-indicator__label">Mood</div>
      <div className="mood-indicator__faces">
        {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
          <span
            key={level}
            className={`mood-indicator__face ${
              level === mood ? 'mood-indicator__face--active' : ''
            } ${level > mood ? 'mood-indicator__face--inactive' : ''}`}
          >
            {MOOD_EMOJIS[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
