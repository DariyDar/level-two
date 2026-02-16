import type { Board, Position, Match3Config, SwapResult, CascadeStep, FoodTile } from './types';
import { isValidSwap } from './swapValidator';
import { findMatches, removeMatches } from './matchDetector';
import { applyGravity } from './gravityResolver';
import { refillBoard } from './boardRefiller';

const MAX_CASCADE_DEPTH = 10;

/**
 * Execute a swap and resolve all cascades.
 * Returns the final board state and all cascade steps for animation.
 *
 * Flow:
 * 1. Validate swap → reject if invalid
 * 2. Perform swap
 * 3. Cascade loop: findMatches → remove → gravity → collect food → refill → repeat
 * 4. Return final state + animation data
 */
export function executeSwap(
  board: Board,
  pos1: Position,
  pos2: Position,
  config: Match3Config,
  availableFoodShipIds: string[]
): SwapResult {
  // Validate
  if (!isValidSwap(board, pos1, pos2)) {
    return {
      valid: false,
      board,
      cascadeSteps: [],
      droppedFoodTiles: [],
    };
  }

  // Perform swap
  let currentBoard = board.map(row => [...row]);
  const temp = currentBoard[pos1.row][pos1.col];
  currentBoard[pos1.row][pos1.col] = currentBoard[pos2.row][pos2.col];
  currentBoard[pos2.row][pos2.col] = temp;

  const cascadeSteps: CascadeStep[] = [];
  const allDroppedFood: FoodTile[] = [];

  // Cascade loop
  for (let depth = 0; depth < MAX_CASCADE_DEPTH; depth++) {
    const matches = findMatches(currentBoard);
    if (matches.length === 0) break;

    // Remove matched tiles
    currentBoard = removeMatches(currentBoard, matches);

    // Apply gravity — tiles fall, food tiles at bottom collected
    const gravityResult = applyGravity(currentBoard);
    currentBoard = gravityResult.newBoard;

    // Refill empty cells from top
    const refillResult = refillBoard(currentBoard, config, availableFoodShipIds);
    currentBoard = refillResult.board;

    // Record cascade step
    const step: CascadeStep = {
      matches,
      movements: gravityResult.movements,
      droppedFoodTiles: gravityResult.droppedFoodTiles,
    };
    cascadeSteps.push(step);
    allDroppedFood.push(...gravityResult.droppedFoodTiles);
  }

  return {
    valid: true,
    board: currentBoard,
    cascadeSteps,
    droppedFoodTiles: allDroppedFood,
  };
}

/**
 * Check if the board has any valid moves available.
 * Scans all adjacent pairs for potential matches.
 */
export function hasValidMoves(board: Board): boolean {
  const rows = board.length;
  if (rows === 0) return false;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Check right neighbor
      if (c + 1 < cols && isValidSwap(board, { row: r, col: c }, { row: r, col: c + 1 })) {
        return true;
      }
      // Check bottom neighbor
      if (r + 1 < rows && isValidSwap(board, { row: r, col: c }, { row: r + 1, col: c })) {
        return true;
      }
    }
  }

  return false;
}
