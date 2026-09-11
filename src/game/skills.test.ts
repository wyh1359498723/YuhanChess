import { describe, it, expect } from 'vitest';
import {
  canUseLaserBeam,
  executeLaserBeam,
  canUseSelfDestruct,
  executeSelfDestruct,
  executeCavalry,
  canUseResilience,
  executeResilience,
  canUseDevour
} from './skills';
import { isKingInCheck } from './rules';
import type { Board, GameState, Player } from './types';

function createMinimalGameState(board: Board, currentPlayer: Player): GameState {
  return {
    board,
    currentPlayer,
    selectedPiece: null,
    gameOver: false,
    winner: null,
    selectedSkills: { red: null, black: null },
    skillsUsed: { red: false, black: false },
    lastMove: null,
    capturedPieces: { red: [], black: [] },
    mergedCavalry: [],
    sacrificeAdvisors: { red: null, black: null },
    devouredAbilities: { red: null, black: null },
    lastKillPosition: { red: null, black: null },
    resilienceUsed: { red: false, black: false }
  };
}

describe('Skills', () => {
  describe('Laser Beam', () => {
    it('should not be usable when king is in the column', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[7][4] = { type: 'chariot', player: 'red' };
      
      expect(canUseLaserBeam({ row: 7, col: 4 }, board)).toBe(false);
    });

    it('should remove all pieces in column except the chariot', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[7][2] = { type: 'chariot', player: 'red' };
      board[5][2] = { type: 'pawn', player: 'black' };
      board[3][2] = { type: 'horse', player: 'black' };
      board[6][2] = { type: 'pawn', player: 'red' };
      
      expect(canUseLaserBeam({ row: 7, col: 2 }, board)).toBe(true);
      
      const gameState = createMinimalGameState(board, 'red');
      const newState = executeLaserBeam({ row: 7, col: 2 }, gameState);
      
      expect(newState.board[7][2]).toBeTruthy();
      expect(newState.board[5][2]).toBeNull();
      expect(newState.board[3][2]).toBeNull();
      expect(newState.board[6][2]).toBeNull();
      expect(newState.currentPlayer).toBe('black');
    });

    it('should not leave user king in check after use', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[7][3] = { type: 'chariot', player: 'red' };
      board[5][3] = { type: 'advisor', player: 'red' };
      board[0][3] = { type: 'chariot', player: 'black' };
      
      const gameState = createMinimalGameState(board, 'red');
      const newState = executeLaserBeam({ row: 7, col: 3 }, gameState);
      
      expect(isKingInCheck(newState.board, 'red')).toBe(true);
    });
  });

  describe('Self Destruct', () => {
    it('should not be usable when king is in 3x3 range', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[7][4] = { type: 'cannon', player: 'red' };
      
      expect(canUseSelfDestruct(
        { row: 7, col: 4 },
        { row: 8, col: 4 },
        board
      )).toBe(false);
    });

    it('should remove all pieces in 3x3 area', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[7][1] = { type: 'cannon', player: 'red' };
      board[5][2] = { type: 'horse', player: 'black' };
      board[4][2] = { type: 'pawn', player: 'black' };
      board[4][3] = { type: 'pawn', player: 'red' };
      
      expect(canUseSelfDestruct(
        { row: 7, col: 1 },
        { row: 5, col: 2 },
        board
      )).toBe(true);
      
      const gameState = createMinimalGameState(board, 'red');
      gameState.board = board.map(row => [...row]);
      gameState.board[5][2] = gameState.board[7][1];
      gameState.board[7][1] = null;
      
      const newState = executeSelfDestruct({ row: 5, col: 2 }, gameState);
      
      expect(newState.board[5][2]).toBeNull();
      expect(newState.board[4][2]).toBeNull();
      expect(newState.board[4][3]).toBeNull();
    });
  });

  describe('Cavalry', () => {
    it('should merge horse with pawn when cavalry skill is activated', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[5][2] = { type: 'pawn', player: 'red' };
      
      const gameState = createMinimalGameState(board, 'red');
      const newBoard = executeCavalry({ row: 5, col: 2 }, gameState);
      
      expect(newBoard[5][2]?.isCavalry).toBe(true);
      expect(newBoard[5][2]?.type).toBe('pawn');
    });
  });

  describe('Resilience', () => {
    it('should not be usable when no elephant died last turn', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      
      const gameState = createMinimalGameState(board, 'red');
      expect(canUseResilience(gameState)).toBe(false);
    });

    it('should revive elephant and destroy occupant', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[7][2] = { type: 'horse', player: 'black' };
      
      const gameState = createMinimalGameState(board, 'red');
      gameState.lastKillPosition.red = { row: 7, col: 2 };
      gameState.capturedPieces.red.push({ type: 'elephant', player: 'red' });
      
      expect(canUseResilience(gameState)).toBe(true);
      
      const newState = executeResilience(gameState);
      
      expect(newState.board[7][2]?.type).toBe('elephant');
      expect(newState.board[7][2]?.player).toBe('red');
      expect(newState.capturedPieces.black.length).toBe(1);
      expect(newState.capturedPieces.red.length).toBe(0);
    });

    it('should not be usable when occupant is king', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'black' };
      board[0][4] = { type: 'king', player: 'red' };
      
      const gameState = createMinimalGameState(board, 'red');
      gameState.lastKillPosition.red = { row: 9, col: 4 };
      gameState.capturedPieces.red.push({ type: 'elephant', player: 'red' });
      
      expect(canUseResilience(gameState)).toBe(false);
    });
  });

  describe('Devour', () => {
    it('should not allow eating pawn or own pieces', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[6][0] = { type: 'pawn', player: 'red' };
      board[5][0] = { type: 'pawn', player: 'black' };
      board[6][1] = { type: 'advisor', player: 'red' };
      
      expect(canUseDevour({ row: 6, col: 0 }, { row: 5, col: 0 }, board)).toBe(false);
      expect(canUseDevour({ row: 6, col: 0 }, { row: 6, col: 1 }, board)).toBe(false);
    });

    it('should allow eating enemy non-pawn pieces', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[4][0] = { type: 'pawn', player: 'red' };
      board[4][1] = { type: 'horse', player: 'black' };
      
      expect(canUseDevour({ row: 4, col: 0 }, { row: 4, col: 1 }, board)).toBe(true);
    });
  });

  describe('Game End After Skills', () => {
    it('should properly handle game state after laser beam', () => {
      const board: Board = Array(10).fill(null).map(() => Array(9).fill(null));
      board[9][4] = { type: 'king', player: 'red' };
      board[0][4] = { type: 'king', player: 'black' };
      board[5][3] = { type: 'chariot', player: 'red' };
      board[3][3] = { type: 'horse', player: 'black' };
      board[6][3] = { type: 'pawn', player: 'red' };
      
      const gameState = createMinimalGameState(board, 'red');
      const newState = executeLaserBeam({ row: 5, col: 3 }, gameState);
      
      expect(newState.board[5][3]).toBeTruthy();
      expect(newState.board[3][3]).toBeNull();
      expect(newState.board[6][3]).toBeNull();
      expect(newState.currentPlayer).toBe('black');
    });
  });
});
