import { useEffect, useState } from 'react';
import './ExcessBGIndicator.css';

interface ExcessBGIndicatorProps {
  totalCircles: number; // 0-5
  defeatThreshold?: number; // Max circles before defeat (default 5)
  onAnimationComplete?: () => void; // Callback when animation completes
}

export function ExcessBGIndicator({
  totalCircles,
  defeatThreshold = 5,
  onAnimationComplete,
}: ExcessBGIndicatorProps) {
  const maxCircles = 5;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (totalCircles > 0) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 500);

      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [totalCircles, onAnimationComplete]);

  // Damaged hearts fill from the right
  const isDamaged = (i: number) => i >= maxCircles - totalCircles;

  return (
    <div className="excess-bg-indicator">
      <h3 className="excess-bg-indicator__title">Excess BG</h3>
      <div className="excess-bg-indicator__hearts">
        {Array.from({ length: maxCircles }, (_, i) => {
          const damaged = isDamaged(i);
          return (
            <span
              key={i}
              className={`excess-bg-indicator__heart ${
                damaged
                  ? 'excess-bg-indicator__heart--damaged'
                  : 'excess-bg-indicator__heart--healthy'
              } ${isAnimating && damaged ? 'excess-bg-indicator__heart--transferring' : ''}`}
            />
          );
        })}
      </div>
      <div className="excess-bg-indicator__subtitle">
        {defeatThreshold - totalCircles} degradation{defeatThreshold - totalCircles !== 1 ? 's' : ''} till defeat
      </div>
    </div>
  );
}
