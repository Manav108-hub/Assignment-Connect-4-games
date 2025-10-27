import { useState } from 'react';
import type { CellValue } from '../types';

interface GameBoardProps {
  board: CellValue[][];
  onColumnClick: (col: number) => void;
  disabled: boolean;
  lastMove?: { row: number; col: number };
  selectedColumn: number; // 👈 add this prop
}

export function GameBoard({
  board,
  onColumnClick,
  disabled,
  lastMove,
  selectedColumn,
}: GameBoardProps) {
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  // --- Determine cell class for each slot ---
  const getCellClass = (cell: CellValue, row: number, col: number): string => {
    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;
    let classes = 'cell';

    if (cell === 'player1') classes += ' cell-player1';
    else if (cell === 'player2') classes += ' cell-player2';
    if (isLastMove) classes += ' cell-last-move';

    return classes;
  };

  return (
    <div className="game-board" style={{ position: 'relative' }}>
      {/* === HOLLOW PREVIEW INDICATOR (above board) === */}
      <div className="board-hover-indicator">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`hover-spot ${
              i === selectedColumn || i === hoveredColumn ? 'active' : ''
            }`}
          ></div>
        ))}
      </div>

      {/* === BOARD GRID === */}
      <div className="board-grid">
        {Array.from({ length: 7 }).map((_, col) => (
          <div
            key={col}
            className="board-column"
            onMouseEnter={() => setHoveredColumn(col)}
            onMouseLeave={() => setHoveredColumn(null)}
          >
            <button
              className="column-button"
              onClick={() => onColumnClick(col)}
              disabled={disabled || board[0][col] !== 'empty'}
            >
              <span className="column-indicator">↓</span>
            </button>

            <div className="column-cells">
              {board.map((row, rowIndex) => (
                <div
                  key={`${rowIndex}-${col}`}
                  className={getCellClass(row[col], rowIndex, col)}
                >
                  {row[col] !== 'empty' && <div className="disc"></div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
