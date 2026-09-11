import type { Skill, SkillType, Board, Position, Piece, Player, GameState } from './types';
import { isValidPosition, getValidMoves } from './rules';

export const SKILLS: Record<SkillType, Skill> = {
  laser_beam: {
    id: 'laser_beam',
    name: '激光波',
    description: '车专属：消耗回合，摧毁同列南北所有棋子（不能伤害将帅）',
    pieceType: 'chariot'
  },
  self_destruct: {
    id: 'self_destruct',
    name: '自焚',
    description: '炮专属：正常移动吃子后，炮与3×3范围内所有棋子同归于尽（不能伤害将帅）',
    pieceType: 'cannon'
  },
  cavalry: {
    id: 'cavalry',
    name: '骑兵',
    description: '马专属：马跳上己方兵卒合体，获得双重移动能力',
    pieceType: 'horse'
  },
  sacrifice: {
    id: 'sacrifice',
    name: '替死',
    description: '士专属：激活后不受九宫限制，当将帅被吃时代死',
    pieceType: 'advisor'
  },
  resilience: {
    id: 'resilience',
    name: '不屈',
    description: '象专属：消耗回合，复活上回合死亡的象并摧毁占据者（不能摧毁将帅）',
    pieceType: 'elephant'
  },
  devour: {
    id: 'devour',
    name: '吞噬',
    description: '兵专属：选中后必须用兵吃掉敌方非兵棋子，全体己方兵获得被吃棋子的移动能力',
    pieceType: 'pawn'
  }
};

export const ALL_SKILLS: SkillType[] = [
  'laser_beam',
  'self_destruct', 
  'cavalry',
  'sacrifice',
  'resilience',
  'devour'
];

// 激光波 - 摧毁车所在列的所有棋子（南北方向）
export function canUseLaserBeam(pos: Position, board: Board): boolean {
  const piece = board[pos.row][pos.col];
  if (!piece || piece.type !== 'chariot') return false;

  // 检查是否有将帅在同列
  for (let row = 0; row < 10; row++) {
    if (row === pos.row) continue;
    const target = board[row][pos.col];
    if (target && target.type === 'king') {
      return false;
    }
  }

  return true;
}

export function executeLaserBeam(pos: Position, gameState: GameState): GameState {
  const newBoard = gameState.board.map(row => [...row]);
  const capturedPieces = { ...gameState.capturedPieces };

  // 摧毁同列所有棋子（除了车本身）
  for (let row = 0; row < 10; row++) {
    if (row === pos.row) continue;
    const target = newBoard[row][pos.col];
    if (target) {
      capturedPieces[target.player].push(target);
      newBoard[row][pos.col] = null;
    }
  }

  return {
    ...gameState,
    board: newBoard,
    capturedPieces,
    currentPlayer: gameState.currentPlayer === 'red' ? 'black' : 'red',
    selectedPiece: null
  };
}

// 自焚 - 炮移动/吃子后，摧毁3×3范围内所有棋子（包括自己）
export function canUseSelfDestruct(from: Position, to: Position, board: Board): boolean {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== 'cannon') return false;

  // 检查目标位置3×3范围内是否有将帅
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const checkRow = to.row + dr;
      const checkCol = to.col + dc;
      if (isValidPosition(checkRow, checkCol)) {
        const target = board[checkRow][checkCol];
        if (target && target.type === 'king') {
          return false;
        }
      }
    }
  }

  return true;
}

export function executeSelfDestruct(to: Position, gameState: GameState): GameState {
  const newBoard = gameState.board.map(row => [...row]);
  const capturedPieces = { ...gameState.capturedPieces };

  // 摧毁3×3范围内所有棋子
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = to.row + dr;
      const col = to.col + dc;
      if (isValidPosition(row, col)) {
        const target = newBoard[row][col];
        if (target) {
          capturedPieces[target.player].push(target);
          newBoard[row][col] = null;
        }
      }
    }
  }

  return {
    ...gameState,
    board: newBoard,
    capturedPieces
  };
}

// 骑兵 - 马跳上己方兵卒，合体
export function canUseCavalry(from: Position, to: Position, board: Board): boolean {
  const horse = board[from.row][from.col];
  const target = board[to.row][to.col];
  
  if (!horse || horse.type !== 'horse') return false;
  if (!target || target.player !== horse.player || target.type !== 'pawn') return false;

  // 检查是否是合法的马步（包括蹩马腿检查）
  const validMoves = getValidMoves(horse, from, board, false);
  return validMoves.some(m => m.row === to.row && m.col === to.col);
}

export function executeCavalry(to: Position, gameState: GameState): Board {
  const newBoard = gameState.board.map(row => [...row]);
  const piece = newBoard[to.row][to.col];
  
  if (piece) {
    piece.isCavalry = true;
  }
  return newBoard;
}

// 替死 - 士激活后不受九宫限制，可以代替将帅死亡
export function activateSacrifice(pos: Position, gameState: GameState): GameState {
  const newBoard = gameState.board.map(row => [...row]);
  const piece = newBoard[pos.row][pos.col];
  
  if (piece && piece.type === 'advisor') {
    piece.isSacrifice = true;
  }

  const newSacrificeAdvisors = { ...gameState.sacrificeAdvisors };
  newSacrificeAdvisors[gameState.currentPlayer] = pos;

  return {
    ...gameState,
    board: newBoard,
    sacrificeAdvisors: newSacrificeAdvisors,
    currentPlayer: gameState.currentPlayer === 'red' ? 'black' : 'red',
    selectedPiece: null
  };
}

// 不屈 - 复活上回合死亡的象
export function canUseResilience(gameState: GameState): boolean {
  const player = gameState.currentPlayer;
  const lastKillPos = gameState.lastKillPosition[player];
  
  if (!lastKillPos || gameState.resilienceUsed[player]) return false;

  // 检查死亡位置是否被占据
  const occupant = gameState.board[lastKillPos.row][lastKillPos.col];
  if (!occupant) return false;

  // 不能摧毁将帅
  if (occupant.type === 'king') return false;

  // 检查上回合是否有象死亡
  const lastCaptured = gameState.capturedPieces[player];
  if (lastCaptured.length === 0) return false;

  const lastPiece = lastCaptured[lastCaptured.length - 1];
  return lastPiece.type === 'elephant';
}

export function executeResilience(gameState: GameState): GameState {
  const player = gameState.currentPlayer;
  const lastKillPos = gameState.lastKillPosition[player];
  
  if (!lastKillPos) return gameState;

  const newBoard = gameState.board.map(row => [...row]);
  const capturedPieces = { ...gameState.capturedPieces };
  
  // 摧毁占据者
  const occupant = newBoard[lastKillPos.row][lastKillPos.col];
  if (occupant) {
    capturedPieces[occupant.player].push(occupant);
  }

  // 复活象
  const revivedElephant: Piece = {
    type: 'elephant',
    player: player,
    hasMoved: true
  };
  newBoard[lastKillPos.row][lastKillPos.col] = revivedElephant;

  // 从俘获列表中移除最后一个象
  capturedPieces[player] = capturedPieces[player].slice(0, -1);

  const newResilienceUsed = { ...gameState.resilienceUsed };
  newResilienceUsed[player] = true;

  return {
    ...gameState,
    board: newBoard,
    capturedPieces,
    resilienceUsed: newResilienceUsed,
    currentPlayer: player === 'red' ? 'black' : 'red',
    selectedPiece: null
  };
}

// 吞噬 - 兵吃掉敌方非兵棋子，全体己方兵获得该棋子的移动能力
export function canUseDevour(from: Position, to: Position, board: Board): boolean {
  const pawn = board[from.row][from.col];
  const target = board[to.row][to.col];
  
  if (!pawn || pawn.type !== 'pawn') return false;
  if (!target || target.player === pawn.player || target.type === 'pawn') return false;

  // 检查是否是合法的兵移动
  const validMoves = getValidMoves(pawn, from, board, false);
  return validMoves.some(m => m.row === to.row && m.col === to.col);
}

export function executeDevour(targetPiece: Piece, gameState: GameState): GameState {
  const newDevouredAbilities = { ...gameState.devouredAbilities };
  newDevouredAbilities[gameState.currentPlayer] = targetPiece.type;

  return {
    ...gameState,
    devouredAbilities: newDevouredAbilities
  };
}

// 获取吞噬后的兵的额外移动
export function getDevourMoves(
  from: Position,
  devouredType: import('./types').PieceType,
  player: Player,
  board: Board
): Position[] {
  const tempPiece: Piece = { type: devouredType, player };
  return getValidMoves(tempPiece, from, board, false);
}
