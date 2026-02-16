import type { Tile as TileType } from '../../../core/match3';
import { isSimpleTile, isFoodTile } from '../../../core/match3';
import type { Ship } from '../../../core/types';

const SHAPE_STYLES: Record<string, { color: string; symbol: string }> = {
  square:   { color: '#fc8181', symbol: '■' },
  triangle: { color: '#ecc94b', symbol: '▲' },
  circle:   { color: '#63b3ed', symbol: '●' },
  diamond:  { color: '#48bb78', symbol: '◆' },
};

interface TileProps {
  tile: TileType | null;
  isMatching: boolean;
  isDragging: boolean;
  allShips: Ship[];
}

export function Tile({
  tile,
  isMatching,
  isDragging,
  allShips,
}: TileProps) {
  if (tile === null) {
    return <div className="match3-tile match3-tile--empty" />;
  }

  if (isSimpleTile(tile)) {
    const style = SHAPE_STYLES[tile.shape] ?? SHAPE_STYLES.circle;
    return (
      <div
        className={[
          'match3-tile',
          'match3-tile--simple',
          `match3-tile--${tile.shape}`,
          isMatching && 'match3-tile--matching',
          isDragging && 'match3-tile--dragging',
        ].filter(Boolean).join(' ')}
        style={{ '--tile-color': style.color } as React.CSSProperties}
      >
        <span className="match3-tile__symbol">{style.symbol}</span>
      </div>
    );
  }

  if (isFoodTile(tile)) {
    const ship = allShips.find(s => s.id === tile.shipId);
    const isIntervention = ship && ship.loadType !== 'Glucose';
    return (
      <div
        className={[
          'match3-tile',
          'match3-tile--food',
          isIntervention && 'match3-tile--intervention',
          isMatching && 'match3-tile--matching',
          isDragging && 'match3-tile--dragging',
        ].filter(Boolean).join(' ')}
      >
        <span className="match3-tile__emoji">{ship?.emoji ?? '🍽️'}</span>
      </div>
    );
  }

  return null;
}
