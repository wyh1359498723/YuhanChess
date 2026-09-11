import type { Board as BoardType, Position, Player } from '../game/types';
import { getPieceDisplay } from '../game/board';
import { isKingInCheck } from '../game/rules';

interface BoardProps {
  board: BoardType;
  selectedPiece: Position | null;
  onSquareClick: (pos: Position) => void;
  currentPlayer: Player;
  lastMove: { from: Position; to: Position } | null;
  sacrificeAdvisors: { red: Position | null; black: Position | null };
}

export function Board({
  board,
  selectedPiece,
  onSquareClick,
  currentPlayer,
  lastMove,
  sacrificeAdvisors
}: BoardProps) {
  const isCheck = isKingInCheck(board, currentPlayer);

  const getSquareClass = (row: number, col: number) => {
    const classes = ['square'];
    
    if (selectedPiece?.row === row && selectedPiece?.col === col) {
      classes.push('selected');
    }

    if (lastMove) {
      if ((lastMove.from.row === row && lastMove.from.col === col) ||
          (lastMove.to.row === row && lastMove.to.col === col)) {
        classes.push('last-move');
      }
    }

    const piece = board[row][col];
    if (piece?.type === 'king' && piece.player === currentPlayer && isCheck) {
      classes.push('in-check');
    }

    return classes.join(' ');
  };

  const isSacrificeAdvisor = (row: number, col: number): boolean => {
    return (sacrificeAdvisors.red?.row === row && sacrificeAdvisors.red?.col === col) ||
           (sacrificeAdvisors.black?.row === row && sacrificeAdvisors.black?.col === col);
  };

  return (
    <div className="board-container">
      <div className="board-wrapper">
        <div className="board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getSquareClass(rowIndex, colIndex)}
                  onClick={() => onSquareClick({ row: rowIndex, col: colIndex })}
                >
                  {piece && (
                    <div className={`piece piece-${piece.player}`}>
                      {getPieceDisplay(piece)}
                      {piece.isCavalry && (
                        <span className="piece-label cavalry">骑</span>
                      )}
                      {piece.isSacrifice && isSacrificeAdvisor(rowIndex, colIndex) && (
                        <span className="piece-label sacrifice">替</span>
                      )}
                    </div>
                  )}
                  {rowIndex === 4 && colIndex < 8 && (
                    <div className="river-marker">楚河</div>
                  )}
                  {rowIndex === 5 && colIndex > 0 && colIndex === 1 && (
                    <div className="river-marker">汉界</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
