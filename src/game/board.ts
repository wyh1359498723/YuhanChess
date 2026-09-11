import type { Board, Piece, Player } from './types';

export function createInitialBoard(): Board {
  const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));

  // Black pieces (top)
  board[0][0] = { type: 'chariot', player: 'black' };
  board[0][1] = { type: 'horse', player: 'black' };
  board[0][2] = { type: 'elephant', player: 'black' };
  board[0][3] = { type: 'advisor', player: 'black' };
  board[0][4] = { type: 'king', player: 'black' };
  board[0][5] = { type: 'advisor', player: 'black' };
  board[0][6] = { type: 'elephant', player: 'black' };
  board[0][7] = { type: 'horse', player: 'black' };
  board[0][8] = { type: 'chariot', player: 'black' };

  board[2][1] = { type: 'cannon', player: 'black' };
  board[2][7] = { type: 'cannon', player: 'black' };

  for (let i = 0; i < 9; i += 2) {
    board[3][i] = { type: 'pawn', player: 'black' };
  }

  // Red pieces (bottom)
  board[9][0] = { type: 'chariot', player: 'red' };
  board[9][1] = { type: 'horse', player: 'red' };
  board[9][2] = { type: 'elephant', player: 'red' };
  board[9][3] = { type: 'advisor', player: 'red' };
  board[9][4] = { type: 'king', player: 'red' };
  board[9][5] = { type: 'advisor', player: 'red' };
  board[9][6] = { type: 'elephant', player: 'red' };
  board[9][7] = { type: 'horse', player: 'red' };
  board[9][8] = { type: 'chariot', player: 'red' };

  board[7][1] = { type: 'cannon', player: 'red' };
  board[7][7] = { type: 'cannon', player: 'red' };

  for (let i = 0; i < 9; i += 2) {
    board[6][i] = { type: 'pawn', player: 'red' };
  }

  return board;
}

export function getPieceDisplay(piece: Piece): string {
  const chars = {
    red: {
      king: '帅',
      advisor: '仕',
      elephant: '相',
      horse: '马',
      chariot: '车',
      cannon: '炮',
      pawn: '兵'
    },
    black: {
      king: '将',
      advisor: '士',
      elephant: '象',
      horse: '马',
      chariot: '车',
      cannon: '炮',
      pawn: '卒'
    }
  };
  return chars[piece.player][piece.type];
}

export function isInPalace(row: number, col: number, player: Player): boolean {
  if (player === 'red') {
    return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  } else {
    return row >= 0 && row <= 2 && col >= 3 && col <= 5;
  }
}

export function isInTerritory(row: number, _col: number, player: Player): boolean {
  if (player === 'red') {
    return row >= 5;
  } else {
    return row <= 4;
  }
}

export function hasRiverCrossed(row: number, player: Player): boolean {
  if (player === 'red') {
    return row <= 4;
  } else {
    return row >= 5;
  }
}
