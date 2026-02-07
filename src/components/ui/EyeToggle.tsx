import { useGameStore } from '../../store/gameStore';
import './EyeToggle.css';

export function EyeToggle() {
  const showDetailedIndicators = useGameStore((s) => s.showDetailedIndicators);
  const toggleDetailedIndicators = useGameStore((s) => s.toggleDetailedIndicators);

  return (
    <button
      className={`eye-toggle ${showDetailedIndicators ? 'eye-toggle--active' : ''}`}
      onClick={toggleDetailedIndicators}
      title={showDetailedIndicators ? 'Hide detailed indicators' : 'Show detailed indicators'}
    >
      {showDetailedIndicators ? '👁' : '👁‍🗨'}
    </button>
  );
}
