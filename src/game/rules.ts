import type { Board, Piece, Position, Player } from './types';
import { isInPalace, isInTerritory, hasRiverCrossed } from './board';

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
}

export function getValidMoves(
  piece: Piece,
  from: Position,
  board: Board,
  checkSafety: boolean = true
): Position[] {
  const moves: Position[] = [];

  switch (piece.type) {
    case 'king':
      addKingMoves(from, piece.player, board, moves);
      break;
    case 'advisor':
      addAdvisorMoves(from, piece.player, board, moves);
      break;
    case 'elephant':
      addElephantMoves(from, piece.player, board, moves);
      break;
    case 'horse':
      addHorseMoves(from, board, moves);
      break;
    case 'chariot':
      addChariotMoves(from, board, moves);
      break;
    case 'cannon':
      addCannonMoves(from, board, moves);
      break;
    case 'pawn':
      addPawnMoves(from, piece.player, board, moves);
      break;
  }

  if (checkSafety) {
    return moves.filter(to => !wouldExposeKing(board, from, to, piece.player));
  }

  return moves;
}

function addKingMoves(from: Position, player: Player, board: Board, moves: Position[]) {
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];

  for (const [dr, dc] of directions) {
    const to = { row: from.row + dr, col: from.col + dc };
    if (isValidPosition(to.row, to.col) && isInPalace(to.row, to.col, player)) {
      const target = board[to.row][to.col];
      if (!target || target.player !== player) {
        moves.push(to);
      }
    }
  }

  if (!hasFlyingGeneralThreat(board, from, player)) {
    moves.push(...moves);
  }
}

function addAdvisorMoves(from: Position, player: Player, board: Board, moves: Position[]) {
  const diagonals = [
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

  for (const [dr, dc] of diagonals) {
    const to = { row: from.row + dr, col: from.col + dc };
    if (isValidPosition(to.row, to.col) && isInPalace(to.row, to.col, player)) {
      const target = board[to.row][to.col];
      if (!target || target.player !== player) {
        moves.push(to);
      }
    }
  }
}

function addElephantMoves(from: Position, player: Player, board: Board, moves: Position[]) {
  const diagonals = [
    [-2, -2], [-2, 2], [2, -2], [2, 2]
  ];

  for (const [dr, dc] of diagonals) {
    const to = { row: from.row + dr, col: from.col + dc };
    const block = { row: from.row + dr / 2, col: from.col + dc / 2 };

    if (isValidPosition(to.row, to.col) && isInTerritory(to.row, to.col, player)) {
      if (!board[block.row][block.col]) {
        const target = board[to.row][to.col];
        if (!target || target.player !== player) {
          moves.push(to);
        }
      }
    }
  }
}

function addHorseMoves(from: Position, board: Board, moves: Position[]) {
  const horseMoves = [
    [-2, -1, -1, 0], [-2, 1, -1, 0],
    [2, -1, 1, 0], [2, 1, 1, 0],
    [-1, -2, 0, -1], [1, -2, 0, -1],
    [-1, 2, 0, 1], [1, 2, 0, 1]
  ];

  for (const [dr, dc, blockR, blockC] of horseMoves) {
    const to = { row: from.row + dr, col: from.col + dc };
    const block = { row: from.row + blockR, col: from.col + blockC };

    if (isValidPosition(to.row, to.col)) {
      if (!board[block.row][block.col]) {
        const target = board[to.row][to.col];
        const piece = board[from.row][from.col];
        if (piece && (!target || target.player !== piece.player)) {
          moves.push(to);
        }
      }
    }
  }
}

function addChariotMoves(from: Position, board: Board, moves: Position[]) {
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];
  const piece = board[from.row][from.col];

  for (const [dr, dc] of directions) {
    for (let i = 1; i < 10; i++) {
      const to = { row: from.row + dr * i, col: from.col + dc * i };
      if (!isValidPosition(to.row, to.col)) break;

      const target = board[to.row][to.col];
      if (!target) {
        moves.push(to);
      } else {
        if (piece && target.player !== piece.player) {
          moves.push(to);
        }
        break;
      }
    }
  }
}

function addCannonMoves(from: Position, board: Board, moves: Position[]) {
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];
  const piece = board[from.row][from.col];

  for (const [dr, dc] of directions) {
    let jumped = false;

    for (let i = 1; i < 10; i++) {
      const to = { row: from.row + dr * i, col: from.col + dc * i };
      if (!isValidPosition(to.row, to.col)) break;

      const target = board[to.row][to.col];

      if (!jumped) {
        if (!target) {
          moves.push(to);
        } else {
          jumped = true;
        }
      } else {
        if (target) {
          if (piece && target.player !== piece.player) {
            moves.push(to);
          }
          break;
        }
      }
    }
  }
}

function addPawnMoves(from: Position, player: Player, board: Board, moves: Position[]) {
  const piece = board[from.row][from.col];
  const forward = player === 'red' ? -1 : 1;
  const crossed = hasRiverCrossed(from.row, player);

  const forwardPos = { row: from.row + forward, col: from.col };
  if (isValidPosition(forwardPos.row, forwardPos.col)) {
    const target = board[forwardPos.row][forwardPos.col];
    if (!target || (piece && target.player !== piece.player)) {
      moves.push(forwardPos);
    }
  }

  if (crossed) {
    for (const dc of [-1, 1]) {
      const sidePos = { row: from.row, col: from.col + dc };
      if (isValidPosition(sidePos.row, sidePos.col)) {
        const target = board[sidePos.row][sidePos.col];
        if (!target || (piece && target.player !== piece.player)) {
          moves.push(sidePos);
        }
      }
    }
  }
}

function wouldExposeKing(board: Board, from: Position, to: Position, player: Player): boolean {
  const testBoard = board.map(row => [...row]);
  testBoard[to.row][to.col] = testBoard[from.row][from.col];
  testBoard[from.row][from.col] = null;

  return isKingInCheck(testBoard, player);
}

export function isKingInCheck(board: Board, player: Player): boolean {
  const kingPos = findKing(board, player);
  if (!kingPos) return false;

  const opponent: Player = player === 'red' ? 'black' : 'red';

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.player === opponent) {
        const moves = getValidMoves(piece, { row, col }, board, false);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }

  return hasFlyingGeneralThreat(board, kingPos, player);
}

function findKing(board: Board, player: Player): Position | null {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.player === player) {
        return { row, col };
      }
    }
  }
  return null;
}

function hasFlyingGeneralThreat(board: Board, kingPos: Position, player: Player): boolean {
  const opponent: Player = player === 'red' ? 'black' : 'red';
  const opponentKing = findKing(board, opponent);

  if (!opponentKing || opponentKing.col !== kingPos.col) return false;

  const startRow = Math.min(kingPos.row, opponentKing.row) + 1;
  const endRow = Math.max(kingPos.row, opponentKing.row);

  for (let row = startRow; row < endRow; row++) {
    if (board[row][kingPos.col]) return false;
  }

  return true;
}

export function isCheckmate(board: Board, player: Player): boolean {
  if (!isKingInCheck(board, player)) return false;

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.player === player) {
        const moves = getValidMoves(piece, { row, col }, board, true);
        if (moves.length > 0) return false;
      }
    }
  }

  return true;
}

export function hasLegalMoves(board: Board, player: Player): boolean {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.player === player) {
        const moves = getValidMoves(piece, { row, col }, board, true);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}
