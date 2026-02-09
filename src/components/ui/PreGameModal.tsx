import { MoodScale } from './MoodScale';
import './PreGameModal.css';

interface PreGameModalProps {
  currentDay: number;
  totalDays: number;
  mood: number;
  onStart: () => void;
}

export function PreGameModal({ currentDay, totalDays, mood, onStart }: PreGameModalProps) {
  const isFirstDay = currentDay === 1;
  const remaining = totalDays - currentDay;

  return (
    <div className="pregame-overlay">
      <div className="pregame-card">
        <h2 className="pregame-card__title">
          {isFirstDay ? 'Day 1' : `Day ${currentDay}`}
        </h2>

        {isFirstDay ? (
          <p className="pregame-card__body">
            Try to keep your character healthy over {totalDays} days.
            Watch blood sugar and mood — you can't eat healthy all the time!
          </p>
        ) : (
          <div className="pregame-card__body">
            <p>{remaining > 0 ? `${remaining} day${remaining > 1 ? 's' : ''} remaining.` : 'Last day!'} Current mood:</p>
            <div className="pregame-card__mood">
              <MoodScale mood={mood} />
            </div>
          </div>
        )}

        <button className="pregame-card__button" onClick={onStart}>
          {isFirstDay ? 'Start' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
