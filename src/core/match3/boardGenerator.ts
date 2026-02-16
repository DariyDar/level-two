import type { Board, Match3Config, SimpleTile, FoodTile, SimpleTileShape } from './types';
import { ALL_SHAPES, isSimpleTile } from './types';

/**
 * Generate a Match-3 board with no pre-existing matches of 3+.
 * Food tiles are placed at specified initial positions (typically rows 0-1).
 * Remaining cells are filled with random simple tiles.
 */
export function generateBoard(config: Match3Config, availableFoodShipIds: string[]): Board {
  const { rows, columns, tileTypes, initialFoodTiles } = config;
  const shapes = ALL_SHAPES.slice(0, tileTypes);

  // Initialize empty board
  const board: Board = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => null)
  );

  // Place initial food tiles
  if (initialFoodTiles) {
    for (const ft of initialFoodTiles) {
      if (ft.row >= 0 && ft.row < rows && ft.col >= 0 && ft.col < columns) {
        const shipId = ft.shipId || randomItem(availableFoodShipIds);
        board[ft.row][ft.col] = { type: 'food', shipId } as FoodTile;
      }
    }
  }

  // Fill remaining cells with simple tiles (no initial matches)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      if (board[r][c] !== null) continue; // Skip food tiles

      // Pick a shape that doesn't create a 3-in-a-row
      const forbidden = getForbiddenShapes(board, r, c);
      const allowed = shapes.filter(s => !forbidden.has(s));

      // If all shapes forbidden (unlikely with 5 shapes), pick any
      const shape = allowed.length > 0 ? randomItem(allowed) : randomItem(shapes);
      board[r][c] = { type: 'simple', shape } as SimpleTile;
    }
  }

  return board;
}

/**
 * Determine which shapes would create a 3-in-a-row at position (r, c).
 * Checks the two preceding cells horizontally and vertically.
 */
function getForbiddenShapes(board: Board, r: number, c: number): Set<SimpleTileShape> {
  const forbidden = new Set<SimpleTileShape>();

  // Check horizontal: if board[r][c-1] and board[r][c-2] have the same shape
  if (c >= 2) {
    const t1 = board[r][c - 1];
    const t2 = board[r][c - 2];
    if (isSimpleTile(t1) && isSimpleTile(t2) && t1.shape === t2.shape) {
      forbidden.add(t1.shape);
    }
  }

  // Check vertical: if board[r-1][c] and board[r-2][c] have the same shape
  if (r >= 2) {
    const t1 = board[r - 1][c];
    const t2 = board[r - 2][c];
    if (isSimpleTile(t1) && isSimpleTile(t2) && t1.shape === t2.shape) {
      forbidden.add(t1.shape);
    }
  }

  return forbidden;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
