import './RankDisplay.css';

interface RankDisplayProps {
  rank: 1 | 2 | 3 | 4 | 5;
  message: string;
}

const RANK_STARS = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

const RANK_LABELS = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export function RankDisplay({ rank, message }: RankDisplayProps) {
  return (
    <div className={`rank-display rank-display--rank-${rank}`}>
      <div className="rank-display__stars">{RANK_STARS[rank]}</div>
      <div className="rank-display__label">{RANK_LABELS[rank]}</div>
      <div className="rank-display__message">{message}</div>
    </div>
  );
}
