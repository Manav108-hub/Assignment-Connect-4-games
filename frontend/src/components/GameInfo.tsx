import type { GameState } from '../types';

interface GameInfoProps {
  gameState: GameState;
}

export function GameInfo({ gameState }: GameInfoProps) {
  const isMyTurn = gameState.myTurn;
  const amIPlayer1 = gameState.currentTurn === 'player1' ? isMyTurn : !isMyTurn;

  return (
    <div className="game-info">
      <h2 className="game-title">Game Status</h2>
      
      <div className="players-container">
        <div className={`player-card ${amIPlayer1 && isMyTurn ? 'active' : ''}`}>
          <div className="player-disc player1"></div>
          <div className="player-details">
            <span className="player-name">{amIPlayer1 ? 'You' : gameState.opponent}</span>
            {amIPlayer1 && isMyTurn && <span className="turn-badge"> : Your Turn</span>}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className={`player-card ${!amIPlayer1 && isMyTurn ? 'active' : ''}`}>
          <div className="player-disc player2"></div>
          <div className="player-details">
            <span className="player-name">{!amIPlayer1 ? 'You' : gameState.opponent}</span>
            {!amIPlayer1 && isMyTurn && <span className="turn-badge">Your Turn</span>}
          </div>
        </div>
      </div>

      {gameState.status === 'finished' && (
        <div className="game-result">
          {gameState.isDraw ? (
            <div className="result-message draw">
              <span className="result-icon">🤝</span>
              <span>It's a Draw!</span>
            </div>
          ) : gameState.winner === gameState.playerId ? (
            <div className="result-message win">
              <span className="result-icon">🎉</span>
              <span>You Won!</span>
            </div>
          ) : (
            <div className="result-message lose">
              <span className="result-icon">😔</span>
              <span>You Lost!</span>
            </div>
          )}
        </div>
      )}

      {gameState.status === 'active' && !isMyTurn && (
        <div className="waiting-message">
          <div className="loading-spinner"></div>
          <span>Waiting for {gameState.opponent}...</span>
        </div>
      )}
    </div>
  );
}