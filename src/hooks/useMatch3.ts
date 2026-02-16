import { useState, useCallback, useRef } from 'react';
import type { Ship } from '../core/types';
import type { Board, Position, FoodTile, Match3Config, CascadeStep } from '../core/match3';
import { generateBoard, executeSwap, hasValidMoves } from '../core/match3';

// Animation timing (ms)
const MATCH_DURATION = 300;
const GRAVITY_DURATION = 250;
const REFILL_DURATION = 200;
const FOOD_DROP_DURATION = 300;
const CASCADE_PAUSE = 100;

export type AnimationPhase = 'idle' | 'swapping' | 'matching' | 'gravity' | 'refilling' | 'food-drop';

export interface Match3State {
  board: Board;
  movesRemaining: number;
  moveBudget: number;
  selectedPosition: Position | null;
  isAnimating: boolean;
  animationPhase: AnimationPhase;
  matchingPositions: Set<string>;       // "row,col" keys of currently matching tiles
  droppedFoodTiles: FoodTile[];         // Accumulated food tiles for inventory
  isOutOfMoves: boolean;
  noValidMoves: boolean;                // Board is deadlocked
  pendingCascadeSteps: CascadeStep[];   // For animation sequencing
  currentCascadeIndex: number;
}

export interface UseMatch3Return extends Match3State {
  selectPosition: (pos: Position | null) => void;
  attemptSwap: (pos1: Position, pos2: Position) => void;
  resetBoard: () => void;
}

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function useMatch3(
  config: Match3Config | null,
  _allShips: Ship[],
  availableFoodShipIds: string[],
  moveBudget: number,
): UseMatch3Return {
  const [board, setBoard] = useState<Board>([]);
  const [movesRemaining, setMovesRemaining] = useState(moveBudget);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [matchingPositions, setMatchingPositions] = useState<Set<string>>(new Set());
  const [droppedFoodTiles, setDroppedFoodTiles] = useState<FoodTile[]>([]);
  const [noValidMoves, setNoValidMoves] = useState(false);
  const [pendingCascadeSteps, setPendingCascadeSteps] = useState<CascadeStep[]>([]);
  const [currentCascadeIndex, setCurrentCascadeIndex] = useState(0);

  const isInitialized = useRef(false);
  const animatingRef = useRef(false);

  // Initialize board on first render or config change
  if (config && !isInitialized.current) {
    const newBoard = generateBoard(config, availableFoodShipIds);
    setBoard(newBoard);
    setMovesRemaining(moveBudget);
    setDroppedFoodTiles([]);
    setNoValidMoves(!hasValidMoves(newBoard));
    isInitialized.current = true;
  }

  const selectPosition = useCallback((pos: Position | null) => {
    if (animatingRef.current) return;
    setSelectedPosition(pos);
  }, []);

  const animateCascadeSteps = useCallback((
    steps: CascadeStep[],
    finalBoard: Board,
    allDroppedFood: FoodTile[],
  ) => {
    if (steps.length === 0) {
      setIsAnimating(false);
      animatingRef.current = false;
      setAnimationPhase('idle');
      setBoard(finalBoard);
      setNoValidMoves(!hasValidMoves(finalBoard));
      if (allDroppedFood.length > 0) {
        setDroppedFoodTiles(prev => [...prev, ...allDroppedFood]);
      }
      return;
    }

    let stepIndex = 0;

    const runStep = () => {
      if (stepIndex >= steps.length) {
        // All cascade steps done
        setAnimationPhase('idle');
        setMatchingPositions(new Set());
        setBoard(finalBoard);
        setIsAnimating(false);
        animatingRef.current = false;
        setNoValidMoves(!hasValidMoves(finalBoard));
        if (allDroppedFood.length > 0) {
          setDroppedFoodTiles(prev => [...prev, ...allDroppedFood]);
        }
        return;
      }

      const step = steps[stepIndex];
      setPendingCascadeSteps(steps);
      setCurrentCascadeIndex(stepIndex);

      // Phase 1: Show matching tiles
      const matchKeys = new Set<string>();
      for (const match of step.matches) {
        for (const pos of match.positions) {
          matchKeys.add(posKey(pos.row, pos.col));
        }
      }
      setAnimationPhase('matching');
      setMatchingPositions(matchKeys);

      setTimeout(() => {
        // Phase 2: Gravity
        setAnimationPhase('gravity');
        setMatchingPositions(new Set());

        setTimeout(() => {
          // Phase 3: Food drop (if any food tiles fell)
          if (step.droppedFoodTiles.length > 0) {
            setAnimationPhase('food-drop');
            setTimeout(() => {
              // Phase 4: Refill
              setAnimationPhase('refilling');
              setTimeout(() => {
                stepIndex++;
                if (stepIndex < steps.length) {
                  setTimeout(runStep, CASCADE_PAUSE);
                } else {
                  runStep(); // Will hit the "all done" branch
                }
              }, REFILL_DURATION);
            }, FOOD_DROP_DURATION);
          } else {
            // No food dropped, skip to refill
            setAnimationPhase('refilling');
            setTimeout(() => {
              stepIndex++;
              if (stepIndex < steps.length) {
                setTimeout(runStep, CASCADE_PAUSE);
              } else {
                runStep();
              }
            }, REFILL_DURATION);
          }
        }, GRAVITY_DURATION);
      }, MATCH_DURATION);
    };

    runStep();
  }, []);

  const attemptSwap = useCallback((pos1: Position, pos2: Position) => {
    if (animatingRef.current || !config) return;
    if (movesRemaining <= 0) return;

    const result = executeSwap(board, pos1, pos2, config, availableFoodShipIds);

    if (!result.valid) {
      // Invalid swap — brief shake animation could go here
      setSelectedPosition(null);
      return;
    }

    // Valid swap — start animation
    setIsAnimating(true);
    animatingRef.current = true;
    setSelectedPosition(null);
    setMovesRemaining(prev => prev - 1);

    // Animate cascade steps, then apply final board
    animateCascadeSteps(
      result.cascadeSteps,
      result.board,
      result.droppedFoodTiles,
    );
  }, [board, config, movesRemaining, availableFoodShipIds, animateCascadeSteps]);

  const resetBoard = useCallback(() => {
    if (!config) return;
    const newBoard = generateBoard(config, availableFoodShipIds);
    setBoard(newBoard);
    setMovesRemaining(moveBudget);
    setSelectedPosition(null);
    setDroppedFoodTiles([]);
    setIsAnimating(false);
    animatingRef.current = false;
    setAnimationPhase('idle');
    setMatchingPositions(new Set());
    setNoValidMoves(!hasValidMoves(newBoard));
    isInitialized.current = true;
  }, [config, availableFoodShipIds, moveBudget]);

  const isOutOfMoves = movesRemaining <= 0;

  return {
    board,
    movesRemaining,
    moveBudget,
    selectedPosition,
    isAnimating,
    animationPhase,
    matchingPositions,
    droppedFoodTiles,
    isOutOfMoves,
    noValidMoves,
    pendingCascadeSteps,
    currentCascadeIndex,
    selectPosition,
    attemptSwap,
    resetBoard,
  };
}
