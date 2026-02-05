import { useState, useEffect } from 'react';
import { convertPointsToTier } from '../../core/results';
import type { SimpleDegradation } from '../../core/types';
import './OrganDegradationDisplay.css';

interface OrganDegradationDisplayProps {
  currentDegradation: SimpleDegradation; // Degradation before this day
  addedDegradation: SimpleDegradation; // Degradation added this day
  animationDelay?: number; // Delay before starting tier animation (ms)
}

interface OrganConfig {
  name: string;
  label: string;
  iconPath: string;
  maxTier: number;
}

const ORGANS: Record<'liver' | 'pancreas', OrganConfig> = {
  liver: {
    name: 'liver',
    label: 'Liver',
    iconPath: '/assets/organs/liver_icon.png',
    maxTier: 5,
  },
  pancreas: {
    name: 'pancreas',
    label: 'Pancreas',
    iconPath: '/assets/organs/pancreas_icon.png',
    maxTier: 4,
  },
};

export function OrganDegradationDisplay({
  currentDegradation,
  addedDegradation,
  animationDelay = 1000,
}: OrganDegradationDisplayProps) {
  const [animatedTiers, setAnimatedTiers] = useState<{
    liver: number;
    pancreas: number;
  }>({
    liver: convertPointsToTier(currentDegradation.liver, 'liver'),
    pancreas: convertPointsToTier(currentDegradation.pancreas, 'pancreas'),
  });

  // Calculate new tiers after adding degradation
  const newTiers = {
    liver: convertPointsToTier(
      currentDegradation.liver + addedDegradation.liver,
      'liver'
    ),
    pancreas: convertPointsToTier(
      currentDegradation.pancreas + addedDegradation.pancreas,
      'pancreas'
    ),
  };

  // Animate tier change after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedTiers(newTiers);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay, newTiers.liver, newTiers.pancreas]);

  return (
    <div className="organ-degradation-display">
      <h3 className="organ-degradation-display__title">Degradation</h3>
      <div className="organ-degradation-display__organs">
        {(['liver', 'pancreas'] as const).map((organKey) => {
          const organ = ORGANS[organKey];
          const currentTier = animatedTiers[organKey];
          const maxCircles = organ.maxTier; // Liver: 5 circles (tier 0-5), Pancreas: 4 circles (tier 0-4)

          return (
            <div key={organKey} className="organ-degradation-display__organ">
              <div className="organ-degradation-display__organ-icon">
                <img
                  src={organ.iconPath}
                  alt={organ.label}
                  className="organ-degradation-display__icon"
                />
                <div className="organ-degradation-display__label">
                  {organ.label}
                </div>
              </div>

              <div className="organ-degradation-display__circles">
                {Array.from({ length: maxCircles }, (_, i) => {
                  const isDegraded = i >= maxCircles - currentTier;
                  return (
                    <div
                      key={i}
                      className={`organ-degradation-display__circle ${
                        isDegraded
                          ? 'organ-degradation-display__circle--degraded'
                          : 'organ-degradation-display__circle--healthy'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
