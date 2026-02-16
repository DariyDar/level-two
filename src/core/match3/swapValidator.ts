import type { Board, Position } from './types';
import { isSimpleTile } from './types';
import { findMatches } from './matchDetector';

/**
 * Check if two positions are adjacent (horizontally or vertically).
 */
export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const dr = Math.abs(pos1.row - pos2.row);
  const dc = Math.abs(pos1.col - pos2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/**
 * Check if a swap between two positions would produce at least one match.
 * Rules:
 * - Positions must be adjacent
 * - At least one tile must be SimpleTile (food↔food swap not allowed)
 * - After swapping, at least one match of 3+ simple tiles must exist
 */
export function isValidSwap(board: Board, pos1: Position, pos2: Position): boolean {
  if (!isAdjacent(pos1, pos2)) return false;

  const rows = board.length;
  if (rows === 0) return false;
  const cols = board[0].length;

  // Bounds check
  if (pos1.row < 0 || pos1.row >= rows || pos1.col < 0 || pos1.col >= cols) return false;
  if (pos2.row < 0 || pos2.row >= rows || pos2.col < 0 || pos2.col >= cols) return false;

  const tile1 = board[pos1.row][pos1.col];
  const tile2 = board[pos2.row][pos2.col];

  // Both must exist
  if (!tile1 || !tile2) return false;

  // At least one must be a simple tile
  if (!isSimpleTile(tile1) && !isSimpleTile(tile2)) return false;

  // If both simple, same shape swap is pointless
  if (isSimpleTile(tile1) && isSimpleTile(tile2) && tile1.shape === tile2.shape) return false;

  // Try the swap on a copy
  const testBoard = board.map(row => [...row]);
  testBoard[pos1.row][pos1.col] = tile2;
  testBoard[pos2.row][pos2.col] = tile1;

  const matches = findMatches(testBoard);
  return matches.length > 0;
}
