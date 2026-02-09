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
          {isFirstDay ? 'День 1' : `День ${currentDay}`}
        </h2>

        {isFirstDay ? (
          <p className="pregame-card__body">
            Постарайтесь за {totalDays} дн. не навредить здоровью персонажа.
            Следите за уровнем сахара в крови и настроением —
            нельзя всё время есть только полезное!
          </p>
        ) : (
          <div className="pregame-card__body">
            <p>Осталось {remaining} дн. Текущее настроение:</p>
            <div className="pregame-card__mood">
              <MoodScale mood={mood} />
            </div>
          </div>
        )}

        <button className="pregame-card__button" onClick={onStart}>
          {isFirstDay ? 'Начать' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
}
