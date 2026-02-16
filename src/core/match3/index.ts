// Match-3 engine public API
export type {
  SimpleTileShape,
  SimpleTile,
  FoodTile,
  Tile,
  Board,
  Position,
  MatchResult,
  TileMovement,
  GravityResult,
  RefillResult,
  CascadeStep,
  SwapResult,
  InitialFoodTile,
  Match3Config,
} from './types';

export { ALL_SHAPES, isSimpleTile, isFoodTile, cloneBoard } from './types';
export { findMatches, removeMatches } from './matchDetector';
export { applyGravity } from './gravityResolver';
export { isAdjacent, isValidSwap } from './swapValidator';
export { generateBoard } from './boardGenerator';
export { refillBoard } from './boardRefiller';
export { executeSwap, hasValidMoves } from './engine';
