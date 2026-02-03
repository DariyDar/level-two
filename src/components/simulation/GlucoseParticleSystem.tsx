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
}

// Visual multiplier for more particles (aesthetic)
const VISUAL_MULTIPLIER = 3;

// Container positions (relative to .simulation-phase__main, percentages)
// Layout: BodyDiagram (top ~55%) + ShipQueue (bottom ~45%)
// BodyDiagram internal layout:
// - Row 1 (~15%): Muscles(left) - BG(center) - Kidneys(right)
// - Row 2 (~40%): Liver (center)
// ShipQueue:
// - Ships start around 70-95% of total height
const POSITIONS: Record<Container, { x: number; y: number }> = {
  ship: { x: 50, y: 85 },      // ShipQueue area - where ships are
  liver: { x: 50, y: 42 },     // Liver in BodyDiagram
  bg: { x: 50, y: 18 },        // Blood Glucose bar
  muscles: { x: 22, y: 18 },   // Muscles (left)
  kidneys: { x: 78, y: 18 },   // Kidneys (right)
};

// Get position along path between two containers
function getPathPosition(from: Container, to: Container, progress: number): { x: number; y: number } {
  const fromPos = POSITIONS[from];
  const toPos = POSITIONS[to];

  const x = fromPos.x + (toPos.x - fromPos.x) * progress;
  const y = fromPos.y + (toPos.y - fromPos.y) * progress;

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

  const spawnParticle = useCallback((from: Container, to: Container): Particle => {
    const pos = POSITIONS[from];
    return {
      id: nextIdRef.current++,
      from,
      to,
      progress: 0,
      isAbsorbing: false,
      x: pos.x + (Math.random() - 0.5) * 8,
      y: pos.y + (Math.random() - 0.5) * 4,
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
      // Particles complete path in ~4s at 1x speed
      const progressPerSecond = 0.25 * speed;

      setParticles(prev => {
        let updated = [...prev];

        // === SPAWN NEW PARTICLES (4 independent flows) ===

        // Flow 1: Ship → Liver
        if (shipUnloading > 0) {
          shipToLiverAccum.current += shipUnloading * deltaSeconds * speed * VISUAL_MULTIPLIER;
          while (shipToLiverAccum.current >= 1) {
            updated.push(spawnParticle('ship', 'liver'));
            shipToLiverAccum.current -= 1;
          }
        }

        // Flow 2: Liver → BG
        if (liverToBgRate > 0) {
          liverToBgAccum.current += liverToBgRate * deltaSeconds * speed * VISUAL_MULTIPLIER;
          while (liverToBgAccum.current >= 1) {
            updated.push(spawnParticle('liver', 'bg'));
            liverToBgAccum.current -= 1;
          }
        }

        // Flow 3: BG → Muscles
        if (bgToMusclesRate > 0) {
          bgToMusclesAccum.current += bgToMusclesRate * deltaSeconds * speed * VISUAL_MULTIPLIER;
          while (bgToMusclesAccum.current >= 1) {
            updated.push(spawnParticle('bg', 'muscles'));
            bgToMusclesAccum.current -= 1;
          }
        }

        // Flow 4: BG → Kidneys
        if (bgToKidneysRate > 0) {
          bgToKidneysAccum.current += bgToKidneysRate * deltaSeconds * speed * VISUAL_MULTIPLIER;
          while (bgToKidneysAccum.current >= 1) {
            updated.push(spawnParticle('bg', 'kidneys'));
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
          const basePos = getPathPosition(p.from, p.to, newProgress);
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

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shipUnloading, liverToBgRate, bgToMusclesRate, bgToKidneysRate, speed, isPaused, spawnParticle]);

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
