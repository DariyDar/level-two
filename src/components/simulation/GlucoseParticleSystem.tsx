import { useEffect, useRef, useState, useCallback } from 'react';
import './GlucoseParticleSystem.css';

// Particle locations (visual containers)
type VisualLocation = 'ship' | 'liver' | 'bg' | 'muscles' | 'kidneys';
type ParticleLocation = VisualLocation | 'done';

interface Particle {
  id: number;
  location: ParticleLocation;
  destination?: 'muscles' | 'kidneys'; // For BG particles
  progress: number; // 0-1 progress within current path
  x: number;
  y: number;
}

interface GlucoseParticleSystemProps {
  // Flow rates (glucose per hour)
  shipUnloading: number; // Glucose being unloaded from ship
  liverToBgRate: number;
  bgToMusclesRate: number;
  bgToKidneysRate: number;
  // Speed multiplier
  speed: number;
  isPaused: boolean;
}

// Container positions (relative to parent, percentages)
const POSITIONS: Record<VisualLocation, { x: number; y: number }> = {
  ship: { x: 50, y: 95 },      // Bottom center (port)
  liver: { x: 50, y: 75 },     // Above port
  bg: { x: 50, y: 50 },        // Center
  muscles: { x: 20, y: 50 },   // Left of BG
  kidneys: { x: 80, y: 50 },   // Right of BG
};

// Interpolate position along path
function getPosition(from: VisualLocation, to: VisualLocation, progress: number): { x: number; y: number } {
  const fromPos = POSITIONS[from];
  const toPos = POSITIONS[to];

  // Add some curve/randomness to path
  const midX = (fromPos.x + toPos.x) / 2 + (Math.random() - 0.5) * 5;
  const midY = (fromPos.y + toPos.y) / 2;

  // Quadratic bezier
  const t = progress;
  const x = (1 - t) * (1 - t) * fromPos.x + 2 * (1 - t) * t * midX + t * t * toPos.x;
  const y = (1 - t) * (1 - t) * fromPos.y + 2 * (1 - t) * t * midY + t * t * toPos.y;

  return { x, y };
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

  // Accumulator refs for spawning (since rates can be fractional per frame)
  const shipSpawnAccum = useRef(0);
  const liverSpawnAccum = useRef(0);
  const muscleSpawnAccum = useRef(0);
  const kidneySpawnAccum = useRef(0);

  const spawnParticle = useCallback((location: VisualLocation, destination?: 'muscles' | 'kidneys'): Particle => {
    const pos = POSITIONS[location];
    return {
      id: nextIdRef.current++,
      location,
      destination,
      progress: 0,
      x: pos.x + (Math.random() - 0.5) * 4,
      y: pos.y + (Math.random() - 0.5) * 4,
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

      const deltaSeconds = deltaTime / 1000;
      const progressPerSecond = 1.5 * speed; // Particles complete path in ~0.67s at 1x

      setParticles(prev => {
        let updated = [...prev];

        // Spawn new particles from ship (1 particle per gram)
        if (shipUnloading > 0) {
          shipSpawnAccum.current += shipUnloading * deltaSeconds * speed * 0.5;
          while (shipSpawnAccum.current >= 1) {
            updated.push(spawnParticle('ship'));
            shipSpawnAccum.current -= 1;
          }
        }

        // Spawn particles from liver to BG
        if (liverToBgRate > 0) {
          liverSpawnAccum.current += liverToBgRate * deltaSeconds * speed * 0.3;
          while (liverSpawnAccum.current >= 1) {
            updated.push(spawnParticle('liver'));
            liverSpawnAccum.current -= 1;
          }
        }

        // Spawn particles from BG to muscles
        if (bgToMusclesRate > 0) {
          muscleSpawnAccum.current += bgToMusclesRate * deltaSeconds * speed * 0.3;
          while (muscleSpawnAccum.current >= 1) {
            updated.push(spawnParticle('bg', 'muscles'));
            muscleSpawnAccum.current -= 1;
          }
        }

        // Spawn particles from BG to kidneys
        if (bgToKidneysRate > 0) {
          kidneySpawnAccum.current += bgToKidneysRate * deltaSeconds * speed * 0.3;
          while (kidneySpawnAccum.current >= 1) {
            updated.push(spawnParticle('bg', 'kidneys'));
            kidneySpawnAccum.current -= 1;
          }
        }

        // Update particle positions
        updated = updated.map(p => {
          if (p.location === 'done') return p;

          const newProgress = p.progress + progressPerSecond * deltaSeconds;

          if (newProgress >= 1) {
            // Move to next location
            if (p.location === 'ship') {
              return { ...p, location: 'liver' as ParticleLocation, progress: 0 };
            } else if (p.location === 'liver') {
              return { ...p, location: 'bg' as ParticleLocation, progress: 0 };
            } else if (p.location === 'bg') {
              if (p.destination === 'muscles') {
                return { ...p, location: 'muscles' as ParticleLocation, progress: 0 };
              } else if (p.destination === 'kidneys') {
                return { ...p, location: 'kidneys' as ParticleLocation, progress: 0 };
              }
              // Particle stays in BG (no destination yet)
              return { ...p, progress: 0 };
            } else if (p.location === 'muscles' || p.location === 'kidneys') {
              return { ...p, location: 'done' as ParticleLocation, progress: 1 };
            }
          }

          // Calculate new position
          let nextLoc: VisualLocation = p.location as VisualLocation;
          if (p.location === 'ship') nextLoc = 'liver';
          else if (p.location === 'liver') nextLoc = 'bg';
          else if (p.location === 'bg' && p.destination) {
            nextLoc = p.destination;
          }

          const pos = getPosition(p.location as VisualLocation, nextLoc, newProgress);

          return {
            ...p,
            progress: newProgress,
            x: pos.x,
            y: pos.y,
          };
        });

        // Remove finished particles
        updated = updated.filter(p => p.location !== 'done');

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
          className="glucose-particles__particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.location === 'done' ? 0 : 0.9,
          }}
        />
      ))}
    </div>
  );
}
