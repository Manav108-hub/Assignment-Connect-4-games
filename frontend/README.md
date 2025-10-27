# 🎮 Connect Four - Frontend

A real-time, multiplayer **Connect Four** game built with **React
(Vite + TypeScript)** and **Socket.IO**.\
Enjoy smooth animations, glowing effects, and a modern, responsive
design.

## 🚀 Quick Setup

``` bash
# 1. Clone the repo and go to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001

# 4. Start the app
npm run dev
```

Then open 👉 **http://localhost:5173**

------------------------------------------------------------------------

## 🎯 Game Overview

-   Two players compete to connect **4 discs** horizontally, vertically,
    or diagonally.\
-   Use **← → arrow keys** or **click** to select columns.\
-   Press **Enter** or **Space** to drop your disc.\
-   The first to connect 4 wins!\
-   Wait too long? You'll play against a **bot**.

------------------------------------------------------------------------

## 🧩 Features

-   ⚡ Real-time multiplayer with Socket.IO\
-   🎨 Beautiful custom design (no Tailwind)\
-   🔵 Live move indicator + hover preview\
-   💡 Bot fallback when no opponent found\
-   🏆 Leaderboard tracking wins/losses\
-   💻 Fully responsive design

------------------------------------------------------------------------

## 🛠️ Tech Stack

-   **Vite + React + TypeScript**
-   **Socket.IO Client**
-   **Custom CSS Animations**
-   **Responsive Layout**

------------------------------------------------------------------------

## 💻 Scripts

  Command             Description
  ------------------- --------------------------
  `npm run dev`       Start development server
  `npm run build`     Build for production
  `npm run preview`   Preview production build

------------------------------------------------------------------------

## 📂 Main Structure

    src/
    ├── components/   # GameBoard, GameInfo, Leaderboard
    ├── services/     # Socket + API utilities
    ├── types/        # Shared types
    ├── App.tsx       # Main app logic
    ├── App.css       # Complete styling
    └── main.tsx      # Entry point

------------------------------------------------------------------------

## 🏁 Gameplay Tips

-   🔁 Move quickly! Turns alternate instantly.\
-   🧠 Think diagonally --- the bot does!\
-   💬 Errors appear in the red banner above the board.

------------------------------------------------------------------------

## 💖 Credits

Made with ❤️ using **React + TypeScript + Socket.IO**\
by Manav Adwani
