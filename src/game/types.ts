export type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'pawn';
export type Player = 'red' | 'black';
export type Position = { row: number; col: number };

export interface Piece {
  type: PieceType;
  player: Player;
  hasMoved?: boolean;
  isCavalry?: boolean;
  isSacrifice?: boolean;
  hasRiverCrossed?: boolean;
}

export type Board = (Piece | null)[][];

export interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedPiece: Position | null;
  gameOver: boolean;
  winner: Player | null;
  selectedSkills: SkillSelection;
  skillsUsed: { red: boolean; black: boolean };
  lastMove: { from: Position; to: Position } | null;
  capturedPieces: {
    red: Piece[];
    black: Piece[];
  };
  mergedCavalry: Position[];
  sacrificeAdvisors: { red: Position | null; black: Position | null };
  devouredAbilities: { red: PieceType | null; black: PieceType | null };
  lastKillPosition: { red: Position | null; black: Position | null };
  resilienceUsed: { red: boolean; black: boolean };
}

export type SkillType = 
  | 'laser_beam'        // 车：激光波
  | 'self_destruct'     // 炮：自焚
  | 'cavalry'           // 马：骑兵
  | 'sacrifice'         // 士：替死
  | 'resilience'        // 象：不屈
  | 'devour';           // 兵：吞噬

export interface Skill {
  id: SkillType;
  name: string;
  description: string;
  pieceType: PieceType;
}

export interface SkillSelection {
  red: SkillType | null;
  black: SkillType | null;
}

export interface Move {
  from: Position;
  to: Position;
  isCapture: boolean;
  skill?: SkillType;
}
