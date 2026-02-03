import { useState, useEffect, useRef } from 'react';

interface InterpolatedValues {
  liver: number;
  bg: number;
  muscleRate: number;
  liverRate: number;
  dissolveProgress: number;
}

interface UseInterpolationOptions {
  targetLiver: number;
  targetBG: number;
  targetMuscleRate: number;
  targetLiverRate: number;
  targetDissolveProgress: number;
  duration: number; // ms to interpolate over
  isPaused: boolean;
}

export function useInterpolatedValues({
  targetLiver,
  targetBG,
  targetMuscleRate,
  targetLiverRate,
  targetDissolveProgress,
  duration,
  isPaused,
}: UseInterpolationOptions): InterpolatedValues {
  const [values, setValues] = useState<InterpolatedValues>({
    liver: targetLiver,
    bg: targetBG,
    muscleRate: targetMuscleRate,
    liverRate: targetLiverRate,
    dissolveProgress: targetDissolveProgress,
  });

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValuesRef = useRef<Omit<InterpolatedValues, 'dissolveProgress'>>({
    liver: targetLiver,
    bg: targetBG,
    muscleRate: targetMuscleRate,
    liverRate: targetLiverRate,
  });

  // Track dissolve separately - it needs to grow linearly
  const dissolveStartRef = useRef<number>(targetDissolveProgress);
  const prevTargetDissolveRef = useRef<number>(targetDissolveProgress);

  useEffect(() => {
    if (isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Detect if dissolve target reset (new ship started)
    const dissolveReset = targetDissolveProgress < prevTargetDissolveRef.current - 0.1;
    prevTargetDissolveRef.current = targetDissolveProgress;

    // Start interpolation
    startTimeRef.current = performance.now();
    startValuesRef.current = {
      liver: values.liver,
      bg: values.bg,
      muscleRate: values.muscleRate,
      liverRate: values.liverRate,
    };

    // For dissolve: if reset, start from 0; otherwise continue from current
    dissolveStartRef.current = dissolveReset ? 0 : values.dissolveProgress;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic for regular values
      const eased = 1 - Math.pow(1 - progress, 3);

      // Linear for dissolve (sand-timer effect)
      const linearProgress = progress;

      const start = startValuesRef.current;
      const dissolveStart = dissolveStartRef.current;

      setValues({
        liver: start.liver + (targetLiver - start.liver) * eased,
        bg: start.bg + (targetBG - start.bg) * eased,
        muscleRate: start.muscleRate + (targetMuscleRate - start.muscleRate) * eased,
        liverRate: start.liverRate + (targetLiverRate - start.liverRate) * eased,
        // Dissolve: linear interpolation from start to target
        dissolveProgress: dissolveStart + (targetDissolveProgress - dissolveStart) * linearProgress,
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
  }, [targetLiver, targetBG, targetMuscleRate, targetLiverRate, targetDissolveProgress, duration, isPaused]);

  return values;
}
