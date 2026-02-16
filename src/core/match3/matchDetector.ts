import type { Board, MatchResult, Position, SimpleTileShape } from './types';
import { isSimpleTile } from './types';

/**
 * Find all matches of 3+ on the board.
 * Only SimpleTile tiles participate in matching.
 * FoodTile tiles break runs (treated as walls for matching).
 */
export function findMatches(board: Board): MatchResult[] {
  const rows = board.length;
  if (rows === 0) return [];
  const cols = board[0].length;

  // Collect raw match groups (sets of positions sharing a shape)
  const positionSets: Map<string, { shape: SimpleTileShape; positions: Set<string> }> = new Map();
  let groupId = 0;

  // Helper to create position key
  const posKey = (r: number, c: number) => `${r},${c}`;

  // Horizontal scan
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    while (runStart < cols) {
      const tile = board[r][runStart];
      if (!isSimpleTile(tile)) {
        runStart++;
        continue;
      }
      const shape = tile.shape;
      let runEnd = runStart + 1;
      while (runEnd < cols) {
        const next = board[r][runEnd];
        if (!isSimpleTile(next) || next.shape !== shape) break;
        runEnd++;
      }
      const runLength = runEnd - runStart;
      if (runLength >= 3) {
        const id = `h${groupId++}`;
        const positions = new Set<string>();
        for (let c = runStart; c < runEnd; c++) {
          positions.add(posKey(r, c));
        }
        positionSets.set(id, { shape, positions });
      }
      runStart = runEnd;
    }
  }

  // Vertical scan
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    while (runStart < rows) {
      const tile = board[runStart][c];
      if (!isSimpleTile(tile)) {
        runStart++;
        continue;
      }
      const shape = tile.shape;
      let runEnd = runStart + 1;
      while (runEnd < rows) {
        const next = board[runEnd][c];
        if (!isSimpleTile(next) || next.shape !== shape) break;
        runEnd++;
      }
      const runLength = runEnd - runStart;
      if (runLength >= 3) {
        const id = `v${groupId++}`;
        const positions = new Set<string>();
        for (let r = runStart; r < runEnd; r++) {
          positions.add(posKey(r, c));
        }
        positionSets.set(id, { shape, positions });
      }
      runStart = runEnd;
    }
  }

  // Merge overlapping groups of the same shape (T/L shapes)
  const groups = Array.from(positionSets.values());
  const merged: { shape: SimpleTileShape; positions: Set<string> }[] = [];
  const used = new Set<number>();

  for (let i = 0; i < groups.length; i++) {
    if (used.has(i)) continue;
    const current = { shape: groups[i].shape, positions: new Set(groups[i].positions) };
    used.add(i);

    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < groups.length; j++) {
        if (used.has(j)) continue;
        if (groups[j].shape !== current.shape) continue;
        // Check overlap
        let overlaps = false;
        for (const pos of groups[j].positions) {
          if (current.positions.has(pos)) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) {
          for (const pos of groups[j].positions) {
            current.positions.add(pos);
          }
          used.add(j);
          changed = true;
        }
      }
    }

    merged.push(current);
  }

  // Convert to MatchResult[]
  return merged.map(group => ({
    shape: group.shape,
    positions: Array.from(group.positions).map(key => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c } as Position;
    }),
  }));
}

/**
 * Remove matched tiles from board (set to null).
 * Returns a new board.
 */
export function removeMatches(board: Board, matches: MatchResult[]): Board {
  const newBoard = board.map(row => [...row]);
  for (const match of matches) {
    for (const pos of match.positions) {
      newBoard[pos.row][pos.col] = null;
    }
  }
  return newBoard;
}
