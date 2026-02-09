import './PhaseBanner.css';

interface PhaseBannerProps {
  phase: 'Planning' | 'Simulation' | 'Results';
  mood?: number;
  remainingDays?: number;
}

const PHASE_CONFIG: Record<
  PhaseBannerProps['phase'],
  { icon: string; baseText: string }
> = {
  Planning: {
    icon: '\uD83D\uDCCB',
    baseText: 'Спланируйте питание на день. Вкусная еда поднимает настроение, но повышает сахар. Полезная \u2014 наоборот.',
  },
  Simulation: {
    icon: '\uD83C\uDFAC',
    baseText: 'Наблюдайте за днём персонажа. Используйте быстрый инсулин, если сахар поднимется слишком высоко!',
  },
  Results: {
    icon: '\uD83D\uDCCA',
    baseText: 'Итоги дня. Посмотрите, где сахар вышел из зелёной зоны.',
  },
};

export function PhaseBanner({ phase, remainingDays }: PhaseBannerProps) {
  const config = PHASE_CONFIG[phase];
  let text = config.baseText;

  if (phase === 'Planning' && remainingDays !== undefined && remainingDays > 0) {
    text += ` Впереди ещё ${remainingDays} дн!`;
  }

  return (
    <div className="phase-banner">
      <span className="phase-banner__icon">{config.icon}</span>
      <span className="phase-banner__text">{text}</span>
    </div>
  );
}
