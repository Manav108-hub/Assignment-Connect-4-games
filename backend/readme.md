# 🎮 Connect Four - Backend

A real-time multiplayer Connect Four game backend built with Node.js, TypeScript, Socket.IO, PostgreSQL, and Kafka.

## 📋 Features

- ✅ Real-time 1v1 multiplayer gameplay
- 🤖 Competitive AI bot with strategic decision-making
- ⚡ Automatic matchmaking (10-second timeout)
- 🔄 Player reconnection support (30-second window)
- 📊 Kafka-based analytics tracking
- 🏆 Persistent leaderboard
- 🎯 Production-ready architecture

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Message Queue**: Apache Kafka
- **Logging**: Winston

## 📁 Project Structure

```
src/
├── config/          # Configuration files (DB, Kafka, env)
├── models/          # TypeScript types and interfaces
├── services/        # Business logic (game, bot, matchmaking, analytics)
├── controllers/     # HTTP request handlers
├── websocket/       # Socket.IO event handlers
├── routes/          # API routes
├── consumers/       # Kafka consumers
├── utils/           # Utility functions (logger, validation)
└── app.ts           # Application entry point
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Apache Kafka (optional for analytics)
- Docker (optional, for easier setup)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd connect-four-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/connectfour
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=connect-four-game
KAFKA_GROUP_ID=analytics-group
MATCHMAKING_TIMEOUT=10000
RECONNECT_TIMEOUT=30000
```

4. **Set up PostgreSQL**

Option A - Using Docker:
```bash
docker run --name postgres-connectfour \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=connectfour \
  -p 5432:5432 \
  -d postgres:14
```

Option B - Local installation:
Create a database named `connectfour` in your PostgreSQL instance.

5. **Run Prisma migrations**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

6. **Set up Kafka (Optional)**

Using Docker:
```bash
# Start Zookeeper
docker run -d --name zookeeper \
  -p 2181:2181 \
  zookeeper:3.7

# Start Kafka
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka:latest
```

**Note**: Kafka is optional. The app will work without it, but analytics events won't be tracked.

7. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 🏗️ Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### HTTP REST API

- `GET /health` - Health check endpoint
- `GET /api/leaderboard` - Get top 100 players
- `GET /api/leaderboard/player/:username` - Get specific player stats

### WebSocket Events

**Client → Server**

- `find_match` - Join matchmaking queue
  ```typescript
  { username: string }
  ```

- `make_move` - Make a move in the game
  ```typescript
  { gameId: string, column: number }
  ```

- `rejoin_game` - Reconnect to an active game
  ```typescript
  { gameId: string, playerId: string }
  ```

**Server → Client**

- `waiting_for_opponent` - Waiting in matchmaking queue

- `game_found` - Match found, game starting
  ```typescript
  {
    gameId: string,
    playerId: string,
    opponent: string,
    isVsBot: boolean,
    currentTurn: 'player1' | 'player2'
  }
  ```

- `move_made` - A move was made
  ```typescript
  {
    position: { row: number, col: number },
    player: 'player1' | 'player2',
    board: CellValue[][]
  }
  ```

- `game_over` - Game ended
  ```typescript
  {
    winner?: string,
    isDraw?: boolean,
    board: CellValue[][]
  }
  ```

- `opponent_disconnected` - Opponent lost connection

- `game_rejoined` - Successfully reconnected to game

- `error` - Error occurred
  ```typescript
  { message: string }
  ```

## 🤖 Bot Strategy

The bot uses a priority-based decision system:

1. **Win** - If bot can win in one move, take it
2. **Block** - If opponent can win in one move, block them
3. **Create opportunities** - Make moves that create 3-in-a-row
4. **Strategic positioning** - Prefer center columns
5. **Valid moves** - Choose nearest to center as fallback

## 📊 Analytics Events (Kafka)

Events published to `game-analytics` topic:

- `game_started` - New game begins
- `game_ended` - Game completed
- `move_made` - Player makes a move
- `player_disconnected` - Player loses connection
- `player_reconnected` - Player reconnects

The analytics consumer tracks:
- Total games played
- Average game duration
- Games per hour/day
- Player win counts
- Total moves made

## 🗄️ Database Schema

### Player
```prisma
model Player {
  id        String   @id @default(uuid())
  username  String   @unique
  wins      Int      @default(0)
  losses    Int      @default(0)
  draws     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Game
```prisma
model Game {
  id          String   @id @default(uuid())
  player1Id   String
  player2Id   String
  winnerId    String?
  status      String
  board       String
  duration    Int?
  isVsBot     Boolean  @default(false)
  createdAt   DateTime @default(now())
  completedAt DateTime?
}
```

## 🔧 Configuration

Key configuration options in `src/config/env.ts`:

- `matchmakingTimeout`: Time to wait for opponent before matching with bot (default: 10000ms)
- `reconnectTimeout`: Time allowed for player to reconnect (default: 30000ms)
- `game.rows`: Board height (default: 6)
- `game.cols`: Board width (default: 7)

## 🐛 Troubleshooting

### Database connection fails
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `CREATE DATABASE connectfour;`

### Kafka connection fails
- Kafka is optional; app runs without it
- Verify Kafka and Zookeeper are running
- Check `KAFKA_BROKER` in `.env`

### Port already in use
- Change `PORT` in `.env`
- Kill process using port: `lsof -ti:3001 | xargs kill -9`

## 📝 Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

## 🧪 Testing the API

Using curl:

```bash
# Health check
curl http://localhost:3001/health

# Get leaderboard
curl http://localhost:3001/api/leaderboard

# Get player stats
curl http://localhost:3001/api/leaderboard/player/johndoe
```

Using Socket.IO client (JavaScript):

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.emit('find_match', { username: 'player1' });

socket.on('game_found', (data) => {
  console.log('Game found!', data);
});

socket.on('move_made', (data) => {
  console.log('Move made:', data);
});
```

## 🚀 Deployment

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t connect-four-backend .
docker run -p 3001:3001 --env-file .env connect-four-backend
```

### Deploy to Cloud Platforms

- **Heroku**: Add `Procfile` with `web: npm start`
- **Railway**: Connect GitHub repo, set environment variables
- **AWS ECS/EC2**: Use Docker image
- **DigitalOcean App Platform**: Deploy from GitHub

**Remember to**:
- Set all environment variables
- Use managed PostgreSQL service
- Configure CORS for your frontend domain
- Set up Kafka cluster (AWS MSK, Confluent Cloud, etc.)

## 📚 Next Steps

Now that the backend is ready, you can:
1. Build the React frontend with shadcn/ui
2. Connect frontend to WebSocket endpoints
3. Implement game UI with 7x6 grid
4. Add sound effects and animations
5. Deploy both frontend and backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes!

---

**Built with ❤️ using TypeScript, Socket.IO, and PostgreSQL**