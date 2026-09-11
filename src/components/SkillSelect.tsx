import { useState } from 'react';
import type { SkillType, Player, PieceType } from '../game/types';
import { SKILLS, ALL_SKILLS } from '../game/skills';
import * as sounds from '../utils/sounds';

interface SkillSelectProps {
  onComplete: (redSkill: SkillType, blackSkill: SkillType) => void;
}

export function SkillSelect({ onComplete }: SkillSelectProps) {
  const [redSkill, setRedSkill] = useState<SkillType | null>(null);
  const [blackSkill, setBlackSkill] = useState<SkillType | null>(null);
  const [currentSelector, setCurrentSelector] = useState<Player>('red');

  const handleSkillSelect = (skill: SkillType) => {
    sounds.playSelect();
    
    if (currentSelector === 'red') {
      setRedSkill(skill);
      setCurrentSelector('black');
    } else {
      setBlackSkill(skill);
    }
  };

  const handleStart = () => {
    if (redSkill && blackSkill) {
      sounds.playMove();
      onComplete(redSkill, blackSkill);
    }
  };

  const pieceTypeNames: Record<PieceType, string> = {
    chariot: '车',
    cannon: '炮',
    horse: '马',
    advisor: '士',
    elephant: '象',
    pawn: '兵',
    king: '将'
  };

  return (
    <div className="skill-select">
      <div className="skill-select-header">
        <h1>象棋·技能战</h1>
        <h2>技能选择</h2>
        <p className="instruction">
          {currentSelector === 'red' && !redSkill && '红方请选择一个技能'}
          {currentSelector === 'black' && !blackSkill && '黑方请选择一个技能'}
          {redSkill && blackSkill && '双方已选择完毕，准备开始对局'}
        </p>
      </div>

      <div className="skill-select-content">
        <div className="player-selection">
          <div className={`player-box ${currentSelector === 'red' ? 'active' : ''}`}>
            <h3>红方</h3>
            {redSkill ? (
              <div className="selected-skill">
                <div className="skill-name">{SKILLS[redSkill].name}</div>
                <div className="skill-piece">
                  {pieceTypeNames[SKILLS[redSkill].pieceType]}
                </div>
              </div>
            ) : (
              <div className="waiting">等待选择...</div>
            )}
          </div>

          <div className={`player-box ${currentSelector === 'black' ? 'active' : ''}`}>
            <h3>黑方</h3>
            {blackSkill ? (
              <div className="selected-skill">
                <div className="skill-name">{SKILLS[blackSkill].name}</div>
                <div className="skill-piece">
                  {pieceTypeNames[SKILLS[blackSkill].pieceType]}
                </div>
              </div>
            ) : (
              <div className="waiting">等待选择...</div>
            )}
          </div>
        </div>

        <div className="skills-grid">
          {ALL_SKILLS.map(skillId => {
            const skill = SKILLS[skillId];
            const isDisabled = 
              (currentSelector === 'red' && redSkill !== null) ||
              (currentSelector === 'black' && blackSkill !== null);

            return (
              <button
                key={skillId}
                className={`skill-card ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handleSkillSelect(skillId)}
                disabled={isDisabled}
              >
                <div className="skill-card-header">
                  <span className="skill-card-name">{skill.name}</span>
                  <span className="skill-card-piece">
                    {pieceTypeNames[skill.pieceType]}
                  </span>
                </div>
                <p className="skill-card-description">{skill.description}</p>
              </button>
            );
          })}
        </div>

        {redSkill && blackSkill && (
          <button className="btn-start" onClick={handleStart}>
            开始对局
          </button>
        )}
      </div>
    </div>
  );
}
