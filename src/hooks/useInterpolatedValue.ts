import { useState, useEffect, useRef } from 'react';

interface InterpolatedValues {
  liver: number;
  bg: number;
  muscleRate: number;
  liverRate: number;
}

interface UseInterpolationOptions {
  targetLiver: number;
  targetBG: number;
  targetMuscleRate: number;
  targetLiverRate: number;
  duration: number; // ms to interpolate over
  isPaused: boolean;
}

export function useInterpolatedValues({
  targetLiver,
  targetBG,
  targetMuscleRate,
  targetLiverRate,
  duration,
  isPaused,
}: UseInterpolationOptions): InterpolatedValues {
  const [values, setValues] = useState<InterpolatedValues>({
    liver: targetLiver,
    bg: targetBG,
    muscleRate: targetMuscleRate,
    liverRate: targetLiverRate,
  });

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValuesRef = useRef<InterpolatedValues>(values);

  useEffect(() => {
    if (isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Start interpolation
    startTimeRef.current = performance.now();
    startValuesRef.current = { ...values };

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const start = startValuesRef.current;

      setValues({
        liver: start.liver + (targetLiver - start.liver) * eased,
        bg: start.bg + (targetBG - start.bg) * eased,
        muscleRate: start.muscleRate + (targetMuscleRate - start.muscleRate) * eased,
        liverRate: start.liverRate + (targetLiverRate - start.liverRate) * eased,
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetLiver, targetBG, targetMuscleRate, targetLiverRate, duration, isPaused]);

  return values;
}
