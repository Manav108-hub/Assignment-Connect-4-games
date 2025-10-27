import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { Leaderboard } from './components/LeaderBoard';
import { getSocket, connectSocket, disconnectSocket } from './services/socket';
import type { GameState, CellValue, Position } from './types';
import './App.css';

type AppState = 'login' | 'searching' | 'playing';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastMove, setLastMove] = useState<Position | undefined>();
  const [error, setError] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<number>(3); // Start at center column

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setError('');
    });

    socket.on('waiting_for_opponent', () => {
      console.log('⏳ Waiting for opponent...');
      setAppState('searching');
    });

    socket.on('game_found', (data) => {
      console.log('🎮 Game found!', data);
      
      const board: CellValue[][] = Array(6)
        .fill(null)
        .map(() => Array(7).fill('empty'));

      const amIPlayer1 = data.currentTurn === 'player1';
      
      setGameState({
        gameId: data.gameId,
        playerId: data.playerId,
        opponent: data.opponent,
        isVsBot: data.isVsBot,
        board,
        currentTurn: data.currentTurn,
        myTurn: amIPlayer1,
        status: 'active',
        winner: null,
        isDraw: false,
      });
      setAppState('playing');
      setLastMove(undefined);
      setSelectedColumn(3); // Reset to center
    });

    socket.on('move_made', (data) => {
      setGameState((prev) => {
        if (!prev) return null;

        const amIPlayer1 = prev.currentTurn === 'player1' ? prev.myTurn : !prev.myTurn;
        const nextTurn = data.player === 'player1' ? 'player2' : 'player1';
        const isMyTurn = amIPlayer1 ? nextTurn === 'player1' : nextTurn === 'player2';

        return {
          ...prev,
          board: data.board,
          currentTurn: nextTurn,
          myTurn: isMyTurn,
        };
      });
      setLastMove(data.position);
    });

    socket.on('game_over', (data) => {
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          board: data.board,
          status: 'finished',
          winner: data.winner || null,
          isDraw: data.isDraw || false,
        };
      });
    });

    socket.on('error', (data: { message: string }) => {
      console.error('❌ Error from server:', data);
      setError(data.message);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('waiting_for_opponent');
      socket.off('game_found');
      socket.off('move_made');
      socket.off('game_over');
      socket.off('error');
    };
  }, []);

  // KEYBOARD CONTROLS
  useEffect(() => {
    if (appState !== 'playing' || !gameState || !gameState.myTurn || gameState.status !== 'active') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedColumn(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedColumn(prev => Math.min(6, prev + 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleColumnClick(selectedColumn);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, gameState, selectedColumn]);

  const handleLogin = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    connectSocket();
    const socket = getSocket();
    socket.emit('find_match', { username: username.trim() });
  };

  const handleColumnClick = (col: number) => {
    if (!gameState || !gameState.myTurn || gameState.status !== 'active') {
      return;
    }

    // Check if column is full
    if (gameState.board[0][col] !== 'empty') {
      return;
    }

    const socket = getSocket();
    socket.emit('make_move', { gameId: gameState.gameId, column: col });
  };

  const handlePlayAgain = () => {
    setGameState(null);
    setLastMove(undefined);
    setAppState('login');
    setSelectedColumn(3);
    disconnectSocket();
  };

  // Login Screen
  if (appState === 'login') {
    return (
      <div className="app">
        <div className="container">
          <div className="login-section">
            <div className="login-card">
              <h1 className="main-title">
                <span className="game-icon">🎮</span>
                Connect Four
              </h1>
              
              <div className="login-form">
                <h2>Enter Your Name</h2>
                <input
                  type="text"
                  placeholder="Your username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  maxLength={20}
                  className="username-input"
                />
                {error && <div className="error-message">{error}</div>}
                
                <button
                  onClick={handleLogin}
                  disabled={!username.trim()}
                  className="play-button"
                >
                  Find Match
                </button>

                <div className="how-to-play">
                  <h3>How to Play</h3>
                  <ul>
                    <li>Use ← → arrow keys to move</li>
                    <li>Press Enter/Space to drop disc</li>
                    <li>Or click columns to drop disc</li>
                    <li>Connect 4 discs to win!</li>
                  </ul>
                </div>
              </div>
            </div>

            <Leaderboard />
          </div>
        </div>
      </div>
    );
  }

  // Searching Screen
  if (appState === 'searching') {
    return (
      <div className="app">
        <div className="container">
          <div className="searching-card">
            <div className="loading-spinner large"></div>
            <h2>Finding Opponent...</h2>
            <p>Searching for another player...</p>
            <p className="sub-text">If no one joins in 10 seconds, you'll play against a bot</p>
            <button onClick={handlePlayAgain} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing Screen
  if (appState === 'playing' && gameState) {
    return (
      <div className="app">
        <div className="container">
          <header className="game-header">
            <h1 className="game-logo">
              <span className="game-icon">🎮</span>
              Connect Four
            </h1>
            <button onClick={handlePlayAgain} className="leave-button">
              Leave Game
            </button>
          </header>

          {error && <div className="error-banner">{error}</div>}

          <div className="game-container">
            <div className="game-area">
              <GameBoard
                board={gameState.board}
                onColumnClick={handleColumnClick}
                disabled={!gameState.myTurn || gameState.status !== 'active'}
                lastMove={lastMove}
                selectedColumn={selectedColumn}
              />
              {gameState.myTurn && gameState.status === 'active' && (
                <div className="keyboard-hint">
                  Use ← → arrows to move, Enter/Space to drop
                </div>
              )}
            </div>

            <div className="sidebar">
              <GameInfo gameState={gameState} />

              {gameState.status === 'finished' && (
                <button onClick={handlePlayAgain} className="play-again-button">
                  Play Again
                </button>
              )}

              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;