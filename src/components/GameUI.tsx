import React from 'react';
import { Board } from './Board';
import type { GameState, Position, SkillType, Player, Piece } from '../game/types';
import { createInitialBoard, getPieceDisplay } from '../game/board';
import { getValidMoves, isCheckmate, isKingInCheck, hasLegalMoves } from '../game/rules';
import { 
  SKILLS,
  canUseLaserBeam,
  executeLaserBeam,
  canUseSelfDestruct,
  executeSelfDestruct,
  canUseCavalry,
  executeCavalry,
  activateSacrifice,
  canUseResilience,
  executeResilience,
  canUseDevour,
  executeDevour,
  getDevourMoves
} from '../game/skills';
import * as sounds from '../utils/sounds';

interface GameUIProps {
  selectedSkills: { red: SkillType; black: SkillType };
  onBackToTitle: () => void;
}

type SkillActivationMode = 'none' | 'laser_beam' | 'self_destruct' | 'cavalry' | 'sacrifice' | 'resilience' | 'devour';

export function GameUI({ selectedSkills, onBackToTitle }: GameUIProps) {
  const [gameState, setGameState] = React.useState<GameState>({
    board: createInitialBoard(),
    currentPlayer: 'red',
    selectedPiece: null,
    gameOver: false,
    winner: null,
    selectedSkills,
    skillsUsed: { red: false, black: false },
    lastMove: null,
    capturedPieces: { red: [], black: [] },
    mergedCavalry: [],
    sacrificeAdvisors: { red: null, black: null },
    devouredAbilities: { red: null, black: null },
    lastKillPosition: { red: null, black: null },
    resilienceUsed: { red: false, black: false }
  });

  const [skillMode, setSkillMode] = React.useState<SkillActivationMode>('none');

  const handleSquareClick = (pos: Position) => {
    if (gameState.gameOver) return;

    const clickedPiece = gameState.board[pos.row][pos.col];
    const currentSkill = gameState.selectedSkills[gameState.currentPlayer];

    // 激光波模式：点击自己的车来发射激光
    if (skillMode === 'laser_beam') {
      if (clickedPiece && 
          clickedPiece.player === gameState.currentPlayer && 
          clickedPiece.type === 'chariot' &&
          canUseLaserBeam(pos, gameState.board)) {
        const newState = executeLaserBeam(pos, gameState);
        
        if (isKingInCheck(newState.board, gameState.currentPlayer)) {
          sounds.playSelect();
          return;
        }
        
        const updatedState = {
          ...newState,
          skillsUsed: {
            ...newState.skillsUsed,
            [gameState.currentPlayer]: true
          }
        };
        setGameState(updatedState);
        setSkillMode('none');
        sounds.playSkill();
        checkGameEnd(updatedState);
      }
      return;
    }

    // 替死模式：点击自己的士来激活
    if (skillMode === 'sacrifice') {
      if (clickedPiece && 
          clickedPiece.player === gameState.currentPlayer && 
          clickedPiece.type === 'advisor') {
        const newState = activateSacrifice(pos, gameState);
        const updatedState = {
          ...newState,
          skillsUsed: {
            ...newState.skillsUsed,
            [gameState.currentPlayer]: true
          }
        };
        setGameState(updatedState);
        setSkillMode('none');
        sounds.playSkill();
        checkGameEnd(updatedState);
      }
      return;
    }

    // 常规移动逻辑
    if (gameState.selectedPiece) {
      const selectedPiece = gameState.board[gameState.selectedPiece.row][gameState.selectedPiece.col];
      
      if (!selectedPiece) {
        setGameState(prev => ({ ...prev, selectedPiece: null }));
        setSkillMode('none');
        return;
      }

      // 获取合法移动
      let validMoves = getValidMoves(selectedPiece, gameState.selectedPiece, gameState.board);

      // 骑兵模式：只允许移动到己方兵的位置
      if (skillMode === 'cavalry' && currentSkill === 'cavalry') {
        validMoves = validMoves.filter(m => {
          const target = gameState.board[m.row][m.col];
          return target && target.player === gameState.currentPlayer && target.type === 'pawn';
        });
      }

      // 吞噬模式：只允许吃子，且目标必须是敌方非兵
      if (skillMode === 'devour' && currentSkill === 'devour') {
        validMoves = validMoves.filter(m => {
          const target = gameState.board[m.row][m.col];
          return target && target.player !== gameState.currentPlayer && target.type !== 'pawn';
        });
      }

      // 自焚模式：炮的正常移动
      // （自焚在移动后触发，这里不需要特殊处理移动规则）

      // 骑兵单位的额外移动
      if (selectedPiece.isCavalry) {
        const horsePos = gameState.selectedPiece;
        const horseMoves = getHorseMoves(horsePos, gameState.board, selectedPiece.player);
        validMoves = [...validMoves, ...horseMoves];
      }

      // 吞噬后的兵的额外移动
      const devouredType = gameState.devouredAbilities[gameState.currentPlayer];
      if (selectedPiece.type === 'pawn' && devouredType !== null && skillMode !== 'devour') {
        const extraMoves = getDevourMoves(gameState.selectedPiece, devouredType, gameState.currentPlayer, gameState.board);
        validMoves = [...validMoves, ...extraMoves];
      }

      // 替死士不受九宫限制
      if (selectedPiece.type === 'advisor' && selectedPiece.isSacrifice) {
        validMoves = getAdvisorFreeMoves(gameState.selectedPiece, gameState.board, selectedPiece.player);
      }

      const isValidMove = validMoves.some(m => m.row === pos.row && m.col === pos.col);

      if (isValidMove) {
        executeMove(gameState.selectedPiece, pos, selectedPiece);
      } else if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
        setGameState(prev => ({ ...prev, selectedPiece: pos }));
        sounds.playSelect();
      } else {
        setGameState(prev => ({ ...prev, selectedPiece: null }));
        setSkillMode('none');
      }
    } else if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
      setGameState(prev => ({ ...prev, selectedPiece: pos }));
      sounds.playSelect();
    }
  };

  const executeMove = (from: Position, to: Position, piece: Piece) => {
    const newBoard = gameState.board.map(row => [...row]);
    const capturedPiece = newBoard[to.row][to.col];
    const currentSkill = gameState.selectedSkills[gameState.currentPlayer];
    
    let newState = { ...gameState };

    // 骑兵合体
    if (skillMode === 'cavalry' && currentSkill === 'cavalry' && canUseCavalry(from, to, gameState.board)) {
      newBoard[from.row][from.col] = null;
      const updatedBoard = executeCavalry(to, { ...gameState, board: newBoard });
      newState.board = updatedBoard;
      newState.currentPlayer = gameState.currentPlayer === 'red' ? 'black' : 'red';
      newState.selectedPiece = null;
      newState.skillsUsed = {
        ...gameState.skillsUsed,
        [gameState.currentPlayer]: true
      };
      setGameState(newState);
      setSkillMode('none');
      sounds.playSkill();
      checkGameEnd(newState);
      return;
    }

    // 处理替死逻辑
    if (capturedPiece && capturedPiece.type === 'king') {
      const defenderPlayer = capturedPiece.player;
      const sacrificePos = gameState.sacrificeAdvisors[defenderPlayer];
      
      if (sacrificePos) {
        const sacrificeAdvisor = gameState.board[sacrificePos.row][sacrificePos.col];
        if (sacrificeAdvisor && sacrificeAdvisor.type === 'advisor' && sacrificeAdvisor.isSacrifice) {
          // 替死：敌人移动到士的位置，吃掉士，将帅存活
          newBoard[sacrificePos.row][sacrificePos.col] = piece;
          newBoard[from.row][from.col] = null;
          
          const newCapturedPieces = { ...gameState.capturedPieces };
          newCapturedPieces[defenderPlayer].push(sacrificeAdvisor);
          
          const newSacrificeAdvisors = { ...gameState.sacrificeAdvisors };
          newSacrificeAdvisors[defenderPlayer] = null;
          
          const nextPlayer: Player = gameState.currentPlayer === 'red' ? 'black' : 'red';
          
          newState = {
            ...gameState,
            board: newBoard,
            capturedPieces: newCapturedPieces,
            sacrificeAdvisors: newSacrificeAdvisors,
            currentPlayer: nextPlayer,
            selectedPiece: null,
            lastMove: { from, to: sacrificePos }
          };
          
          setGameState(newState);
          setSkillMode('none');
          sounds.playCapture();
          sounds.playSkill();
          checkGameEnd(newState);
          return;
        }
      }
    }

    // 正常移动
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = null;

    const newCapturedPieces = { ...gameState.capturedPieces };
    const newLastKillPosition = { ...gameState.lastKillPosition };

    if (capturedPiece) {
      newCapturedPieces[capturedPiece.player].push(capturedPiece);
      newLastKillPosition[capturedPiece.player] = to;
      sounds.playCapture();

      // 吞噬效果
      if (skillMode === 'devour' && currentSkill === 'devour' && canUseDevour(from, to, gameState.board)) {
        newState = executeDevour(capturedPiece, { ...gameState, board: newBoard, capturedPieces: newCapturedPieces });
        newState.skillsUsed = {
          ...gameState.skillsUsed,
          [gameState.currentPlayer]: true
        };
        sounds.playSkill();
      }
    } else {
      sounds.playMove();
    }

    newState.board = newBoard;
    newState.capturedPieces = newCapturedPieces;
    newState.lastKillPosition = newLastKillPosition;
    newState.lastMove = { from, to };
    newState.selectedPiece = null;

    // 自焚效果
    if (skillMode === 'self_destruct' && currentSkill === 'self_destruct' && canUseSelfDestruct(from, to, gameState.board)) {
      newState = executeSelfDestruct(to, newState);
      newState.skillsUsed = {
        ...gameState.skillsUsed,
        [gameState.currentPlayer]: true
      };
      sounds.playSkill();
    }

    const nextPlayer: Player = gameState.currentPlayer === 'red' ? 'black' : 'red';
    newState.currentPlayer = nextPlayer;

    const inCheck = isKingInCheck(newState.board, nextPlayer);
    if (inCheck) {
      sounds.playCheck();
    }

    setGameState(newState);
    setSkillMode('none');
    checkGameEnd(newState);
  };

  const checkGameEnd = (state: GameState) => {
    const redKing = findKingInState(state.board, 'red');
    const blackKing = findKingInState(state.board, 'black');
    
    if (!redKing) {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: 'black'
      }));
      setTimeout(() => sounds.playWin(), 300);
      return;
    }
    
    if (!blackKing) {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: 'red'
      }));
      setTimeout(() => sounds.playWin(), 300);
      return;
    }
    
    const inCheckmate = isCheckmate(state.board, state.currentPlayer);
    const noMoves = !hasLegalMoves(state.board, state.currentPlayer);

    if (inCheckmate || noMoves) {
      const winner = state.currentPlayer === 'red' ? 'black' : 'red';
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner
      }));
      setTimeout(() => sounds.playWin(), 300);
    }
  };
  
  function findKingInState(board: (Piece | null)[][], player: Player): Position | null {
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

  const handleSkillActivate = (skill: SkillType) => {
    const currentSkill = gameState.selectedSkills[gameState.currentPlayer];
    if (skill !== currentSkill) return;
    
    if (gameState.skillsUsed[gameState.currentPlayer]) return;

    if (skill === 'laser_beam') {
      setSkillMode('laser_beam');
      setGameState(prev => ({ ...prev, selectedPiece: null }));
      sounds.playSelect();
    } else if (skill === 'self_destruct') {
      setSkillMode('self_destruct');
      sounds.playSelect();
    } else if (skill === 'cavalry') {
      setSkillMode('cavalry');
      sounds.playSelect();
    } else if (skill === 'sacrifice') {
      setSkillMode('sacrifice');
      setGameState(prev => ({ ...prev, selectedPiece: null }));
      sounds.playSelect();
    } else if (skill === 'resilience') {
      if (canUseResilience(gameState)) {
        const newState = executeResilience(gameState);
        
        if (isKingInCheck(newState.board, gameState.currentPlayer)) {
          sounds.playSelect();
          return;
        }
        
        const updatedState = {
          ...newState,
          skillsUsed: {
            ...newState.skillsUsed,
            [gameState.currentPlayer]: true
          }
        };
        setGameState(updatedState);
        sounds.playSkill();
        checkGameEnd(updatedState);
      }
    } else if (skill === 'devour') {
      setSkillMode('devour');
      sounds.playSelect();
    }
  };

  const handleReset = () => {
    setGameState({
      board: createInitialBoard(),
      currentPlayer: 'red',
      selectedPiece: null,
      gameOver: false,
      winner: null,
      selectedSkills,
      skillsUsed: { red: false, black: false },
      lastMove: null,
      capturedPieces: { red: [], black: [] },
      mergedCavalry: [],
      sacrificeAdvisors: { red: null, black: null },
      devouredAbilities: { red: null, black: null },
      lastKillPosition: { red: null, black: null },
      resilienceUsed: { red: false, black: false }
    });
    setSkillMode('none');
  };

  const currentSkill = gameState.selectedSkills[gameState.currentPlayer];
  const skill = currentSkill ? SKILLS[currentSkill] : null;

  const canUseCurrentSkill = () => {
    if (!currentSkill) return false;
    if (gameState.skillsUsed[gameState.currentPlayer]) return false;
    
    if (currentSkill === 'laser_beam') {
      return true;
    } else if (currentSkill === 'self_destruct') {
      return gameState.selectedPiece !== null;
    } else if (currentSkill === 'cavalry') {
      return gameState.selectedPiece !== null;
    } else if (currentSkill === 'sacrifice') {
      return true;
    } else if (currentSkill === 'resilience') {
      return canUseResilience(gameState);
    } else if (currentSkill === 'devour') {
      return gameState.selectedPiece !== null;
    }
    return false;
  };

  return (
    <div className="game-ui">
      <div className="game-header">
        <h1>象棋·技能战</h1>
        <button className="btn-back" onClick={onBackToTitle}>返回</button>
      </div>

      <div className="game-content">
        <div className="side-panel left-panel">
          <div className="player-info">
            <h2 className={gameState.currentPlayer === 'black' ? 'active' : ''}>
              黑方
            </h2>
            {gameState.selectedSkills.black && (
              <div className="skill-display">
                <div className="skill-name">{SKILLS[gameState.selectedSkills.black].name}</div>
                <div className="skill-piece-type">
                  {getPieceTypeName(SKILLS[gameState.selectedSkills.black].pieceType)}
                </div>
              </div>
            )}
          </div>
          
          <div className="captured-pieces">
            <h3>俘获棋子</h3>
            <div className="captured-list">
              {gameState.capturedPieces.black.map((piece, i) => (
                <span key={i} className="captured-piece">
                  {getPieceDisplay(piece)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Board
          board={gameState.board}
          selectedPiece={gameState.selectedPiece}
          onSquareClick={handleSquareClick}
          currentPlayer={gameState.currentPlayer}
          lastMove={gameState.lastMove}
          sacrificeAdvisors={gameState.sacrificeAdvisors}
        />

        <div className="side-panel right-panel">
          <div className="player-info">
            <h2 className={gameState.currentPlayer === 'red' ? 'active' : ''}>
              红方
            </h2>
            {gameState.selectedSkills.red && (
              <div className="skill-display">
                <div className="skill-name">{SKILLS[gameState.selectedSkills.red].name}</div>
                <div className="skill-piece-type">
                  {getPieceTypeName(SKILLS[gameState.selectedSkills.red].pieceType)}
                </div>
              </div>
            )}
          </div>

          <div className="captured-pieces">
            <h3>俘获棋子</h3>
            <div className="captured-list">
              {gameState.capturedPieces.red.map((piece, i) => (
                <span key={i} className="captured-piece">
                  {getPieceDisplay(piece)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="skill-control">
        {currentSkill && skill && (
          <>
            <button 
              className={`btn-skill ${skillMode === currentSkill ? 'active' : ''} ${!canUseCurrentSkill() ? 'disabled' : ''}`}
              onClick={() => canUseCurrentSkill() && handleSkillActivate(currentSkill)}
              disabled={!canUseCurrentSkill()}
            >
              使用技能：{skill.name}
              {gameState.skillsUsed[gameState.currentPlayer] && ' (已使用)'}
              {!gameState.skillsUsed[gameState.currentPlayer] && skillMode === currentSkill && ' (已激活)'}
            </button>
            <p className="skill-hint">{getSkillHint()}</p>
          </>
        )}
      </div>

      {gameState.gameOver && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>游戏结束</h2>
            {gameState.winner ? (
              <p className="winner-text">
                {gameState.winner === 'red' ? '红方' : '黑方'}获胜！
              </p>
            ) : (
              <p>和棋</p>
            )}
            <button className="btn-primary" onClick={handleReset}>
              再来一局
            </button>
            <button className="btn-secondary" onClick={onBackToTitle}>
              返回主菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function getSkillHint(): string {
    if (gameState.skillsUsed[gameState.currentPlayer]) {
      return '你的技能已经使用过了,每局只能使用一次';
    }
    
    if (currentSkill === 'laser_beam') {
      if (skillMode === 'laser_beam') {
        return '请点击一辆己方车来发射激光波';
      }
      return '点击按钮激活,然后选择一辆车发射激光波';
    } else if (currentSkill === 'self_destruct') {
      if (!gameState.selectedPiece) {
        return '先选择一个己方炮,然后激活技能进行自焚移动';
      }
      if (skillMode === 'self_destruct') {
        return '移动炮并吃子,将引发3×3自焚';
      }
      return '点击按钮激活自焚模式,炮移动后将引发爆炸';
    } else if (currentSkill === 'cavalry') {
      if (!gameState.selectedPiece) {
        return '先选择一匹己方马,然后激活技能跳上己方兵';
      }
      if (skillMode === 'cavalry') {
        return '选择一个己方兵的位置合体成骑兵';
      }
      return '点击按钮激活,马跳上己方兵合体';
    } else if (currentSkill === 'sacrifice') {
      if (skillMode === 'sacrifice') {
        return '请点击一个己方士激活替死';
      }
      return '点击按钮激活,选择一个士作为替死';
    } else if (currentSkill === 'resilience') {
      if (!canUseResilience(gameState)) {
        return '上回合没有己方象死亡,或已使用过';
      }
      return '点击按钮复活上回合死亡的象';
    } else if (currentSkill === 'devour') {
      if (!gameState.selectedPiece) {
        return '先选择一个己方兵,然后激活技能吃掉敌方非兵棋子';
      }
      if (skillMode === 'devour') {
        return '用兵吃掉一个敌方非兵棋子,获得其移动能力';
      }
      return '点击按钮激活,兵吃掉敌方非兵棋子获得能力';
    }
    return '';
  }
}

function getPieceTypeName(type: string): string {
  const names: Record<string, string> = {
    chariot: '车',
    cannon: '炮',
    horse: '马',
    advisor: '士',
    elephant: '象',
    pawn: '兵',
    king: '将'
  };
  return names[type] || type;
}

function getHorseMoves(from: Position, board: (Piece | null)[][], player: Player): Position[] {
  const moves: Position[] = [];
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
        if (!target || target.player !== player) {
          moves.push(to);
        }
      }
    }
  }

  return moves;
}

function getAdvisorFreeMoves(from: Position, board: (Piece | null)[][], player: Player): Position[] {
  const moves: Position[] = [];
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [dr, dc] of diagonals) {
    const to = { row: from.row + dr, col: from.col + dc };
    if (isValidPosition(to.row, to.col)) {
      const target = board[to.row][to.col];
      if (!target || target.player !== player) {
        moves.push(to);
      }
    }
  }

  return moves;
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
}
