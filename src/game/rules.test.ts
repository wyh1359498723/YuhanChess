import { describe, it, expect } from 'vitest';
import { isCheckmate, hasLegalMoves, isKingInCheck, getValidMoves } from './rules';
import { createInitialBoard } from './board';
import type { Board } from './types';

describe('Game Rules', () => {
  describe('hasLegalMoves', () => {
    it('should return true for initial board', () => {
      const board = createInitialBoard();
      expect(hasLegalMoves(board, 'red')).toBe(true);
      expect(hasLegalMoves(board, 'black')).toBe(true);
    });

    it('should return false when player has no legal moves', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[8][3] = { type: 'chariot', player: 'black' };
      board[8][4] = { type: 'chariot', player: 'black' };
      board[8][5] = { type: 'chariot', player: 'black' };
      
      expect(hasLegalMoves(board, 'red')).toBe(false);
    });
  });

  describe('isCheckmate', () => {
    it('should return false when king is not in check', () => {
      const board = createInitialBoard();
      expect(isCheckmate(board, 'red')).toBe(false);
      expect(isCheckmate(board, 'black')).toBe(false);
    });

    it('should return true when king is in check with no escape', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[8][3] = { type: 'chariot', player: 'black' };
      board[8][4] = { type: 'chariot', player: 'black' };
      board[8][5] = { type: 'chariot', player: 'black' };
      
      expect(isKingInCheck(board, 'red')).toBe(true);
      expect(isCheckmate(board, 'red')).toBe(true);
    });
  });

  describe('Flying Generals', () => {
    it('should detect flying generals when kings face each other', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      
      expect(isKingInCheck(board, 'red')).toBe(true);
      expect(isKingInCheck(board, 'black')).toBe(true);
    });

    it('should not detect flying generals when piece is between kings', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[5][4] = { type: 'pawn', player: 'red' };
      
      expect(isKingInCheck(board, 'red')).toBe(false);
      expect(isKingInCheck(board, 'black')).toBe(false);
    });
  });

  describe('getValidMoves', () => {
    it('should filter moves that expose king to check', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[9][3] = { type: 'advisor', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[9][0] = { type: 'chariot', player: 'black' };
      
      const moves = getValidMoves(
        board[9][3]!,
        { row: 9, col: 3 },
        board,
        true
      );
      
      for (const move of moves) {
        const testBoard = board.map(row => [...row]);
        testBoard[move.row][move.col] = testBoard[9][3];
        testBoard[9][3] = null;
        expect(isKingInCheck(testBoard, 'red')).toBe(false);
      }
    });
  });
});
