import { useState, useEffect, useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { Leaderboard } from './components/LeaderBoard';
import { getSocket, connectSocket, disconnectSocket } from './services/socket';
import type { GameState, CellValue, Position } from './types';
import './App.css';

type AppState = 'login' | 'searching' | 'matched' | 'playing';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastMove, setLastMove] = useState<Position | undefined>();
  const [error, setError] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<number>(3);
  const [matchedOpponent, setMatchedOpponent] = useState<string>('');

  const isProcessingMove = useRef(false);

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

    socket.on('match_found', (data) => {
      console.log('🎉 Match found!', data);
      setMatchedOpponent(data.opponent);
      setAppState('matched');
    });

    socket.on('join_room', (roomId: string) => {
      console.log('🚪 Joining room:', roomId);
      // Socket automatically joins room on backend
    });

    socket.on('game_found', (data) => {
      console.log('🎮 Game found!', data);

      const board: CellValue[][] = Array(6)
        .fill(null)
        .map(() => Array(7).fill('empty'));

      const myPlayerNumber = data.playerNumber;
      const isMyTurn = data.currentTurn === myPlayerNumber;

      console.log(`👤 I am ${myPlayerNumber}, Current turn: ${data.currentTurn}, My turn: ${isMyTurn}`);

      setGameState({
        gameId: data.gameId,
        playerId: data.playerId,
        playerNumber: myPlayerNumber,
        opponent: data.opponent,
        isVsBot: data.isVsBot,
        board,
        currentTurn: data.currentTurn,
        myTurn: isMyTurn,
        status: 'active',
        winner: null,
        isDraw: false,
      });
      setAppState('playing');
      setLastMove(undefined);
      setSelectedColumn(3);
      isProcessingMove.current = false;
    });

    socket.on('move_made', (data) => {
      console.log('📥 Move made:', data);

      isProcessingMove.current = false;

      setGameState((prev) => {
        if (!prev) return null;

        const nextTurn = data.nextTurn;
        const isMyTurn = nextTurn === prev.playerNumber;

        console.log(`🎯 Next turn: ${nextTurn}, My player: ${prev.playerNumber}, My turn: ${isMyTurn}`);

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
      console.log('🏁 Game over:', data);

      isProcessingMove.current = false;

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

    socket.on('opponent_disconnected', () => {
      setError('Opponent disconnected. Waiting for reconnection...');
    });

    socket.on('game_rejoined', (data) => {
      console.log('🔄 Rejoined game:', data);

      setGameState((prev) => {
        if (!prev) return null;

        const myPlayerNumber = data.playerNumber;
        const isMyTurn = data.currentTurn === myPlayerNumber;

        return {
          ...prev,
          board: data.board,
          currentTurn: data.currentTurn,
          myTurn: isMyTurn,
          playerNumber: myPlayerNumber,
        };
      });
      isProcessingMove.current = false;
    });

    socket.on('error', (data: { message: string }) => {
      console.error('❌ Error from server:', data);
      setError(data.message);

      isProcessingMove.current = false;

      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('waiting_for_opponent');
      socket.off('match_found');
      socket.off('join_room');
      socket.off('game_found');
      socket.off('move_made');
      socket.off('game_over');
      socket.off('opponent_disconnected');
      socket.off('game_rejoined');
      socket.off('error');
    };
  }, []);

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

    console.log('🔌 Connecting to socket...');
    connectSocket();
    
    // Wait for connection before emitting
    const socket = getSocket();
    
    if (socket.connected) {
      console.log('✅ Already connected, emitting find_match');
      // CRITICAL FIX: Send as JSON string for Go backend
      socket.emit('find_match', JSON.stringify({ username: username.trim() }));
    } else {
      console.log('⏳ Waiting for connection...');
      socket.once('connect', () => {
        console.log('✅ Connected! Now emitting find_match');
        // CRITICAL FIX: Send as JSON string for Go backend
        socket.emit('find_match', JSON.stringify({ username: username.trim() }));
      });
    }
  };

  const handleColumnClick = (col: number) => {
    if (isProcessingMove.current) {
      console.log('⚠️ Already processing a move, please wait...');
      return;
    }

    if (!gameState || !gameState.myTurn || gameState.status !== 'active') {
      console.log('❌ Cannot make move - not your turn or game not active');
      return;
    }

    if (gameState.board[0][col] !== 'empty') {
      console.log('❌ Column is full');
      return;
    }

    isProcessingMove.current = true;
    console.log(`🎯 Making move at column ${col}`);

    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, myTurn: false };
    });

    const socket = getSocket();
    // CRITICAL FIX: Send as JSON string for Go backend
    socket.emit('make_move', JSON.stringify({ 
      gameId: gameState.gameId, 
      column: col 
    }));
  };

  const handlePlayAgain = () => {
    setGameState(null);
    setLastMove(undefined);
    setAppState('login');
    setSelectedColumn(3);
    setMatchedOpponent('');
    isProcessingMove.current = false;
    disconnectSocket();
  };

  if (appState === 'login') {
    return (
      <div className="app">
        <div className="container">
          <div className="login-section">
            <div className="login-card">
              <h1 className="main-title">
                <img src="/logo.png" alt="Connect 4" className="game-logo-img" />
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

  if (appState === 'matched') {
    return (
      <div className="app">
        <div className="container">
          <div className="matched-card">
            <div className="match-animation">🎉</div>
            <h2>Match Found!</h2>
            <p className="opponent-name">
              vs <strong>{matchedOpponent}</strong>
            </p>
            <p className="sub-text">Get ready to play...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

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
                disabled={!gameState.myTurn || gameState.status !== 'active' || isProcessingMove.current}
                lastMove={lastMove}
                selectedColumn={selectedColumn}
              />
              {gameState.myTurn && gameState.status === 'active' && !isProcessingMove.current && (
                <div className="keyboard-hint">
                  Use ← → arrows to move, Enter/Space to drop
                </div>
              )}
              {isProcessingMove.current && (
                <div className="processing-hint">
                  Processing move...
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