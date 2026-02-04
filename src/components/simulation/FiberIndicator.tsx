import './FiberIndicator.css';

interface FiberIndicatorProps {
  isActive: boolean;
}

export function FiberIndicator({ isActive }: FiberIndicatorProps) {
  if (!isActive) return null;

  return (
    <div className="fiber-indicator">
      <span className="fiber-indicator__icon">🌿</span>
      <span className="fiber-indicator__text">Glucose Income Slowed</span>
    </div>
  );
}
