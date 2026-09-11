import { useState } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { SkillSelect } from './components/SkillSelect';
import { GameUI } from './components/GameUI';
import type { SkillType } from './game/types';
import './App.css';

type AppPhase = 'title' | 'skill-select' | 'game';

function App() {
  const [phase, setPhase] = useState<AppPhase>('title');
  const [selectedSkills, setSelectedSkills] = useState<{ red: SkillType | null; black: SkillType | null }>({
    red: null,
    black: null
  });

  const handleStartFromTitle = () => {
    setPhase('skill-select');
  };

  const handleSkillsSelected = (redSkill: SkillType, blackSkill: SkillType) => {
    setSelectedSkills({ red: redSkill, black: blackSkill });
    setPhase('game');
  };

  const handleBackToTitle = () => {
    setPhase('title');
    setSelectedSkills({ red: null, black: null });
  };

  return (
    <div className="app">
      {phase === 'title' && (
        <TitleScreen onStart={handleStartFromTitle} />
      )}
      {phase === 'skill-select' && (
        <SkillSelect onComplete={handleSkillsSelected} />
      )}
      {phase === 'game' && selectedSkills.red && selectedSkills.black && (
        <GameUI 
          selectedSkills={selectedSkills as { red: SkillType; black: SkillType }} 
          onBackToTitle={handleBackToTitle}
        />
      )}
    </div>
  );
}

export default App;
