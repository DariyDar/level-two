import { useEffect, useState, useRef } from 'react';
import './FlowParticles.css';

interface Particle {
  id: number;
  progress: number; // 0-1
}

interface FlowParticlesProps {
  flowType: 'ship-liver' | 'liver-bg' | 'bg-muscles';
  rate: number;
  isActive: boolean;
  speed?: number; // Simulation speed multiplier
}

// Calculate particle position based on flow type and progress
function getParticleStyle(flowType: string, progress: number): React.CSSProperties {
  const opacity = 0.95 - progress * 0.3;
  const scale = 1 - progress * 0.15;

  const baseStyle: React.CSSProperties = {
    opacity,
    transform: `scale(${scale})`,
  };

  switch (flowType) {
    case 'ship-liver':
      // From ship queue area (right) toward liver
      return {
        ...baseStyle,
        right: `${(1 - progress) * 40}px`,
        top: `${progress * 60}px`,
      };
    case 'liver-bg':
      // From liver down to BG (center)
      return {
        ...baseStyle,
        right: `${(1 - progress) * 30}px`,
        top: `${progress * 80}px`,
      };
    case 'bg-muscles':
      // From BG (center) to muscles
      return {
        ...baseStyle,
        left: `${(1 - progress) * 30}px`,
        bottom: `${progress * 60}px`,
      };
    default:
      return baseStyle;
  }
}

export function FlowParticles({ flowType, rate, isActive, speed = 1 }: FlowParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || rate <= 0) {
      setParticles([]);
      return;
    }

    // Spawn particles based on rate - higher rate = more particles
    const baseInterval = Math.max(200, 1000 / Math.ceil(rate / 5));
    const spawnInterval = baseInterval / Math.max(0.25, speed);

    const spawnParticle = () => {
      const newParticle: Particle = {
        id: nextIdRef.current++,
        progress: 0,
      };
      setParticles(prev => [...prev, newParticle]);
    };

    // Initial spawn
    spawnParticle();

    const spawner = setInterval(spawnParticle, spawnInterval);

    // Animation loop with speed-dependent progress
    // Base progress per frame, adjusted by speed
    const baseProgressPerSecond = 0.8; // Complete in ~1.25s at 1x

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Progress increment based on time and speed
      const progressIncrement = (deltaTime / 1000) * baseProgressPerSecond * speed;

      setParticles(prev => {
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + progressIncrement }))
          .filter(p => p.progress <= 1);
        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(spawner);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, rate, speed]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className={`flow-particles flow-particles--${flowType}`}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="flow-particles__particle"
          style={getParticleStyle(flowType, particle.progress)}
        />
      ))}
    </div>
  );
}
