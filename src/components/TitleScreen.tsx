import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const [showRules, setShowRules] = React.useState(false);

  return (
    <div className="title-screen">
      <div className="title-content">
        <h1 className="game-title">象棋·技能战</h1>
        <p className="subtitle">Chinese Chess with Special Skills</p>
        
        <div className="title-buttons">
          <button className="btn-primary" onClick={onStart}>
            开始游戏
          </button>
          <button className="btn-secondary" onClick={() => setShowRules(!showRules)}>
            {showRules ? '关闭规则' : '游戏规则'}
          </button>
        </div>

        {showRules && (
          <div className="rules-panel">
            <h2>游戏规则</h2>
            <div className="rules-content">
              <section>
                <h3>基本规则</h3>
                <p>遵循传统中国象棋规则：棋盘 9×10，包含楚河汉界和九宫。</p>
                <p>将军不能直接对视，不能让己方将军处于被将军状态。</p>
              </section>
              
              <section>
                <h3>技能系统</h3>
                <p>每方拥有 <strong>3 点技能点数</strong>，使用技能消耗点数。</p>
                <p>点击棋子后，如有可用技能会显示技能按钮。</p>
              </section>

              <section>
                <h3>特殊技能</h3>
                <ul>
                  <li><strong>车·冲锋</strong>：穿透一个敌方棋子继续移动</li>
                  <li><strong>马·踏浪</strong>：忽略蹩马腿，自由跳跃</li>
                  <li><strong>炮·连环</strong>：吃子后可在缩短射程内再次开炮</li>
                  <li><strong>兵·过河突袭</strong>：过河后可横向移动两格或前进两格</li>
                  <li><strong>象·护城</strong>：保护相邻友军免受一次吃子</li>
                  <li><strong>士·换位</strong>：与己方将帅交换位置（每局一次）</li>
                  <li><strong>将·御驾</strong>：在九宫内传送（每局一次）</li>
                </ul>
              </section>

              <section>
                <h3>胜利条件</h3>
                <p>将死对方将帅获胜。</p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
