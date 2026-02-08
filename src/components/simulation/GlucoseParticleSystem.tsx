import { useEffect, useRef, useState, useCallback } from 'react';
import './GlucoseParticleSystem.css';

// Flow types for particle streams
type FlowType = 'ship-liver' | 'liver-bg' | 'bg-muscles' | 'bg-kidneys';

interface Particle {
  id: number;
  flow: FlowType;
  progress: number; // 0-1, where 1 = reached destination
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  driftOffset: number;
  glucoseAmount: number; // 1-15 glucose per particle (sugar cube representation)
}

interface GlucoseParticleSystemProps {
  shipUnloading: number;
  liverToBgRate: number;
  bgToMusclesRate: number;
  bgToKidneysRate: number;
  speed: number;
  isPaused: boolean;
  dissolveProgress: number;
}

// Glucose per particle (sugar cube representation: 25 mg/dL = 1 cube)
const GLUCOSE_PER_PARTICLE = 25;

// Visual multiplier for continuous stream (reduced for performance)
const VISUAL_MULTIPLIER = 1;

// Container positions (percentages relative to .simulation-phase__main)
// v0.20 layout: K top-left, M top-right, L bottom-left, P bottom-right, BG center
const POINTS = {
  // Ship dissolve edge (ship queue below body diagram)
  shipY: 75,

  // Liver container (LC) - bottom-left
  liverTop: { x: 30, y: 36 },
  liverBottom: { x: 30, y: 54 },

  // BG bar - center (shifted right by 20px from 50%)
  bgTop: { x: 55, y: 10 },
  bgBottom: { x: 55, y: 54 },

  // Muscles substrate - top right
  musclesLeft: { x: 70, y: 19 },

  // Kidneys area (KC) - top left
  kidneysRight: { x: 40, y: 19 },
};

function getSpawnPosition(flow: FlowType, dissolveProgress: number): { x: number; y: number } {
  switch (flow) {
    case 'ship-liver': {
      // Ship dissolves across width, particles fly up-left to liver
      const shipXMin = 20;
      const shipXMax = 80;
      const dissolveX = shipXMin + (shipXMax - shipXMin) * dissolveProgress;
      return {
        x: dissolveX + (Math.random() - 0.5) * 3,
        y: POINTS.shipY + (Math.random() - 0.5) * 2,
      };
    }
    case 'liver-bg':
      // Exit from liver container top, heading right toward BG
      return {
        x: POINTS.liverTop.x + (Math.random() - 0.5) * 4,
        y: POINTS.liverTop.y + (Math.random() - 0.5) * 4,
      };
    case 'bg-muscles':
      // Exit from right side of BG bar, heading right to muscles (top-right)
      return {
        x: POINTS.bgBottom.x + 7 + (Math.random() - 0.5) * 2,
        y: POINTS.bgTop.y + 10 + (Math.random() - 0.5) * 4,
      };
    case 'bg-kidneys':
      // Exit from left side of BG bar, heading left to kidneys (top-left)
      return {
        x: POINTS.bgBottom.x - 7 + (Math.random() - 0.5) * 2,
        y: POINTS.bgTop.y + 10 + (Math.random() - 0.5) * 4,
      };
  }
}

function getTargetPosition(flow: FlowType): { x: number; y: number } {
  switch (flow) {
    case 'ship-liver':
      // Target: liver container center
      return {
        x: POINTS.liverBottom.x + (Math.random() - 0.5) * 4,
        y: (POINTS.liverTop.y + POINTS.liverBottom.y) / 2 + (Math.random() - 0.5) * 4,
      };
    case 'liver-bg':
      // Target: BG container center
      return {
        x: POINTS.bgBottom.x + (Math.random() - 0.5) * 4,
        y: (POINTS.bgTop.y + POINTS.bgBottom.y) / 2 + (Math.random() - 0.5) * 6,
      };
    case 'bg-muscles':
      // Target: muscles substrate center (top-right, no container)
      return {
        x: POINTS.musclesLeft.x + 5,
        y: POINTS.musclesLeft.y + (Math.random() - 0.5) * 6,
      };
    case 'bg-kidneys':
      // Target: kidneys container center (top-left)
      return {
        x: POINTS.kidneysRight.x - 5 + (Math.random() - 0.5) * 4,
        y: POINTS.kidneysRight.y + 4 + (Math.random() - 0.5) * 6,
      };
  }
}

function getParticlePosition(p: Particle, time: number): { x: number; y: number } {
  const baseX = p.startX + (p.targetX - p.startX) * p.progress;
  const baseY = p.startY + (p.targetY - p.startY) * p.progress;

  // Small drift perpendicular to path
  const dx = p.targetX - p.startX;
  const dy = p.targetY - p.startY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  // Gentle sine wave, smaller amplitude
  const driftAmplitude = 0.8 * (1 - p.progress * 0.5);
  const driftWave = Math.sin(p.progress * Math.PI * 1.5 + p.driftOffset + time * 0.0005);
  const drift = driftWave * driftAmplitude;

  return {
    x: baseX + perpX * drift,
    y: baseY + perpY * drift,
  };
}

export function GlucoseParticleSystem({
  shipUnloading,
  liverToBgRate,
  bgToMusclesRate,
  bgToKidneysRate,
  speed,
  isPaused,
  dissolveProgress,
}: GlucoseParticleSystemProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const globalTimeRef = useRef<number>(0);

  // Time-based spawning for continuous stream
  const lastSpawnTimeRef = useRef({
    shipLiver: 0,
    liverBg: 0,
    bgMuscles: 0,
    bgKidneys: 0,
  });

  const ratesRef = useRef({
    shipUnloading,
    liverToBgRate,
    bgToMusclesRate,
    bgToKidneysRate,
    speed,
    dissolveProgress,
  });

  useEffect(() => {
    ratesRef.current = {
      shipUnloading,
      liverToBgRate,
      bgToMusclesRate,
      bgToKidneysRate,
      speed,
      dissolveProgress,
    };
  }, [shipUnloading, liverToBgRate, bgToMusclesRate, bgToKidneysRate, speed, dissolveProgress]);

  const spawnParticle = useCallback((
    flow: FlowType,
    currentDissolve: number,
    glucoseAmount: number = GLUCOSE_PER_PARTICLE
  ): Particle => {
    const start = getSpawnPosition(flow, currentDissolve);
    const target = getTargetPosition(flow);

    return {
      id: nextIdRef.current++,
      flow,
      progress: 0,
      x: start.x,
      y: start.y,
      startX: start.x,
      startY: start.y,
      targetX: target.x,
      targetY: target.y,
      driftOffset: Math.random() * Math.PI * 2,
      glucoseAmount,
    };
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        // Reset spawn times when starting
        lastSpawnTimeRef.current = {
          shipLiver: timestamp,
          liverBg: timestamp,
          bgMuscles: timestamp,
          bgKidneys: timestamp,
        };
      }

      const deltaTime = Math.min(timestamp - lastTimeRef.current, 100);
      lastTimeRef.current = timestamp;
      globalTimeRef.current = timestamp;

      const deltaSeconds = deltaTime / 1000;
      const rates = ratesRef.current;

      // Travel time: ~1.5s at 1x speed
      const progressPerSecond = 0.67 * rates.speed;

      setParticles(prev => {
        let updated = [...prev];
        const spawnTimes = lastSpawnTimeRef.current;

        // Spawn based on time intervals (not accumulators) for continuous stream
        // Calculate spawn interval: higher rate = shorter interval
        const getSpawnInterval = (rate: number) => {
          if (rate <= 0) return Infinity;
          return 1000 / (rate * rates.speed * VISUAL_MULTIPLIER);
        };

        // Ship → Liver
        if (rates.shipUnloading > 0) {
          const interval = getSpawnInterval(rates.shipUnloading);
          while (timestamp - spawnTimes.shipLiver >= interval) {
            updated.push(spawnParticle('ship-liver', rates.dissolveProgress));
            spawnTimes.shipLiver += interval;
          }
        }

        // Liver → BG
        if (rates.liverToBgRate > 0) {
          const interval = getSpawnInterval(rates.liverToBgRate);
          while (timestamp - spawnTimes.liverBg >= interval) {
            updated.push(spawnParticle('liver-bg', 0));
            spawnTimes.liverBg += interval;
          }
        }

        // BG → Muscles
        if (rates.bgToMusclesRate > 0) {
          const interval = getSpawnInterval(rates.bgToMusclesRate);
          while (timestamp - spawnTimes.bgMuscles >= interval) {
            updated.push(spawnParticle('bg-muscles', 0));
            spawnTimes.bgMuscles += interval;
          }
        }

        // BG → Kidneys
        if (rates.bgToKidneysRate > 0) {
          const interval = getSpawnInterval(rates.bgToKidneysRate);
          while (timestamp - spawnTimes.bgKidneys >= interval) {
            updated.push(spawnParticle('bg-kidneys', 0));
            spawnTimes.bgKidneys += interval;
          }
        }

        // Update particles
        updated = updated.map(p => {
          const newProgress = p.progress + progressPerSecond * deltaSeconds;

          // Remove when reached destination (no absorption animation)
          if (newProgress >= 1) {
            return { ...p, progress: 2 }; // Mark for removal
          }

          const pos = getParticlePosition({ ...p, progress: newProgress }, globalTimeRef.current);

          return {
            ...p,
            progress: newProgress,
            x: pos.x,
            y: pos.y,
          };
        });

        // Remove finished particles
        updated = updated.filter(p => p.progress < 1.5);

        // Limit particles
        if (updated.length > 500) {
          updated = updated.slice(-500);
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, spawnParticle]);

  return (
    <div className="glucose-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="glucose-particles__particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
        >
          {/* Sugar cube icon */}
          <span className="glucose-particles__cube">🧊</span>
          {/* Show number for partial cubes */}
          {p.glucoseAmount < GLUCOSE_PER_PARTICLE && (
            <span className="glucose-particles__amount">{p.glucoseAmount}</span>
          )}
        </div>
      ))}
    </div>
  );
}
