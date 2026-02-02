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
}

// Calculate particle position based on flow type and progress
function getParticleStyle(flowType: string, progress: number): React.CSSProperties {
  const opacity = 0.9 - progress * 0.4;
  const scale = 1 - progress * 0.2;

  const baseStyle: React.CSSProperties = {
    opacity,
    transform: `scale(${scale})`,
  };

  switch (flowType) {
    case 'ship-liver':
      return {
        ...baseStyle,
        right: `${(1 - progress) * 30}px`,
        top: `${progress * 50}px`,
      };
    case 'liver-bg':
      return {
        ...baseStyle,
        right: `${(1 - progress) * 40}px`,
        top: `${progress * 70}px`,
      };
    case 'bg-muscles':
      return {
        ...baseStyle,
        left: `${(1 - progress) * 40}px`,
        bottom: `${progress * 70}px`,
      };
    default:
      return baseStyle;
  }
}

export function FlowParticles({ flowType, rate, isActive }: FlowParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || rate <= 0) {
      setParticles([]);
      return;
    }

    // Spawn particles based on rate
    const spawnInterval = Math.max(300, 1200 / Math.ceil(rate / 10));

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

    // Animation loop
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + 0.025 }))
          .filter(p => p.progress <= 1);
        return updated;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(spawner);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, rate]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className={`flow-particles flow-particles--${flowType}`}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`flow-particles__particle flow-particles__particle--${flowType}`}
          style={getParticleStyle(flowType, particle.progress)}
        />
      ))}
    </div>
  );
}
