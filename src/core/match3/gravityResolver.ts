import type { Board, GravityResult, FoodTile, TileMovement } from './types';
import { isFoodTile } from './types';

/**
 * Apply gravity: tiles fall down to fill gaps.
 * Food tiles that reach the bottom row (row = rows-1) are collected and removed.
 * Repeats until no food tiles sit on the bottom row.
 */
export function applyGravity(board: Board): GravityResult {
  const rows = board.length;
  if (rows === 0) return { newBoard: board, droppedFoodTiles: [], movements: [] };
  const cols = board[0].length;

  let currentBoard = board.map(row => [...row]);
  const allMovements: TileMovement[] = [];
  const allDroppedFood: FoodTile[] = [];

  let hasBottomFood = true;
  while (hasBottomFood) {
    // Step 1: Apply column-wise gravity
    for (let c = 0; c < cols; c++) {
      // Collect non-null tiles from bottom to top
      const tiles: { tile: typeof currentBoard[0][0]; origRow: number }[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        if (currentBoard[r][c] !== null) {
          tiles.push({ tile: currentBoard[r][c], origRow: r });
        }
      }

      // Place tiles from bottom up
      let writeRow = rows - 1;
      for (const entry of tiles) {
        if (entry.origRow !== writeRow && entry.tile !== null) {
          allMovements.push({
            from: { row: entry.origRow, col: c },
            to: { row: writeRow, col: c },
            tile: entry.tile,
          });
        }
        currentBoard[writeRow][c] = entry.tile;
        writeRow--;
      }
      // Fill remaining top rows with null
      for (let r = writeRow; r >= 0; r--) {
        currentBoard[r][c] = null;
      }
    }

    // Step 2: Check for food tiles on the bottom row
    hasBottomFood = false;
    for (let c = 0; c < cols; c++) {
      const tile = currentBoard[rows - 1][c];
      if (isFoodTile(tile)) {
        allDroppedFood.push(tile);
        allMovements.push({
          from: { row: rows - 1, col: c },
          to: { row: rows, col: c }, // row = rows means "fell off bottom"
          tile,
        });
        currentBoard[rows - 1][c] = null;
        hasBottomFood = true;
      }
    }
    // If food was removed, loop again to apply gravity for newly created gaps
  }

  return {
    newBoard: currentBoard,
    droppedFoodTiles: allDroppedFood,
    movements: allMovements,
  };
}
