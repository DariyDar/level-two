import type { Position } from '../../../core/match3';
import { isSimpleTile, isFoodTile, isAdjacent } from '../../../core/match3';
import type { Ship } from '../../../core/types';
import type { UseMatch3Return } from '../../../hooks/useMatch3';
import { Tile } from './Tile';
import './Match3Board.css';

interface Match3BoardProps {
  match3: UseMatch3Return;
  allShips: Ship[];
}

export function Match3Board({ match3, allShips }: Match3BoardProps) {
  const {
    board,
    movesRemaining,
    moveBudget,
    selectedPosition,
    isAnimating,
    matchingPositions,
    isOutOfMoves,
    noValidMoves,
    selectPosition,
    attemptSwap,
  } = match3;

  const rows = board.length;
  const cols = rows > 0 ? board[0].length : 0;

  const handleTileClick = (pos: Position) => {
    if (isAnimating || isOutOfMoves) return;

    const tile = board[pos.row]?.[pos.col];
    if (!tile) return;

    // Food tiles cannot be selected for swapping
    if (isFoodTile(tile)) return;

    // No tile selected yet — select this one
    if (!selectedPosition) {
      if (isSimpleTile(tile)) {
        selectPosition(pos);
      }
      return;
    }

    // Same tile — deselect
    if (selectedPosition.row === pos.row && selectedPosition.col === pos.col) {
      selectPosition(null);
      return;
    }

    // Adjacent simple tile — attempt swap
    if (isAdjacent(selectedPosition, pos) && isSimpleTile(tile)) {
      attemptSwap(selectedPosition, pos);
      return;
    }

    // Non-adjacent — switch selection
    if (isSimpleTile(tile)) {
      selectPosition(pos);
    }
  };

  if (rows === 0) return null;

  return (
    <div className="match3-section">
      <div className="match3-section__header">
        <span className="match3-section__label">Match tiles to unlock food!</span>
        <span className={`match3-section__moves ${movesRemaining <= 3 ? 'match3-section__moves--low' : ''}`}>
          {movesRemaining}/{moveBudget}
        </span>
      </div>

      <div
        className={[
          'match3-board',
          isAnimating && 'match3-board--animating',
          isOutOfMoves && 'match3-board--disabled',
          noValidMoves && !isOutOfMoves && 'match3-board--deadlock',
        ].filter(Boolean).join(' ')}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {board.map((row, r) =>
          row.map((tile, c) => {
            const key = `${r},${c}`;
            return (
              <Tile
                key={key}
                tile={tile}
                position={{ row: r, col: c }}
                isSelected={
                  selectedPosition !== null &&
                  selectedPosition.row === r &&
                  selectedPosition.col === c
                }
                isMatching={matchingPositions.has(key)}
                allShips={allShips}
                disabled={isAnimating || isOutOfMoves}
                onClick={handleTileClick}
              />
            );
          })
        )}
      </div>

      {isOutOfMoves && (
        <div className="match3-section__status">No moves left — place your cards!</div>
      )}
      {noValidMoves && !isOutOfMoves && (
        <div className="match3-section__status match3-section__status--warning">
          No valid swaps available
        </div>
      )}
    </div>
  );
}
