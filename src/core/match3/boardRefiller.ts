import type { Board, Match3Config, RefillResult, Tile, FoodTile, SimpleTile } from './types';
import { ALL_SHAPES, isFoodTile } from './types';

/**
 * Fill empty (null) cells in the board from the top.
 * New tiles have a configurable chance to be food tiles.
 * Caps food tiles at 20% of total board cells to prevent blocking.
 */
export function refillBoard(
  board: Board,
  config: Match3Config,
  availableFoodShipIds: string[]
): RefillResult {
  const { rows, columns, tileTypes, foodSpawnChance } = config;
  const shapes = ALL_SHAPES.slice(0, tileTypes);
  const newBoard = board.map(row => [...row]);
  const newTiles: { position: { row: number; col: number }; tile: Tile }[] = [];

  // Count existing food tiles to enforce cap
  const maxFoodTiles = Math.floor(rows * columns * 0.2);
  let currentFoodCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      if (isFoodTile(newBoard[r][c])) currentFoodCount++;
    }
  }

  // For each column, fill nulls from top down
  for (let c = 0; c < columns; c++) {
    for (let r = 0; r < rows; r++) {
      if (newBoard[r][c] !== null) continue;

      let tile: Tile;
      const canSpawnFood = availableFoodShipIds.length > 0
        && currentFoodCount < maxFoodTiles
        && Math.random() < foodSpawnChance;

      if (canSpawnFood) {
        const shipId = availableFoodShipIds[Math.floor(Math.random() * availableFoodShipIds.length)];
        tile = { type: 'food', shipId } as FoodTile;
        currentFoodCount++;
      } else {
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        tile = { type: 'simple', shape } as SimpleTile;
      }

      newBoard[r][c] = tile;
      newTiles.push({ position: { row: r, col: c }, tile });
    }
  }

  return { board: newBoard, newTiles };
}
