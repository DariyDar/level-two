import { useEffect, useState } from 'react';
import './ExcessBGIndicator.css';

interface ExcessBGIndicatorProps {
  totalCircles: number; // 0-5
  onAnimationComplete?: () => void; // Callback when animation completes
}

export function ExcessBGIndicator({
  totalCircles,
  onAnimationComplete,
}: ExcessBGIndicatorProps) {
  const maxCircles = 5;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (totalCircles > 0) {
      // Start pulsing animation after a short delay
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 500);

      // Trigger completion callback after animation
      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [totalCircles, onAnimationComplete]);

  return (
    <div className="excess-bg-indicator">
      <h3 className="excess-bg-indicator__title">Excess BG</h3>
      <div className="excess-bg-indicator__circles">
        {Array.from({ length: maxCircles }, (_, i) => (
          <div
            key={i}
            className={`excess-bg-indicator__circle ${
              i < totalCircles
                ? 'excess-bg-indicator__circle--active'
                : 'excess-bg-indicator__circle--inactive'
            } ${isAnimating && i < totalCircles ? 'excess-bg-indicator__circle--transferring' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
