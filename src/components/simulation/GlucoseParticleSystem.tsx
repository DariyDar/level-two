import { useEffect, useRef, useState, useCallback } from 'react';
import './GlucoseParticleSystem.css';

// Flow types for particle streams
type FlowType = 'ship-liver' | 'liver-bg' | 'bg-muscles' | 'bg-kidneys';

interface Particle {
  id: number;
  flow: FlowType;
  progress: number; // 0-1, where 1 = reached destination
  isAbsorbing: boolean;
  x: number;
  y: number;
  // Starting position
  startX: number;
  startY: number;
  // Target position
  targetX: number;
  targetY: number;
  // Smoke-like drift (small, focused)
  driftOffset: number; // perpendicular offset
  driftSpeed: number;
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

const VISUAL_MULTIPLIER = 2;

// Entry/exit points for each container (percentages relative to .simulation-phase__main)
// Measured from screenshot v0.2.2:
// - simulation-phase__main contains BodyDiagram (~58%) + gap + ShipQueue (~40%)
// - BodyDiagram: padding 20px, middle-row at top, bottom-row (Liver) below
// - ShipQueue: starts at ~60% of main height
const POINTS = {
  // Ship dissolve edge - first row in ShipQueue area
  shipDissolve: { y: 72 },  // Ships are at ~72% from top of main

  // Liver - center container in bottom row of BodyDiagram
  liverBottom: { x: 50, y: 55 },  // Bottom of liver bar
  liverTop: { x: 50, y: 42 },     // Top of liver bar

  // BG - center container in middle row (larger bar)
  bgBottom: { x: 50, y: 32 },     // Bottom of BG bar
  bgLeft: { x: 43, y: 18 },       // Left edge of BG (for muscles exit)
  bgRight: { x: 57, y: 18 },      // Right edge of BG (for kidneys exit)

  // Muscles - left container, center of the bar
  musclesCenter: { x: 27, y: 22 },

  // Kidneys - right container, center of the bar
  kidneysCenter: { x: 73, y: 22 },
};

// Get spawn position based on flow type
function getSpawnPosition(flow: FlowType, dissolveProgress: number): { x: number; y: number } {
  switch (flow) {
    case 'ship-liver': {
      // Spawn at dissolve edge (moves left to right with ship unloading)
      const shipXMin = 18;
      const shipXMax = 82;
      const dissolveX = shipXMin + (shipXMax - shipXMin) * dissolveProgress;
      return {
        x: dissolveX + (Math.random() - 0.5) * 4,
        y: POINTS.shipDissolve.y + (Math.random() - 0.5) * 2,
      };
    }
    case 'liver-bg': {
      // Spawn from top of liver bar
      return {
        x: POINTS.liverTop.x + (Math.random() - 0.5) * 6,
        y: POINTS.liverTop.y,
      };
    }
    case 'bg-muscles': {
      // Spawn from left side of BG
      return {
        x: POINTS.bgLeft.x,
        y: POINTS.bgLeft.y + (Math.random() - 0.5) * 4,
      };
    }
    case 'bg-kidneys': {
      // Spawn from right side of BG
      return {
        x: POINTS.bgRight.x,
        y: POINTS.bgRight.y + (Math.random() - 0.5) * 4,
      };
    }
  }
}

// Get target position based on flow type
function getTargetPosition(flow: FlowType): { x: number; y: number } {
  switch (flow) {
    case 'ship-liver':
      // Enter liver from bottom
      return {
        x: POINTS.liverBottom.x + (Math.random() - 0.5) * 6,
        y: POINTS.liverBottom.y,
      };
    case 'liver-bg':
      // Enter BG from bottom
      return {
        x: POINTS.bgBottom.x + (Math.random() - 0.5) * 6,
        y: POINTS.bgBottom.y,
      };
    case 'bg-muscles':
      // Enter Muscles from center
      return {
        x: POINTS.musclesCenter.x,
        y: POINTS.musclesCenter.y + (Math.random() - 0.5) * 4,
      };
    case 'bg-kidneys':
      // Enter Kidneys from center
      return {
        x: POINTS.kidneysCenter.x,
        y: POINTS.kidneysCenter.y + (Math.random() - 0.5) * 4,
      };
  }
}

// Calculate position along path with smoke-like drift
function getParticlePosition(p: Particle, time: number): { x: number; y: number } {
  // Linear interpolation along path
  const baseX = p.startX + (p.targetX - p.startX) * p.progress;
  const baseY = p.startY + (p.targetY - p.startY) * p.progress;

  // Calculate perpendicular direction for drift
  const dx = p.targetX - p.startX;
  const dy = p.targetY - p.startY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  // Smoke-like drift: small sine wave perpendicular to path
  // Amplitude decreases as particle approaches target (more focused at end)
  const driftAmplitude = 1.5 * (1 - p.progress * 0.5);
  const driftWave = Math.sin(p.progress * Math.PI * 2 + p.driftOffset + time * p.driftSpeed * 0.001);
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

  // Accumulators for fractional spawning
  const accumulators = useRef({
    shipLiver: 0,
    liverBg: 0,
    bgMuscles: 0,
    bgKidneys: 0,
  });

  // Store rates in refs
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

  const spawnParticle = useCallback((flow: FlowType, currentDissolve: number): Particle => {
    const start = getSpawnPosition(flow, currentDissolve);
    const target = getTargetPosition(flow);

    return {
      id: nextIdRef.current++,
      flow,
      progress: 0,
      isAbsorbing: false,
      x: start.x,
      y: start.y,
      startX: start.x,
      startY: start.y,
      targetX: target.x,
      targetY: target.y,
      driftOffset: Math.random() * Math.PI * 2,
      driftSpeed: 0.5 + Math.random() * 1, // Slow drift
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
      }

      const deltaTime = Math.min(timestamp - lastTimeRef.current, 100);
      lastTimeRef.current = timestamp;
      globalTimeRef.current = timestamp;

      const deltaSeconds = deltaTime / 1000;
      const rates = ratesRef.current;

      // Faster travel: complete path in ~2s at 1x speed
      const progressPerSecond = 0.5 * rates.speed;

      setParticles(prev => {
        let updated = [...prev];
        const acc = accumulators.current;

        // Spawn particles for each flow
        if (rates.shipUnloading > 0) {
          acc.shipLiver += rates.shipUnloading * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (acc.shipLiver >= 1) {
            updated.push(spawnParticle('ship-liver', rates.dissolveProgress));
            acc.shipLiver -= 1;
          }
        }

        if (rates.liverToBgRate > 0) {
          acc.liverBg += rates.liverToBgRate * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (acc.liverBg >= 1) {
            updated.push(spawnParticle('liver-bg', 0));
            acc.liverBg -= 1;
          }
        }

        if (rates.bgToMusclesRate > 0) {
          acc.bgMuscles += rates.bgToMusclesRate * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (acc.bgMuscles >= 1) {
            updated.push(spawnParticle('bg-muscles', 0));
            acc.bgMuscles -= 1;
          }
        }

        if (rates.bgToKidneysRate > 0) {
          acc.bgKidneys += rates.bgToKidneysRate * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (acc.bgKidneys >= 1) {
            updated.push(spawnParticle('bg-kidneys', 0));
            acc.bgKidneys -= 1;
          }
        }

        // Update particles
        updated = updated.map(p => {
          if (p.isAbsorbing) {
            const newProgress = p.progress + deltaSeconds / 0.25;
            if (newProgress >= 1) {
              return { ...p, progress: 2 }; // Mark for removal
            }
            return { ...p, progress: newProgress };
          }

          const newProgress = p.progress + progressPerSecond * deltaSeconds;

          if (newProgress >= 1) {
            return {
              ...p,
              progress: 0,
              isAbsorbing: true,
              x: p.targetX,
              y: p.targetY,
            };
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
        updated = updated.filter(p => !(p.isAbsorbing && p.progress >= 1));

        // Limit particles
        if (updated.length > 400) {
          updated = updated.slice(-400);
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
          className={`glucose-particles__particle ${
            p.isAbsorbing ? 'glucose-particles__particle--absorbing' : ''
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
        />
      ))}
    </div>
  );
}
