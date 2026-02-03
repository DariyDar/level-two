import { useEffect, useRef, useState, useCallback } from 'react';
import './GlucoseParticleSystem.css';

// Container types for particle flow
type Container = 'ship' | 'liver' | 'bg' | 'muscles' | 'kidneys';

interface Particle {
  id: number;
  from: Container;
  to: Container;
  progress: number; // 0-1, where 1 = reached destination
  isAbsorbing: boolean; // true when playing absorption animation
  x: number;
  y: number;
  // Starting position (needed for ship particles that spawn at dissolve edge)
  startX: number;
  startY: number;
  // Drift parameters for organic movement
  driftPhase: number;
  driftAmplitude: number;
  driftFrequency: number;
}

interface GlucoseParticleSystemProps {
  // Flow rates (glucose per hour)
  shipUnloading: number; // Ship → Liver
  liverToBgRate: number; // Liver → BG
  bgToMusclesRate: number; // BG → Muscles
  bgToKidneysRate: number; // BG → Kidneys
  // Speed multiplier
  speed: number;
  isPaused: boolean;
  // Dissolve progress for ship (0-1) - particles spawn from dissolve edge
  dissolveProgress: number;
}

// Visual multiplier for more particles (aesthetic)
const VISUAL_MULTIPLIER = 3;

// Container positions (relative to .simulation-phase__main, percentages)
// Based on screenshot measurements:
// - BodyDiagram takes ~60% of height (with Liver at bottom ~55%)
// - ShipQueue starts at ~62% with first row at ~65%
// - Gap between them ~2%
const POSITIONS: Record<Container, { x: number; y: number }> = {
  // Ship position is dynamic - see getShipSpawnPosition()
  ship: { x: 50, y: 65 },      // First row in ShipQueue
  liver: { x: 50, y: 52 },     // Liver container (bottom of BodyDiagram)
  bg: { x: 50, y: 22 },        // Blood Glucose bar (top center of BodyDiagram)
  muscles: { x: 28, y: 22 },   // Muscles (left of BG)
  kidneys: { x: 72, y: 22 },   // Kidneys (right of BG)
};

// Ship spawn area bounds (ShipQueue first row)
const SHIP_SPAWN = {
  xMin: 12,   // Left edge of ship grid
  xMax: 88,   // Right edge of ship grid
  y: 65,      // Y position (first row in ShipQueue)
};

// Get spawn position for ship particles based on dissolve progress
function getShipSpawnPosition(dissolveProgress: number): { x: number; y: number } {
  // Dissolve goes left-to-right, so particles spawn at the dissolve edge
  const dissolveX = SHIP_SPAWN.xMin + (SHIP_SPAWN.xMax - SHIP_SPAWN.xMin) * dissolveProgress;
  return {
    x: dissolveX + (Math.random() - 0.5) * 10,
    y: SHIP_SPAWN.y + (Math.random() - 0.5) * 4,
  };
}

// Get position along path from start to destination
function getPathPosition(
  startX: number,
  startY: number,
  to: Container,
  progress: number
): { x: number; y: number } {
  const toPos = POSITIONS[to];

  const x = startX + (toPos.x - startX) * progress;
  const y = startY + (toPos.y - startY) * progress;

  return { x, y };
}

// Apply organic drift to position
function applyDrift(
  baseX: number,
  baseY: number,
  progress: number,
  driftPhase: number,
  driftAmplitude: number,
  driftFrequency: number,
  time: number
): { x: number; y: number } {
  // Combine progress-based sine wave with time-based movement
  const waveOffset = Math.sin(progress * Math.PI * driftFrequency + driftPhase + time * 0.001) * driftAmplitude;

  // Perpendicular drift (mostly sideways)
  const perpX = waveOffset;
  const perpY = Math.sin(progress * Math.PI * 2 + driftPhase * 1.5 + time * 0.0005) * driftAmplitude * 0.3;

  return {
    x: baseX + perpX,
    y: baseY + perpY,
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

  // Accumulator refs for spawning (since rates can be fractional per frame)
  const shipToLiverAccum = useRef(0);
  const liverToBgAccum = useRef(0);
  const bgToMusclesAccum = useRef(0);
  const bgToKidneysAccum = useRef(0);

  // Store rates in refs to avoid useEffect restarts
  const ratesRef = useRef({
    shipUnloading,
    liverToBgRate,
    bgToMusclesRate,
    bgToKidneysRate,
    speed,
    dissolveProgress,
  });

  // Update refs when props change (without restarting animation)
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

  const spawnParticle = useCallback((from: Container, to: Container, currentDissolve: number): Particle => {
    // For ship particles, spawn from dissolve edge
    const pos = from === 'ship'
      ? getShipSpawnPosition(currentDissolve)
      : {
          x: POSITIONS[from].x + (Math.random() - 0.5) * 8,
          y: POSITIONS[from].y + (Math.random() - 0.5) * 4,
        };

    return {
      id: nextIdRef.current++,
      from,
      to,
      progress: 0,
      isAbsorbing: false,
      x: pos.x,
      y: pos.y,
      startX: pos.x,
      startY: pos.y,
      // Random drift parameters for organic movement
      driftPhase: Math.random() * Math.PI * 2,
      driftAmplitude: 2 + Math.random() * 4, // 2-6% drift
      driftFrequency: 1 + Math.random() * 2, // 1-3 waves per path
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

      const deltaTime = Math.min(timestamp - lastTimeRef.current, 100); // Cap delta
      lastTimeRef.current = timestamp;
      globalTimeRef.current = timestamp;

      const deltaSeconds = deltaTime / 1000;

      // Read current rates from ref (updated without restarting animation)
      const rates = ratesRef.current;

      // Particles complete path in ~4s at 1x speed
      const progressPerSecond = 0.25 * rates.speed;

      setParticles(prev => {
        let updated = [...prev];

        // === SPAWN NEW PARTICLES (4 independent flows) ===

        // Flow 1: Ship → Liver (spawn from dissolve edge)
        if (rates.shipUnloading > 0) {
          shipToLiverAccum.current += rates.shipUnloading * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (shipToLiverAccum.current >= 1) {
            updated.push(spawnParticle('ship', 'liver', rates.dissolveProgress));
            shipToLiverAccum.current -= 1;
          }
        }

        // Flow 2: Liver → BG
        if (rates.liverToBgRate > 0) {
          liverToBgAccum.current += rates.liverToBgRate * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (liverToBgAccum.current >= 1) {
            updated.push(spawnParticle('liver', 'bg', 0));
            liverToBgAccum.current -= 1;
          }
        }

        // Flow 3: BG → Muscles
        if (rates.bgToMusclesRate > 0) {
          bgToMusclesAccum.current += rates.bgToMusclesRate * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (bgToMusclesAccum.current >= 1) {
            updated.push(spawnParticle('bg', 'muscles', 0));
            bgToMusclesAccum.current -= 1;
          }
        }

        // Flow 4: BG → Kidneys
        if (rates.bgToKidneysRate > 0) {
          bgToKidneysAccum.current += rates.bgToKidneysRate * deltaSeconds * rates.speed * VISUAL_MULTIPLIER;
          while (bgToKidneysAccum.current >= 1) {
            updated.push(spawnParticle('bg', 'kidneys', 0));
            bgToKidneysAccum.current -= 1;
          }
        }

        // === UPDATE PARTICLES ===
        updated = updated.map(p => {
          // If absorbing, let CSS animation handle it, then remove
          if (p.isAbsorbing) {
            // Absorption animation lasts 0.3s
            const newProgress = p.progress + deltaSeconds / 0.3;
            if (newProgress >= 1) {
              return { ...p, progress: 2 }; // Mark for removal
            }
            return { ...p, progress: newProgress };
          }

          const newProgress = p.progress + progressPerSecond * deltaSeconds;

          // Reached destination - start absorption
          if (newProgress >= 1) {
            const destPos = POSITIONS[p.to];
            return {
              ...p,
              progress: 0,
              isAbsorbing: true,
              x: destPos.x,
              y: destPos.y,
            };
          }

          // Update position with organic drift
          const basePos = getPathPosition(p.startX, p.startY, p.to, newProgress);
          const driftedPos = applyDrift(
            basePos.x,
            basePos.y,
            newProgress,
            p.driftPhase,
            p.driftAmplitude,
            p.driftFrequency,
            globalTimeRef.current
          );

          return {
            ...p,
            progress: newProgress,
            x: driftedPos.x,
            y: driftedPos.y,
          };
        });

        // Remove finished particles (absorption complete)
        updated = updated.filter(p => !(p.isAbsorbing && p.progress >= 1));

        // Limit total particles
        if (updated.length > 500) {
          updated = updated.slice(-500);
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Only reset time when starting/resuming animation
    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, spawnParticle]); // Only restart on pause/resume

  return (
    <div className="glucose-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className={`glucose-particles__particle ${p.isAbsorbing ? 'glucose-particles__particle--absorbing' : ''}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
        />
      ))}
    </div>
  );
}
