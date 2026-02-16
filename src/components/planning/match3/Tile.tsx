import type { Tile as TileType, Position } from '../../../core/match3';
import { isSimpleTile, isFoodTile } from '../../../core/match3';
import type { Ship } from '../../../core/types';

const SHAPE_STYLES: Record<string, { color: string; symbol: string }> = {
  square:   { color: '#fc8181', symbol: '■' },
  triangle: { color: '#ecc94b', symbol: '▲' },
  circle:   { color: '#63b3ed', symbol: '●' },
  diamond:  { color: '#48bb78', symbol: '◆' },
  hexagon:  { color: '#b794f4', symbol: '⬡' },
};

interface TileProps {
  tile: TileType | null;
  position: Position;
  isSelected: boolean;
  isMatching: boolean;
  allShips: Ship[];
  disabled: boolean;
  onClick: (pos: Position) => void;
}

export function Tile({
  tile,
  position,
  isSelected,
  isMatching,
  allShips,
  disabled,
  onClick,
}: TileProps) {
  if (tile === null) {
    return <div className="match3-tile match3-tile--empty" />;
  }

  const handleClick = () => {
    if (!disabled) onClick(position);
  };

  if (isSimpleTile(tile)) {
    const style = SHAPE_STYLES[tile.shape] ?? SHAPE_STYLES.circle;
    return (
      <div
        className={[
          'match3-tile',
          'match3-tile--simple',
          `match3-tile--${tile.shape}`,
          isSelected && 'match3-tile--selected',
          isMatching && 'match3-tile--matching',
        ].filter(Boolean).join(' ')}
        style={{ '--tile-color': style.color } as React.CSSProperties}
        onClick={handleClick}
      >
        <span className="match3-tile__symbol">{style.symbol}</span>
      </div>
    );
  }

  if (isFoodTile(tile)) {
    const ship = allShips.find(s => s.id === tile.shipId);
    return (
      <div
        className={[
          'match3-tile',
          'match3-tile--food',
          isMatching && 'match3-tile--matching',
        ].filter(Boolean).join(' ')}
        onClick={handleClick}
      >
        <span className="match3-tile__emoji">{ship?.emoji ?? '🍽️'}</span>
      </div>
    );
  }

  return null;
}
