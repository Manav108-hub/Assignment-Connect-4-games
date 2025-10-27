# 🎮 Connect Four - Full Stack Game

A complete real-time **Connect Four** game with a multiplayer backend
and modern animated frontend.

------------------------------------------------------------------------

## 🚀 Overview

This project includes:

-   🧠 **Backend** --- Handles matchmaking, gameplay logic, AI bot, and
    analytics using Kafka & PostgreSQL\
-   🎨 **Frontend** --- Interactive Connect Four game with
    keyboard/mouse controls, animations, and leaderboard

------------------------------------------------------------------------

## ⚙️ Tech Stack

### 🧩 Backend

-   **Runtime:** Node.js (TypeScript)
-   **Framework:** Express.js
-   **Real-time:** Socket.IO
-   **Database:** PostgreSQL + Prisma ORM
-   **Queue:** Apache Kafka (for analytics)
-   **Logger:** Winston

### 💻 Frontend

-   **Framework:** React (Vite + TypeScript)
-   **Real-time:** Socket.IO Client
-   **Styling:** Custom CSS with animations
-   **Design:** Fully responsive, no Tailwind conflicts

------------------------------------------------------------------------

## 🧱 Folder Structure

    project-root/
    ├── backend/
    │   ├── src/
    │   │   ├── config/          # DB, Kafka, env configs
    │   │   ├── models/          # TypeScript models
    │   │   ├── services/        # Game, bot, matchmaking, analytics
    │   │   ├── websocket/       # Socket.IO event handling
    │   │   ├── controllers/     # HTTP endpoints
    │   │   └── routes/          # Express routes
    │   ├── prisma/              # Prisma schema
    │   └── package.json
    │
    └── frontend/
        ├── src/
        │   ├── components/      # GameBoard, GameInfo, Leaderboard
        │   ├── services/        # Socket + API utilities
        │   ├── types/           # Shared types
        │   ├── App.tsx          # Main app
        │   ├── App.css          # Styling
        │   └── main.tsx         # Entry point
        └── package.json

------------------------------------------------------------------------

## ⚙️ Setup Instructions

### 🧠 Backend Setup

``` bash
cd backend

# 1️⃣ Install dependencies
npm install

# 2️⃣ Setup environment variables
cat > .env << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/connectfour"
KAFKA_BROKER="localhost:9092"
PORT=3001
EOF

# 3️⃣ Setup database
npx prisma migrate dev --name init

# 4️⃣ Start server
npm run dev
```

Backend will start at 👉 **http://localhost:3001**

------------------------------------------------------------------------

### 💻 Frontend Setup

``` bash
cd frontend

# 1️⃣ Install dependencies
npm install

# 2️⃣ Add .env
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
EOF

# 3️⃣ Run app
npm run dev
```

Frontend runs at 👉 **http://localhost:5173**

------------------------------------------------------------------------

## 🎮 Gameplay

-   Two players compete to connect **4 discs** horizontally, vertically,
    or diagonally.\
-   Use **← →** arrow keys or click columns to move.\
-   Press **Enter / Space** to drop your disc.\
-   Wait **10 seconds**, and you'll face the **bot**.\
-   If you disconnect, reconnect within **30 seconds** to resume!

------------------------------------------------------------------------

## 🧠 Features

  -----------------------------------------------------------------------
  Category                         Highlights
  -------------------------------- --------------------------------------
  🎯 **Game**                      Real-time multiplayer + AI Bot

  ⚙️ **Backend**                   Kafka-based analytics, auto
                                   matchmaking, reconnects

  💾 **Database**                  PostgreSQL with Prisma ORM

  💻 **Frontend**                  Custom UI, smooth animations,
                                   arrow/hover placement

  🧩 **Design**                    Responsive + modern card layout

  🏆 **Leaderboard**               Tracks wins, losses, draws
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 🖥️ Scripts

  Command                    Description
  -------------------------- --------------------------
  `npm run dev`              Start development server
  `npm run build`            Build for production
  `npm run start`            Start production build
  `npx prisma migrate dev`   Run DB migrations

------------------------------------------------------------------------

## 💡 Tips

-   Keep backend running before starting frontend.\
-   Ensure PostgreSQL and Kafka services are active.\
-   Use two browsers to test multiplayer.\
-   For bot mode, wait 10 seconds after searching.

------------------------------------------------------------------------

## 🏁 Final Result

✅ **Frontend:** Beautiful UI with hover & keyboard control\
✅ **Backend:** Robust matchmaking + bot logic\
✅ **Database:** Persistent player stats\
✅ **Analytics:** Kafka integration\
✅ **Leaderboard:** Real-time updates

------------------------------------------------------------------------

## ❤️ Credits

Built with passion using **React, Node.js, TypeScript, Prisma, and
Kafka**\
by Manav Adwani
