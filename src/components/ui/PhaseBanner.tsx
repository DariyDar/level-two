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
    baseText: 'Plan your meals for the day. Tasty food boosts mood but raises blood sugar. Healthy food does the opposite.',
  },
  Simulation: {
    icon: '\uD83C\uDFAC',
    baseText: 'Watch your character\'s day unfold. Use fast insulin if blood sugar rises too high!',
  },
  Results: {
    icon: '\uD83D\uDCCA',
    baseText: 'Day results. See where blood sugar left the green zone.',
  },
};

export function PhaseBanner({ phase, mood, remainingDays }: PhaseBannerProps) {
  const config = PHASE_CONFIG[phase];
  let text = config.baseText;

  if (phase === 'Planning' && remainingDays !== undefined) {
    if (remainingDays > 0) {
      text += ` ${remainingDays} day${remainingDays > 1 ? 's' : ''} ahead!`;
    } else {
      text += ' Last day!';
    }
  }

  if (phase === 'Results' && mood !== undefined) {
    text += ` End-of-day mood: ${mood}`;
  }

  return (
    <div className="phase-banner">
      <span className="phase-banner__icon">{config.icon}</span>
      <span className="phase-banner__text">{text}</span>
    </div>
  );
}
