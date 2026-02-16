// Match-3 engine types

export type SimpleTileShape = 'square' | 'triangle' | 'circle' | 'diamond' | 'hexagon';

export const ALL_SHAPES: SimpleTileShape[] = ['square', 'triangle', 'circle', 'diamond', 'hexagon'];

export interface SimpleTile {
  type: 'simple';
  shape: SimpleTileShape;
}

export interface FoodTile {
  type: 'food';
  shipId: string;
}

export type Tile = SimpleTile | FoodTile;

/** board[row][col], row 0 = top */
export type Board = (Tile | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface MatchResult {
  positions: Position[];
  shape: SimpleTileShape;
}

export interface TileMovement {
  from: Position;
  to: Position;
  tile: Tile;
}

export interface GravityResult {
  newBoard: Board;
  droppedFoodTiles: FoodTile[];
  movements: TileMovement[];
}

export interface RefillResult {
  board: Board;
  newTiles: { position: Position; tile: Tile }[];
}

export interface CascadeStep {
  matches: MatchResult[];
  movements: TileMovement[];
  droppedFoodTiles: FoodTile[];
}

export interface SwapResult {
  valid: boolean;
  board: Board;
  cascadeSteps: CascadeStep[];
  droppedFoodTiles: FoodTile[];
}

export interface InitialFoodTile {
  shipId: string;
  col: number;
  row: number;
}

export interface Match3Config {
  columns: number;
  rows: number;
  tileTypes: number;       // 3-5, how many SimpleTileShape variants to use
  foodSpawnChance: number;  // 0.0 - 1.0
  initialFoodTiles?: InitialFoodTile[];
}

// Helpers

export function isSimpleTile(tile: Tile | null): tile is SimpleTile {
  return tile !== null && tile.type === 'simple';
}

export function isFoodTile(tile: Tile | null): tile is FoodTile {
  return tile !== null && tile.type === 'food';
}

export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}
