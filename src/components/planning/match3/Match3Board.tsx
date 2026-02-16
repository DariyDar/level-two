import { useRef, useState, useCallback } from 'react';
import type { Position } from '../../../core/match3';
import type { Ship } from '../../../core/types';
import type { UseMatch3Return } from '../../../hooks/useMatch3';
import { Tile } from './Tile';
import './Match3Board.css';

interface Match3BoardProps {
  match3: UseMatch3Return;
  allShips: Ship[];
}

const DRAG_THRESHOLD = 15; // pixels to trigger swap

export function Match3Board({ match3, allShips }: Match3BoardProps) {
  const {
    board,
    movesRemaining,
    moveBudget,
    isAnimating,
    matchingPositions,
    isOutOfMoves,
    noValidMoves,
    attemptSwap,
  } = match3;

  const rows = board.length;
  const cols = rows > 0 ? board[0].length : 0;

  const [draggingPos, setDraggingPos] = useState<Position | null>(null);
  const dragRef = useRef<{ pos: Position; startX: number; startY: number } | null>(null);

  const handlePointerDown = useCallback((pos: Position, e: React.PointerEvent) => {
    if (isAnimating || isOutOfMoves) return;
    const tile = board[pos.row]?.[pos.col];
    if (!tile) return;

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { pos, startX: e.clientX, startY: e.clientY };
    setDraggingPos(pos);
  }, [isAnimating, isOutOfMoves, board]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < DRAG_THRESHOLD && absDy < DRAG_THRESHOLD) return;

    const { pos } = dragRef.current;
    let targetPos: Position;

    if (absDx > absDy) {
      targetPos = { row: pos.row, col: pos.col + (dx > 0 ? 1 : -1) };
    } else {
      targetPos = { row: pos.row + (dy > 0 ? 1 : -1), col: pos.col };
    }

    dragRef.current = null;
    setDraggingPos(null);
    attemptSwap(pos, targetPos);
  }, [attemptSwap]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setDraggingPos(null);
  }, []);

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
            const pos = { row: r, col: c };
            return (
              <div
                key={key}
                className="match3-cell"
                onPointerDown={(e) => handlePointerDown(pos, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <Tile
                  tile={tile}
                  isMatching={matchingPositions.has(key)}
                  isDragging={draggingPos?.row === r && draggingPos?.col === c}
                  allShips={allShips}
                />
              </div>
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
