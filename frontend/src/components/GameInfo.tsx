import type { GameState } from '../types';

interface GameInfoProps {
  gameState: GameState;
}

export function GameInfo({ gameState }: GameInfoProps) {
  // ✅ FIX: Use playerNumber directly from gameState
  const amIPlayer1 = gameState.playerNumber === 'player1';
  const isMyTurn = gameState.myTurn;

  return (
    <div className="game-info">
      <h2 className="game-title">Game Status</h2>
      
      <div className="players-container">
        {/* Player 1 Card */}
        <div className={`player-card ${amIPlayer1 && isMyTurn ? 'active' : ''}`}>
          <div className="player-disc player1"></div>
          <div className="player-details">
            <span className="player-name">
              {amIPlayer1 ? 'You' : gameState.opponent}
            </span>
            {amIPlayer1 && isMyTurn && gameState.status === 'active' && (
              <span className="turn-badge">Your Turn</span>
            )}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        {/* Player 2 Card */}
        <div className={`player-card ${!amIPlayer1 && isMyTurn ? 'active' : ''}`}>
          <div className="player-disc player2"></div>
          <div className="player-details">
            <span className="player-name">
              {!amIPlayer1 ? 'You' : gameState.opponent}
            </span>
            {!amIPlayer1 && isMyTurn && gameState.status === 'active' && (
              <span className="turn-badge">Your Turn</span>
            )}
          </div>
        </div>
      </div>

      {/* Game Result */}
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

      {/* Waiting Message */}
      {gameState.status === 'active' && !isMyTurn && (
        <div className="waiting-message">
          <div className="loading-spinner"></div>
          <span>Waiting for {gameState.opponent}...</span>
        </div>
      )}
    </div>
  );
}