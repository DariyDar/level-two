import './ExcessBGIndicator.css';

interface ExcessBGIndicatorProps {
  totalCircles: number; // 0-5
}

export function ExcessBGIndicator({ totalCircles }: ExcessBGIndicatorProps) {
  const maxCircles = 5;

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
            }`}
          />
        ))}
      </div>
    </div>
  );
}
