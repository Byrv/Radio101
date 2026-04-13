# Radio101 — Execution Playbook

> **Every single tool call, file edit, terminal command, test, and verification step.**
> This is the exact sequence of operations that will be executed to build Radio101 from scratch.

---

## Table of Contents

1. [Phase 1 — Backend Foundation](#phase-1--backend-foundation)
2. [Phase 2 — Frontend Foundation](#phase-2--frontend-foundation)
3. [Phase 3 — Streaming Core (Backend)](#phase-3--streaming-core-backend)
4. [Phase 4 — DJ Dashboard (Frontend)](#phase-4--dj-dashboard-frontend)
5. [Phase 5 — Listener Page (Frontend)](#phase-5--listener-page-frontend)
6. [Phase 6 — Now Playing & Song Metadata](#phase-6--now-playing--song-metadata)
7. [Phase 7 — Premium UI & Polish](#phase-7--premium-ui--polish)
8. [Phase 8 — Hardening & Security](#phase-8--hardening--security)
9. [Phase 9 — Testing Suite](#phase-9--testing-suite)
10. [Phase 10 — Production Build & Deployment](#phase-10--production-build--deployment)

---

## Legend

| Icon | Meaning |
|---|---|
| 🔧 `run_command` | Terminal command execution |
| 📄 `write_to_file` | Create a new file |
| ✏️ `replace_file_content` | Edit an existing file |
| ✏️✏️ `multi_replace_file_content` | Edit multiple locations in a file |
| 👁️ `view_file` | Read/inspect a file |
| 🔍 `grep_search` | Search codebase for a pattern |
| 🌐 `read_url_content` | Fetch content from a URL |
| 🖥️ `browser_subagent` | Browser interaction (visual testing) |
| 📋 `command_status` | Check running command output |
| ✅ **TEST** | A test that will be executed |
| 📝 **EXPECTED** | Expected output/result |

---

# Phase 1 — Backend Foundation

> **Goal:** Initialize the Express.js backend with Socket.IO, config, and project scaffolding.

---

### Step 1.1 — Initialize backend `package.json`

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npm init -y
WaitMsBeforeAsync: 5000
SafeToAutoRun: true
```

📝 **EXPECTED:** Creates `backend/package.json` with default values.

---

### Step 1.2 — Install backend dependencies

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npm install express socket.io cors dotenv node-fetch
WaitMsBeforeAsync: 500
SafeToAutoRun: false
```

📝 **EXPECTED:** Installs 5 packages. `node_modules/` created, `package-lock.json` generated.

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 60
```

---

### Step 1.3 — Install backend dev dependencies

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npm install --save-dev nodemon jest
WaitMsBeforeAsync: 500
SafeToAutoRun: false
```

📝 **EXPECTED:** Installs nodemon (auto-restart) and jest (testing).

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 60
```

---

### Step 1.4 — Create backend `.env.example`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\.env.example
```

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DJ_SECRET=change-me-to-a-secret-passphrase
```

---

### Step 1.5 — Create backend `.env` (actual)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\.env
```

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DJ_SECRET=radio101-dj-secret-dev
```

---

### Step 1.6 — Create `src/config/index.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\config\index.js
```

```js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  djSecret: process.env.DJ_SECRET || 'default-secret',
};
```

---

### Step 1.7 — Create `src/server.js` (Express + Socket.IO entry)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\server.js
```

```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const nowPlayingRouter = require('./routes/nowPlaying');
const { initStreamHandler } = require('./socket/streamHandler');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

// REST routes
app.use('/api', nowPlayingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.frontendOrigin,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1MB max for audio chunks
});

// Initialize socket handlers
initStreamHandler(io);

// Start
server.listen(config.port, () => {
  console.log(`🎵 Radio101 backend running on port ${config.port}`);
});

module.exports = { app, server, io };
```

---

### Step 1.8 — Create placeholder `src/routes/nowPlaying.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\routes\nowPlaying.js
```

```js
const express = require('express');
const router = express.Router();

// In-memory state (will be populated by socket handler)
let currentState = {
  live: false,
  title: null,
  artist: null,
  album: null,
  albumArt: null,
  songUrl: null,
  listenerCount: 0,
};

// Getter/setter for shared state
const getState = () => currentState;
const setState = (newState) => {
  currentState = { ...currentState, ...newState };
};

// GET /api/now-playing
router.get('/now-playing', (req, res) => {
  res.json(getState());
});

module.exports = router;
module.exports.getState = getState;
module.exports.setState = setState;
```

---

### Step 1.9 — Create placeholder `src/socket/streamHandler.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\socket\streamHandler.js
```

```js
const config = require('../config');
const { setState, getState } = require('../routes/nowPlaying');

let listenerCount = 0;
let djSocketId = null;

function initStreamHandler(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // --- DJ Events ---

    socket.on('dj:start', ({ djSecret }) => {
      if (djSecret !== config.djSecret) {
        socket.emit('error', { message: 'Invalid DJ secret' });
        return;
      }
      djSocketId = socket.id;
      setState({ live: true });
      io.to('radio').emit('stream:status', {
        live: true,
        listenerCount,
      });
      console.log('🎙️ DJ started broadcasting');
    });

    socket.on('dj:audio-chunk', (chunk) => {
      if (socket.id !== djSocketId) return;
      socket.to('radio').emit('stream:audio-chunk', chunk);
    });

    socket.on('dj:now-playing', async ({ title, artist }) => {
      if (socket.id !== djSocketId) return;
      // Will be enhanced with musicLookup in Phase 6
      const metadata = { title, artist, album: null, albumArt: null, songUrl: null };
      setState(metadata);
      io.to('radio').emit('stream:now-playing', metadata);
      console.log(`🎵 Now playing: ${artist} - ${title}`);
    });

    socket.on('dj:stop', () => {
      if (socket.id !== djSocketId) return;
      djSocketId = null;
      setState({ live: false, title: null, artist: null, album: null, albumArt: null, songUrl: null });
      io.to('radio').emit('stream:status', { live: false, listenerCount });
      console.log('🛑 DJ stopped broadcasting');
    });

    // --- Listener Events ---

    socket.on('listener:join', () => {
      socket.join('radio');
      listenerCount++;
      socket.emit('stream:now-playing', getState());
      socket.emit('stream:status', { live: getState().live, listenerCount });
      io.to('radio').emit('stream:status', { live: getState().live, listenerCount });
      console.log(`👤 Listener joined. Count: ${listenerCount}`);
    });

    socket.on('disconnect', () => {
      if (socket.id === djSocketId) {
        djSocketId = null;
        setState({ live: false });
        io.to('radio').emit('stream:status', { live: false, listenerCount });
        console.log('🎙️ DJ disconnected');
      }
      if (socket.rooms && socket.rooms.has('radio')) {
        listenerCount = Math.max(0, listenerCount - 1);
        io.to('radio').emit('stream:status', { live: getState().live, listenerCount });
      }
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initStreamHandler };
```

---

### Step 1.10 — Add npm scripts to `package.json`

**Tool:** 👁️ `view_file`
```
AbsolutePath: c:\Users\bhyra\OneDrive\Documents\radio101\backend\package.json
```

**Tool:** ✏️ `replace_file_content`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\package.json
```

Replace the `"scripts"` block with:
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest --verbose"
},
"type": "commonjs",
```

---

### Step 1.11 — Create `.gitignore` for backend

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\.gitignore
```

```
node_modules/
.env
```

---

### ✅ TEST 1.1 — Backend starts without errors

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npm run dev
WaitMsBeforeAsync: 3000
SafeToAutoRun: true
```

📝 **EXPECTED OUTPUT:**
```
🎵 Radio101 backend running on port 3001
```

**Tool:** 📋 `command_status` — Verify server started.

---

### ✅ TEST 1.2 — Health check endpoint responds

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: curl http://localhost:3001/health
WaitMsBeforeAsync: 5000
SafeToAutoRun: true
```

📝 **EXPECTED OUTPUT:**
```json
{"status":"ok","uptime":...}
```

---

### ✅ TEST 1.3 — Now-playing endpoint returns default state

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: curl http://localhost:3001/api/now-playing
WaitMsBeforeAsync: 5000
SafeToAutoRun: true
```

📝 **EXPECTED OUTPUT:**
```json
{"live":false,"title":null,"artist":null,"album":null,"albumArt":null,"songUrl":null,"listenerCount":0}
```

**After tests pass:** 🔧 `send_command_input` → Terminate the dev server.

---

# Phase 2 — Frontend Foundation

> **Goal:** Initialize the Next.js frontend app with App Router, global styles, and Socket.IO client.

---

### Step 2.1 — Check `create-next-app` options

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101
CommandLine: npx -y create-next-app@latest --help
WaitMsBeforeAsync: 10000
SafeToAutoRun: true
```

📝 **EXPECTED:** List of flags including `--js`, `--app`, `--no-tailwind`, `--src-dir`, etc.

---

### Step 2.2 — Initialize Next.js project

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101
CommandLine: npx -y create-next-app@latest ./frontend --js --app --no-tailwind --no-eslint --no-src-dir --import-alias "@/*" --use-npm
WaitMsBeforeAsync: 500
SafeToAutoRun: false
```

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 120
```

📝 **EXPECTED:** Next.js app created in `frontend/` with App Router, JavaScript (not TypeScript), no Tailwind.

---

### Step 2.3 — Install Socket.IO client

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\frontend
CommandLine: npm install socket.io-client
WaitMsBeforeAsync: 500
SafeToAutoRun: false
```

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 60
```

---

### Step 2.4 — Create `.env.local`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\.env.local
```

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_DJ_SECRET=radio101-dj-secret-dev
```

---

### Step 2.5 — Create `lib/socket.js` (Socket.IO singleton)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\lib\socket.js
```

```js
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}
```

---

### Step 2.6 — Create `hooks/useSocket.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\hooks\useSocket.js
```

```js
'use client';
import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
```

---

### Step 2.7 — Create `hooks/useAudioStream.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\hooks\useAudioStream.js
```

```js
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export function useAudioStream(socket) {
  const audioRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const queueRef = useRef([]);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  // Initialize MediaSource
  useEffect(() => {
    if (!socket || !audioRef.current) return;

    const audio = audioRef.current;
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    audio.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      try {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/webm;codecs=opus');
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener('updateend', () => {
          // Process queue
          if (queueRef.current.length > 0 && !sourceBuffer.updating) {
            const next = queueRef.current.shift();
            sourceBuffer.appendBuffer(next);
          }

          // Auto-cleanup: remove buffered data older than 30s
          if (sourceBuffer.buffered.length > 0) {
            const currentTime = audio.currentTime;
            const start = sourceBuffer.buffered.start(0);
            if (currentTime - start > 30) {
              sourceBuffer.remove(start, currentTime - 10);
            }
          }
        });

        setIsBuffering(false);
      } catch (e) {
        console.error('Failed to create SourceBuffer:', e);
      }
    });

    // Listen for audio chunks
    const handleChunk = (chunk) => {
      const buffer = chunk instanceof ArrayBuffer ? chunk : chunk.buffer || new Uint8Array(chunk).buffer;

      if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
        try {
          sourceBufferRef.current.appendBuffer(buffer);
        } catch (e) {
          console.error('Error appending buffer:', e);
        }
      } else {
        queueRef.current.push(buffer);
        // Limit queue size to prevent memory bloat
        if (queueRef.current.length > 50) {
          queueRef.current.shift();
        }
      }
    };

    socket.on('stream:audio-chunk', handleChunk);

    return () => {
      socket.off('stream:audio-chunk', handleChunk);
      if (mediaSource.readyState === 'open') {
        mediaSource.endOfStream();
      }
      URL.revokeObjectURL(audio.src);
    };
  }, [socket]);

  // Create AudioContext + AnalyserNode for visualizer
  const initAnalyser = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return null;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    return analyser;
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      initAnalyser();
    } catch (e) {
      console.error('Play failed:', e);
    }
  }, [initAnalyser]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  return {
    audioRef,
    isPlaying,
    isBuffering,
    play,
    pause,
    analyserNode: analyserRef.current,
    initAnalyser,
  };
}
```

---

### Step 2.8 — Update `next.config.js` for backend proxy (optional)

**Tool:** 👁️ `view_file`
```
AbsolutePath: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\next.config.js
```

**Tool:** ✏️ `replace_file_content` — No change needed if we use `NEXT_PUBLIC_BACKEND_URL` directly.

---

### ✅ TEST 2.1 — Frontend builds and starts

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\frontend
CommandLine: npm run dev
WaitMsBeforeAsync: 5000
SafeToAutoRun: true
```

📝 **EXPECTED:**
```
▲ Next.js 14.x
- Local: http://localhost:3000
✓ Ready in Xs
```

**Tool:** 🖥️ `browser_subagent`
```
Task: Navigate to http://localhost:3000. Verify the default Next.js page loads without errors.
       Check the browser console for any errors. Return which page content is visible.
RecordingName: frontend_initial_load
```

📝 **EXPECTED:** Default Next.js welcome page renders with no console errors.

**After test:** 🔧 `send_command_input` → Terminate the dev server.

---

# Phase 3 — Streaming Core (Backend)

> **Goal:** Finalize the Socket.IO stream handler with proper room management, DJ auth, and chunk relay.

---

### Step 3.1 — Verify `streamHandler.js` is complete

**Tool:** 👁️ `view_file`
```
AbsolutePath: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\socket\streamHandler.js
```

📝 Already created in Step 1.9. Verify contents match the specification.

---

### Step 3.2 — Fix listener disconnect tracking

**Tool:** ✏️ `replace_file_content`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\socket\streamHandler.js
```

Replace the `disconnect` handler with an improved version that tracks listeners using a `Set` instead of relying on `socket.rooms` (which is cleared before the `disconnect` event fires):

```js
// Track listeners with a Set instead of socket.rooms
const listeners = new Set();

// In 'listener:join':
listeners.add(socket.id);

// In 'disconnect':
if (listeners.has(socket.id)) {
  listeners.delete(socket.id);
  listenerCount = listeners.size;
}
```

**Full rewrite of `streamHandler.js` via** ✏️✏️ `multi_replace_file_content`:

Chunk 1 — Add `listeners` Set at module scope:
```
TargetContent: "let listenerCount = 0;"
ReplacementContent: "let listenerCount = 0;\nconst listeners = new Set();"
```

Chunk 2 — Update `listener:join` to use Set:
```
TargetContent: "socket.join('radio');\n      listenerCount++;"
ReplacementContent: "socket.join('radio');\n      listeners.add(socket.id);\n      listenerCount = listeners.size;"
```

Chunk 3 — Update `disconnect` to use Set:
```
TargetContent: "if (socket.rooms && socket.rooms.has('radio')) {\n        listenerCount = Math.max(0, listenerCount - 1);"
ReplacementContent: "if (listeners.has(socket.id)) {\n        listeners.delete(socket.id);\n        listenerCount = listeners.size;"
```

---

### Step 3.3 — Create `src/services/musicLookup.js` (placeholder)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\services\musicLookup.js
```

```js
// Placeholder — will be fully implemented in Phase 6
async function lookupSong(title, artist) {
  return {
    title: title || 'Unknown',
    artist: artist || 'Unknown',
    album: null,
    albumArt: null,
    songUrl: null,
    source: null,
  };
}

module.exports = { lookupSong };
```

---

### ✅ TEST 3.1 — Socket.IO connection test (manual)

**Precondition:** Backend dev server running on port 3001.

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npm run dev
WaitMsBeforeAsync: 3000
SafeToAutoRun: true
```

**Tool:** 🖥️ `browser_subagent`
```
Task: Open the browser console on a blank page. Run the following JavaScript to test Socket.IO:
  const socket = io('http://localhost:3001');
  socket.on('connect', () => console.log('Connected:', socket.id));
  socket.emit('listener:join');
  socket.on('stream:status', (data) => console.log('Status:', data));

  Verify:
  1. 'Connected:' log appears with a socket ID
  2. 'Status:' log shows { live: false, listenerCount: 1 }
  Return exact console output.
RecordingName: socket_connection_test
```

📝 **EXPECTED CONSOLE:**
```
Connected: abc123
Status: { live: false, listenerCount: 1 }
```

📝 **EXPECTED SERVER LOG:**
```
🔌 Connected: abc123
👤 Listener joined. Count: 1
```

**After test:** 🔧 `send_command_input` → Terminate the dev server.

---

# Phase 4 — DJ Dashboard (Frontend)

> **Goal:** Create the `/dj` page with Chrome tab audio capture, MediaRecorder, and Socket.IO streaming.

---

### Step 4.1 — Create `components/DJControls.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\components\DJControls.js
```

**Content — Full component (~120 lines):**

```js
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export default function DJControls({ socket, isConnected }) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastDuration, setBroadcastDuration] = useState(0);
  const [nowPlaying, setNowPlaying] = useState({ title: '', artist: '' });
  const [autoDetect, setAutoDetect] = useState(true);
  const [listenerCount, setListenerCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const autoDetectIntervalRef = useRef(null);

  // Listen for status updates
  useEffect(() => {
    if (!socket) return;
    const handleStatus = (data) => setListenerCount(data.listenerCount);
    socket.on('stream:status', handleStatus);
    return () => socket.off('stream:status', handleStatus);
  }, [socket]);

  // Auto-detect song from MediaSession API
  useEffect(() => {
    if (!autoDetect || !isBroadcasting) {
      clearInterval(autoDetectIntervalRef.current);
      return;
    }

    autoDetectIntervalRef.current = setInterval(() => {
      if (navigator.mediaSession && navigator.mediaSession.metadata) {
        const meta = navigator.mediaSession.metadata;
        const newTitle = meta.title || '';
        const newArtist = meta.artist || '';
        if (newTitle !== nowPlaying.title || newArtist !== nowPlaying.artist) {
          setNowPlaying({ title: newTitle, artist: newArtist });
          socket?.emit('dj:now-playing', { title: newTitle, artist: newArtist });
        }
      }
    }, 5000);

    return () => clearInterval(autoDetectIntervalRef.current);
  }, [autoDetect, isBroadcasting, socket, nowPlaying.title, nowPlaying.artist]);

  // Broadcast duration timer
  useEffect(() => {
    if (isBroadcasting) {
      timerRef.current = setInterval(() => {
        setBroadcastDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setBroadcastDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isBroadcasting]);

  const startBroadcast = useCallback(async () => {
    if (!socket || !isConnected) return;

    try {
      // Capture Chrome tab audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false, // We only want audio
      });
      streamRef.current = stream;

      // Authenticate as DJ
      const djSecret = process.env.NEXT_PUBLIC_DJ_SECRET;
      socket.emit('dj:start', { djSecret });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            socket.emit('dj:audio-chunk', buffer);
          });
        }
      };

      mediaRecorder.onstop = () => {
        setIsBroadcasting(false);
        socket.emit('dj:stop');
      };

      // Start recording — 250ms chunks
      mediaRecorder.start(250);
      setIsBroadcasting(true);

      // Handle stream ending (user clicks "Stop sharing" in browser UI)
      stream.getTracks().forEach((track) => {
        track.onended = () => stopBroadcast();
      });
    } catch (err) {
      console.error('Failed to start broadcast:', err);
      alert('Failed to start broadcasting. Make sure you select a tab with audio.');
    }
  }, [socket, isConnected]);

  const stopBroadcast = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsBroadcasting(false);
    socket?.emit('dj:stop');
  }, [socket]);

  const handleNowPlayingChange = (field, value) => {
    const updated = { ...nowPlaying, [field]: value };
    setNowPlaying(updated);
    if (!autoDetect) {
      socket?.emit('dj:now-playing', updated);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return { /* JSX rendered in dj/page.js */ };
  // NOTE: The actual JSX will be in the dj/page.js — this exports the logic
  // This will be refactored in Phase 4.2 to include full JSX
}
```

📝 **NOTE:** The above is a logic-first scaffold. Full JSX will be written in Step 4.2.

---

### Step 4.2 — Create `app/dj/page.js` (DJ Dashboard page)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\app\dj\page.js
```

**Content — Full page component (~200 lines):**

The DJ page will:
1. Import and use `useSocket` hook
2. Inline the DJControls logic (or import from component)
3. Render:
   - Connection status badge
   - Start/Stop Broadcasting button
   - Broadcast duration timer
   - Now Playing input fields (title + artist)
   - Auto-detect toggle
   - Listener count
   - Audio level indicator (via AnalyserNode on the captured stream)

**Key JSX Structure:**
```jsx
'use client';

export default function DJPage() {
  // ...all state and handlers from DJControls component...

  return (
    <div className="dj-dashboard">
      <header className="dj-header">
        <h1>Radio101 DJ Dashboard</h1>
        <span className="listener-badge">🎧 {listenerCount} online</span>
      </header>

      <section className="dj-status">
        <div className={`status-indicator ${isBroadcasting ? 'live' : 'offline'}`}>
          {isBroadcasting ? `🔴 LIVE (${formatDuration(broadcastDuration)})` : '⚫ Offline'}
        </div>
      </section>

      <section className="dj-controls">
        <button
          id="broadcast-toggle"
          className={`broadcast-btn ${isBroadcasting ? 'stop' : 'start'}`}
          onClick={isBroadcasting ? stopBroadcast : startBroadcast}
          disabled={!isConnected}
        >
          {isBroadcasting ? '⏹ Stop Broadcasting' : '▶ Start Broadcasting'}
        </button>
      </section>

      <section className="dj-now-playing">
        <h2>Now Playing</h2>
        <label>
          <input
            type="checkbox"
            checked={autoDetect}
            onChange={(e) => setAutoDetect(e.target.checked)}
          />
          Auto-detect from MediaSession
        </label>
        <input
          id="song-title-input"
          type="text"
          placeholder="Song title"
          value={nowPlaying.title}
          onChange={(e) => handleNowPlayingChange('title', e.target.value)}
          disabled={autoDetect}
        />
        <input
          id="song-artist-input"
          type="text"
          placeholder="Artist"
          value={nowPlaying.artist}
          onChange={(e) => handleNowPlayingChange('artist', e.target.value)}
          disabled={autoDetect}
        />
        <button
          id="send-now-playing"
          onClick={() => socket?.emit('dj:now-playing', nowPlaying)}
          disabled={autoDetect}
        >
          Update Now Playing
        </button>
      </section>

      <section className="dj-connection">
        <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        {isConnected ? 'Connected to server' : 'Disconnected'}
      </section>
    </div>
  );
}
```

---

### Step 4.3 — Create `components/DJControls.js` (final version with JSX)

**Tool:** ✏️ `replace_file_content` or 📄 `write_to_file` (Overwrite: true)
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\components\DJControls.js
Overwrite: true
```

Refactor so `DJControls` is a self-contained component receiving `{ socket, isConnected }` as props and rendering full JSX.

---

### ✅ TEST 4.1 — DJ Dashboard renders at /dj

**Precondition:** Both backend (3001) and frontend (3000) dev servers running.

**Tool:** 🔧 `run_command` (start backend)
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npm run dev
WaitMsBeforeAsync: 3000
```

**Tool:** 🔧 `run_command` (start frontend)
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\frontend
CommandLine: npm run dev
WaitMsBeforeAsync: 5000
```

**Tool:** 🖥️ `browser_subagent`
```
Task: Navigate to http://localhost:3000/dj. Verify:
  1. The page renders without errors
  2. "Radio101 DJ Dashboard" heading is visible
  3. "Start Broadcasting" button is present
  4. Title and Artist input fields are visible
  5. Connection status shows "Connected to server" (green dot)
  6. No console errors
  Take a screenshot and return findings.
RecordingName: dj_dashboard_render
```

📝 **EXPECTED:** DJ dashboard renders with all UI elements. Socket connects to backend (console shows "🔌 Connected").

---

### ✅ TEST 4.2 — DJ can start/stop broadcasting

**Tool:** 🖥️ `browser_subagent`
```
Task: On http://localhost:3000/dj:
  1. Click "Start Broadcasting" button
  2. When the screen/tab sharing dialog appears, select the Chrome tab playing audio (or "Entire Screen")
  3. Verify the button changes to "Stop Broadcasting"
  4. Verify the status shows "🔴 LIVE"
  5. Verify the timer starts counting
  6. Click "Stop Broadcasting"
  7. Verify the status returns to "⚫ Offline"
  Return findings.
RecordingName: dj_broadcast_test
```

📝 **EXPECTED:** Broadcasting starts and stops cleanly. Server logs show `🎙️ DJ started broadcasting` and `🛑 DJ stopped broadcasting`.

**After tests:** Terminate both dev servers.

---

# Phase 5 — Listener Page (Frontend)

> **Goal:** Create the main listener page with audio playback, now-playing display, and visualizer.

---

### Step 5.1 — Create `components/AudioPlayer.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\components\AudioPlayer.js
```

```js
'use client';
import { useRef, useState } from 'react';

export default function AudioPlayer({ audioRef, isPlaying, play, pause, isBuffering }) {
  const [volume, setVolume] = useState(1);

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="audio-player" id="audio-player">
      <audio ref={audioRef} />

      <button
        id="play-pause-btn"
        className="play-btn"
        onClick={togglePlay}
        disabled={isBuffering}
      >
        {isBuffering ? '⏳' : isPlaying ? '⏸' : '▶'}
      </button>

      <div className="volume-control">
        <span className="volume-icon">
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </span>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
}
```

---

### Step 5.2 — Create `components/NowPlaying.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\components\NowPlaying.js
```

```js
'use client';

export default function NowPlaying({ songData }) {
  if (!songData || !songData.title) {
    return (
      <div className="now-playing" id="now-playing">
        <div className="album-art-placeholder">
          <div className="no-song-icon">🎵</div>
        </div>
        <p className="now-playing-empty">Waiting for the DJ to start playing...</p>
      </div>
    );
  }

  return (
    <div className="now-playing" id="now-playing">
      <div className="album-art-container">
        {songData.albumArt ? (
          <img
            src={songData.albumArt}
            alt={`${songData.title} album art`}
            className="album-art"
            id="album-art-img"
          />
        ) : (
          <div className="album-art-placeholder">
            <div className="no-art-icon">🎵</div>
          </div>
        )}
      </div>

      <div className="song-info">
        <h2 className="song-title" id="song-title">{songData.title}</h2>
        <p className="song-artist" id="song-artist">
          {songData.artist}
          {songData.album && <span className="song-album"> — {songData.album}</span>}
        </p>
        {songData.songUrl && (
          <a
            href={songData.songUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="song-link"
            id="song-external-link"
          >
            🔗 {songData.source === 'itunes' ? 'Listen on Apple Music' : 'Listen on Deezer'}
          </a>
        )}
      </div>
    </div>
  );
}
```

---

### Step 5.3 — Create `components/Visualizer.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\components\Visualizer.js
```

```js
'use client';
import { useRef, useEffect } from 'react';

export default function Visualizer({ analyserNode, isPlaying }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyserNode || !isPlaying || !canvasRef.current) {
      cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient from accent colors
        const hue = (i / bufferLength) * 60 + 240; // 240 (blue) to 300 (magenta)
        const saturation = 80;
        const lightness = 50 + (dataArray[i] / 255) * 20;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => cancelAnimationFrame(animationRef.current);
  }, [analyserNode, isPlaying]);

  return (
    <div className="visualizer-container" id="visualizer">
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className="visualizer-canvas"
      />
    </div>
  );
}
```

---

### Step 5.4 — Create `components/ListenerCount.js`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\components\ListenerCount.js
```

```js
'use client';

export default function ListenerCount({ count, live }) {
  return (
    <div className="listener-count" id="listener-count">
      <span className={`live-dot ${live ? 'pulse' : ''}`} />
      {live && <span className="live-text">LIVE</span>}
      <span className="count-text">🎧 {count} listening</span>
    </div>
  );
}
```

---

### Step 5.5 — Create `app/page.js` (Listener page — full rewrite)

**Tool:** 📄 `write_to_file` (Overwrite: true)
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\app\page.js
Overwrite: true
```

```jsx
'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAudioStream } from '@/hooks/useAudioStream';
import NowPlaying from '@/components/NowPlaying';
import AudioPlayer from '@/components/AudioPlayer';
import Visualizer from '@/components/Visualizer';
import ListenerCount from '@/components/ListenerCount';

export default function ListenerPage() {
  const { socket, isConnected } = useSocket();
  const { audioRef, isPlaying, isBuffering, play, pause, analyserNode, initAnalyser } =
    useAudioStream(socket);

  const [songData, setSongData] = useState(null);
  const [streamStatus, setStreamStatus] = useState({ live: false, listenerCount: 0 });

  useEffect(() => {
    if (!socket) return;

    // Join the radio room
    socket.emit('listener:join');

    // Listen for now-playing updates
    socket.on('stream:now-playing', (data) => {
      setSongData(data);
    });

    // Listen for status updates
    socket.on('stream:status', (data) => {
      setStreamStatus(data);
    });

    return () => {
      socket.off('stream:now-playing');
      socket.off('stream:status');
    };
  }, [socket]);

  // Initialize analyser after first play
  useEffect(() => {
    if (isPlaying && !analyserNode) {
      initAnalyser();
    }
  }, [isPlaying, analyserNode, initAnalyser]);

  return (
    <div className="listener-page">
      <header className="app-header" id="app-header">
        <div className="header-left">
          <ListenerCount count={streamStatus.listenerCount} live={streamStatus.live} />
        </div>
        <h1 className="app-title">Radio101</h1>
        <div className="header-right">
          <span className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? '●' : '○'}
          </span>
        </div>
      </header>

      <main className="main-content">
        <NowPlaying songData={songData} />

        <AudioPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          play={play}
          pause={pause}
          isBuffering={isBuffering}
        />

        <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} />
      </main>

      <footer className="app-footer">
        <p>Powered by Radio101 • Built with ♥</p>
      </footer>
    </div>
  );
}
```

---

### Step 5.6 — Update `app/layout.js` (add Inter font + metadata)

**Tool:** 📄 `write_to_file` (Overwrite: true)
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\app\layout.js
Overwrite: true
```

```jsx
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata = {
  title: 'Radio101 — Live Radio',
  description: 'Listen to live radio streaming. Powered by Radio101.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

### ✅ TEST 5.1 — Listener page renders all components

**Tool:** 🔧 `run_command` (start backend) + 🔧 `run_command` (start frontend)

**Tool:** 🖥️ `browser_subagent`
```
Task: Navigate to http://localhost:3000. Verify:
  1. "Radio101" heading is visible
  2. Now Playing section shows "Waiting for the DJ to start playing..."
  3. Play button (▶) is present
  4. Volume slider is present
  5. Visualizer canvas is present
  6. "Powered by Radio101" footer is visible
  7. Listener count shows "🎧 1 listening"
  8. No console errors
  Take a screenshot and return HTML structure.
RecordingName: listener_page_render
```

📝 **EXPECTED:** All components render. Socket connects, listener count ticks to 1.

---

### ✅ TEST 5.2 — End-to-end audio streaming (manual browser test)

**Tool:** 🖥️ `browser_subagent`
```
Task: 
  1. Open http://localhost:3000/dj in Tab 1
  2. Open http://localhost:3000 in Tab 2
  3. In Tab 1: Click "Start Broadcasting" → select Tab 2 (or any audio-playing tab)
  4. In Tab 2: Click the play button ▶
  5. Verify audio is heard (or at least that no errors appear in console)
  6. In Tab 1: Click "Stop Broadcasting"
  7. Verify Tab 2 shows stream ended status
  Take screenshots of both tabs and return console outputs.
RecordingName: e2e_streaming_test
```

📝 **EXPECTED:** Audio chunks flow from DJ → backend → listener. Listener hears audio after clicking play.

**After tests:** Terminate both dev servers.

---

# Phase 6 — Now Playing & Song Metadata

> **Goal:** Implement the iTunes/Deezer API wrapper, wire it into the stream handler, and display full song details.

---

### Step 6.1 — Implement `services/musicLookup.js` (full version)

**Tool:** 📄 `write_to_file` (Overwrite: true)
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\services\musicLookup.js
Overwrite: true
```

```js
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// In-memory cache: { "artist|title": { data, timestamp } }
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Lookup song metadata from iTunes Search API (primary)
 * Falls back to Deezer API if iTunes returns no results.
 *
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object>} Song metadata
 */
async function lookupSong(title, artist) {
  if (!title && !artist) {
    return getDefault(title, artist);
  }

  const cacheKey = `${(artist || '').toLowerCase()}|${(title || '').toLowerCase()}`;

  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  // Try iTunes first
  try {
    const result = await lookupFromItunes(title, artist);
    if (result) {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.error('iTunes lookup failed:', err.message);
  }

  // Fallback to Deezer
  try {
    const result = await lookupFromDeezer(title, artist);
    if (result) {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.error('Deezer lookup failed:', err.message);
  }

  // Both failed
  const fallback = getDefault(title, artist);
  cache.set(cacheKey, { data: fallback, timestamp: Date.now() });
  return fallback;
}

/**
 * iTunes Search API
 * Endpoint: https://itunes.apple.com/search?term={query}&media=music&limit=1
 */
async function lookupFromItunes(title, artist) {
  const query = encodeURIComponent(`${artist} ${title}`.trim());
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  const response = await fetch(url, { timeout: 5000 });
  if (!response.ok) throw new Error(`iTunes HTTP ${response.status}`);

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const track = data.results[0];
  return {
    title: track.trackName || title,
    artist: track.artistName || artist,
    album: track.collectionName || null,
    albumArt: track.artworkUrl100
      ? track.artworkUrl100.replace('100x100', '600x600')
      : null,
    songUrl: track.trackViewUrl || null,
    source: 'itunes',
  };
}

/**
 * Deezer Search API
 * Endpoint: https://api.deezer.com/search?q={query}&limit=1
 */
async function lookupFromDeezer(title, artist) {
  const query = encodeURIComponent(`${artist} ${title}`.trim());
  const url = `https://api.deezer.com/search?q=${query}&limit=1`;

  const response = await fetch(url, { timeout: 5000 });
  if (!response.ok) throw new Error(`Deezer HTTP ${response.status}`);

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    return null;
  }

  const track = data.data[0];
  return {
    title: track.title || title,
    artist: track.artist?.name || artist,
    album: track.album?.title || null,
    albumArt: track.album?.cover_xl || track.album?.cover_big || null,
    songUrl: track.link || null,
    source: 'deezer',
  };
}

function getDefault(title, artist) {
  return {
    title: title || 'Unknown',
    artist: artist || 'Unknown',
    album: null,
    albumArt: null,
    songUrl: null,
    source: null,
  };
}

module.exports = { lookupSong, lookupFromItunes, lookupFromDeezer, cache };
```

---

### Step 6.2 — Wire `musicLookup` into `streamHandler.js`

**Tool:** ✏️ `replace_file_content`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\socket\streamHandler.js
```

Replace the `dj:now-playing` handler:

```
TargetContent:
    socket.on('dj:now-playing', async ({ title, artist }) => {
      if (socket.id !== djSocketId) return;
      // Will be enhanced with musicLookup in Phase 6
      const metadata = { title, artist, album: null, albumArt: null, songUrl: null };
      setState(metadata);
      io.to('radio').emit('stream:now-playing', metadata);
      console.log(`🎵 Now playing: ${artist} - ${title}`);
    });

ReplacementContent:
    socket.on('dj:now-playing', async ({ title, artist }) => {
      if (socket.id !== djSocketId) return;
      console.log(`🎵 Now playing request: ${artist} - ${title}`);

      // Lookup full metadata from iTunes/Deezer
      const { lookupSong } = require('../services/musicLookup');
      const metadata = await lookupSong(title, artist);
      setState(metadata);
      io.to('radio').emit('stream:now-playing', metadata);
      console.log(`🎵 Metadata resolved:`, metadata);
    });
```

---

### Step 6.3 — Wire metadata into `nowPlaying.js` route

**Tool:** 👁️ `view_file`
```
AbsolutePath: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\routes\nowPlaying.js
```

📝 Already implemented — `getState()` returns current state which is updated by `setState()` in the stream handler. No changes needed.

---

### ✅ TEST 6.1 — Unit test: `musicLookup.js` — iTunes lookup

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\testing\musicLookup.test.js
```

```js
const { lookupSong, lookupFromItunes, lookupFromDeezer, cache } = require('../src/services/musicLookup');

// Clear cache before each test
beforeEach(() => {
  cache.clear();
});

describe('musicLookup', () => {
  // --- iTunes Tests ---

  test('lookupFromItunes returns track data for a known song', async () => {
    const result = await lookupFromItunes('Blinding Lights', 'The Weeknd');
    expect(result).not.toBeNull();
    expect(result.title).toBeDefined();
    expect(result.artist).toBeDefined();
    expect(result.albumArt).toContain('http');
    expect(result.songUrl).toContain('http');
    expect(result.source).toBe('itunes');
    // Album art should be 600x600
    expect(result.albumArt).toContain('600x600');
  }, 10000);

  test('lookupFromItunes returns null for garbage input', async () => {
    const result = await lookupFromItunes('zzzzzxxxxxqqqqq', 'aaaaabbbbbccccc');
    expect(result).toBeNull();
  }, 10000);

  // --- Deezer Tests ---

  test('lookupFromDeezer returns track data for a known song', async () => {
    const result = await lookupFromDeezer('Shape of You', 'Ed Sheeran');
    expect(result).not.toBeNull();
    expect(result.title).toBeDefined();
    expect(result.artist).toBeDefined();
    expect(result.albumArt).toContain('http');
    expect(result.source).toBe('deezer');
  }, 10000);

  // --- Combined lookupSong Tests ---

  test('lookupSong returns data from iTunes or Deezer', async () => {
    const result = await lookupSong('Bohemian Rhapsody', 'Queen');
    expect(result).not.toBeNull();
    expect(result.title).toBeDefined();
    expect(result.artist).toBeDefined();
    expect(result.source).toMatch(/^(itunes|deezer)$/);
  }, 15000);

  test('lookupSong returns default for empty input', async () => {
    const result = await lookupSong('', '');
    expect(result.title).toBe('Unknown');
    expect(result.artist).toBe('Unknown');
    expect(result.source).toBeNull();
  });

  // --- Cache Tests ---

  test('lookupSong caches results', async () => {
    // First call — hits API
    const result1 = await lookupSong('Blinding Lights', 'The Weeknd');
    expect(cache.size).toBe(1);

    // Second call — hits cache (should be instant)
    const start = Date.now();
    const result2 = await lookupSong('Blinding Lights', 'The Weeknd');
    const elapsed = Date.now() - start;

    expect(result2).toEqual(result1);
    expect(elapsed).toBeLessThan(10); // Cache should be near-instant
  }, 15000);

  test('cache key is case-insensitive', async () => {
    await lookupSong('blinding lights', 'the weeknd');
    expect(cache.has('the weeknd|blinding lights')).toBe(true);
  }, 10000);
});
```

---

### Step 6.4 — Run unit tests

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npx jest testing/musicLookup.test.js --verbose
WaitMsBeforeAsync: 500
SafeToAutoRun: true
```

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 60
```

📝 **EXPECTED OUTPUT:**
```
 PASS  testing/musicLookup.test.js
  musicLookup
    ✓ lookupFromItunes returns track data for a known song (XXXms)
    ✓ lookupFromItunes returns null for garbage input (XXXms)
    ✓ lookupFromDeezer returns track data for a known song (XXXms)
    ✓ lookupSong returns data from iTunes or Deezer (XXXms)
    ✓ lookupSong returns default for empty input (Xms)
    ✓ lookupSong caches results (XXXms)
    ✓ cache key is case-insensitive (XXXms)

Tests:       7 passed
Suites:      1 passed
```

---

### ✅ TEST 6.2 — Manual API test: curl iTunes

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: curl "https://itunes.apple.com/search?term=The+Weeknd+Blinding+Lights&media=music&limit=1"
WaitMsBeforeAsync: 10000
SafeToAutoRun: true
```

📝 **EXPECTED:** JSON response with `resultCount: 1`, containing `trackName`, `artistName`, `artworkUrl100`, etc.

---

### ✅ TEST 6.3 — Manual API test: curl Deezer

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: curl "https://api.deezer.com/search?q=Ed+Sheeran+Shape+of+You&limit=1"
WaitMsBeforeAsync: 10000
SafeToAutoRun: true
```

📝 **EXPECTED:** JSON response with `data` array containing `title`, `artist.name`, `album.cover_xl`, etc.

---

### ✅ TEST 6.4 — Integration: now-playing endpoint returns enriched data

**Precondition:** Backend dev server running.

**Tool:** 🖥️ `browser_subagent`
```
Task: Open browser console and run:
  const socket = io('http://localhost:3001');
  socket.emit('dj:start', { djSecret: 'radio101-dj-secret-dev' });
  socket.emit('dj:now-playing', { title: 'Blinding Lights', artist: 'The Weeknd' });

  Wait 3 seconds, then fetch:
  fetch('http://localhost:3001/api/now-playing').then(r => r.json()).then(console.log)

  Verify the response includes:
  - title: contains "Blinding Lights" (or similar from iTunes/Deezer)
  - artist: contains "Weeknd"
  - albumArt: valid URL
  - songUrl: valid URL
  - source: "itunes" or "deezer"
  Return the full JSON response.
RecordingName: now_playing_integration
```

📝 **EXPECTED:** Full song metadata with album art URL.

---

### ✅ TEST 6.5 — Frontend: NowPlaying component displays metadata

**Tool:** 🖥️ `browser_subagent`
```
Task: 
  1. Open http://localhost:3000/dj → Start broadcasting
  2. In the Now Playing fields, type:
     - Title: "Blinding Lights"
     - Artist: "The Weeknd"
  3. Uncheck "Auto-detect" and click "Update Now Playing"
  4. Open http://localhost:3000 in another tab
  5. Verify:
     - Album art image loads (from iTunes/Deezer)
     - Song title "Blinding Lights" is displayed
     - Artist "The Weeknd" is displayed
     - "Listen on Apple Music" or "Listen on Deezer" link is present
  Take a screenshot and return findings.
RecordingName: now_playing_display
```

📝 **EXPECTED:** Full now-playing card with album art, title, artist, and external link.

---

# Phase 7 — Premium UI & Polish

> **Goal:** Transform the raw UI into a stunning, premium dark-mode experience.

---

### Step 7.1 — Create `app/globals.css` (full design system)

**Tool:** 📄 `write_to_file` (Overwrite: true)
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\app\globals.css
Overwrite: true
```

**Content — Full CSS (~500+ lines):**

CSS will include:

```css
/* ============================
   RADIO101 DESIGN SYSTEM
   ============================ */

/* --- CSS Custom Properties (Design Tokens) --- */
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --surface: rgba(255, 255, 255, 0.04);
  --surface-hover: rgba(255, 255, 255, 0.08);
  --surface-border: rgba(255, 255, 255, 0.08);
  --text-primary: #f0f0f5;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.35);
  --accent-gradient: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
  --accent-indigo: #6366f1;
  --accent-purple: #a855f7;
  --accent-pink: #ec4899;
  --glow-color: rgba(99, 102, 241, 0.3);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
  --blur: 20px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* --- Global Reset --- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body {
  font-family: var(--font-family);
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* --- Animated Background Gradient --- */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
  z-index: -1;
  pointer-events: none;
}

/* --- Header --- */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--surface);
  backdrop-filter: blur(var(--blur));
  border-bottom: 1px solid var(--surface-border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* --- Live Pulse Indicator --- */
.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  display: inline-block;
  margin-right: 8px;
}
.live-dot.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
.live-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 0.1em;
  margin-right: 12px;
}

/* --- Listener Count Badge --- */
.listener-count {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* --- Main Content --- */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 32px;
  max-width: 600px;
  margin: 0 auto;
}

/* --- Now Playing Card --- */
.now-playing {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
  width: 100%;
}
.album-art-container {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(99, 102, 241, 0.2),
              0 0 80px rgba(168, 85, 247, 0.1);
  animation: breathe 4s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { box-shadow: 0 8px 40px rgba(99, 102, 241, 0.2), 0 0 80px rgba(168, 85, 247, 0.1); }
  50% { box-shadow: 0 12px 60px rgba(99, 102, 241, 0.35), 0 0 120px rgba(168, 85, 247, 0.15); }
}
.album-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.album-art:hover {
  transform: scale(1.05);
}
.album-art-placeholder {
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur));
}
.no-song-icon, .no-art-icon {
  font-size: 4rem;
  opacity: 0.3;
}

.song-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
.song-artist {
  font-size: 1.1rem;
  color: var(--text-secondary);
}
.song-album {
  color: var(--text-muted);
}
.song-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-full);
  color: var(--accent-purple);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-normal);
}
.song-link:hover {
  background: var(--surface-hover);
  border-color: var(--accent-purple);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.15);
}
.now-playing-empty {
  color: var(--text-muted);
  font-size: 1rem;
  padding: 40px 0;
}

/* --- Audio Player --- */
.audio-player {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 28px;
  background: var(--surface);
  backdrop-filter: blur(var(--blur));
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
}
.play-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--accent-gradient);
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  flex-shrink: 0;
}
.play-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 6px 30px rgba(99, 102, 241, 0.5);
}
.play-btn:active:not(:disabled) {
  transform: scale(0.95);
}
.play-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.volume-icon { font-size: 1.1rem; }
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  transition: background var(--transition-fast);
}
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-purple);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
  transition: transform var(--transition-fast);
}
.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* --- Visualizer --- */
.visualizer-container {
  width: 100%;
  max-width: 500px;
  padding: 16px;
  background: var(--surface);
  backdrop-filter: blur(var(--blur));
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
}
.visualizer-canvas {
  width: 100%;
  height: 80px;
  display: block;
}

/* --- Connection Status --- */
.connection-status {
  font-size: 0.7rem;
}
.connection-status.online { color: #22c55e; }
.connection-status.offline { color: #ef4444; }

/* --- Footer --- */
.app-footer {
  text-align: center;
  padding: 32px 24px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* --- DJ Dashboard Styles --- */
.dj-dashboard {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}
.dj-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 32px;
}
.dj-header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.dj-status {
  margin-bottom: 24px;
}
.status-indicator {
  font-size: 1.1rem;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--surface-border);
}
.status-indicator.live {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}
.dj-controls {
  margin-bottom: 32px;
}
.broadcast-btn {
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}
.broadcast-btn.start {
  background: var(--accent-gradient);
  color: white;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}
.broadcast-btn.start:hover {
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
  transform: translateY(-2px);
}
.broadcast-btn.stop {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.broadcast-btn.stop:hover {
  background: rgba(239, 68, 68, 0.25);
}
.broadcast-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dj-now-playing {
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur));
  margin-bottom: 24px;
}
.dj-now-playing h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
}
.dj-now-playing label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}
.dj-now-playing input[type="text"] {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: var(--font-family);
  margin-bottom: 10px;
  outline: none;
  transition: border-color var(--transition-fast);
}
.dj-now-playing input[type="text"]:focus {
  border-color: var(--accent-purple);
}
.dj-now-playing input[type="text"]:disabled {
  opacity: 0.4;
}
.dj-now-playing button {
  width: 100%;
  padding: 10px;
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dj-now-playing button:hover:not(:disabled) {
  border-color: var(--accent-purple);
}
.dj-now-playing button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dj-connection {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.connection-dot.connected { background: #22c55e; }
.connection-dot.disconnected { background: #ef4444; }

/* --- Responsive --- */
@media (max-width: 640px) {
  .app-header { padding: 12px 16px; }
  .app-title { font-size: 1.2rem; }
  .main-content { padding: 32px 16px; gap: 24px; }
  .album-art-container, .album-art-placeholder { width: 220px; height: 220px; }
  .song-title { font-size: 1.4rem; }
  .audio-player { padding: 12px 20px; gap: 12px; }
  .play-btn { width: 44px; height: 44px; font-size: 1.1rem; }
  .dj-dashboard { padding: 16px; }
}
```

---

### Step 7.2 — Verify styles don't break layout

**Tool:** 🖥️ `browser_subagent`
```
Task: Open http://localhost:3000. Take a full-page screenshot.
  Verify:
  1. Dark background (#0a0a0f) renders correctly
  2. Header has glassmorphism effect (blurred background)
  3. "Radio101" title has gradient text effect
  4. Play button has gradient background with glow
  5. Layout is centered and properly spaced
  Then resize browser to 375px width (mobile) and take another screenshot.
  Verify mobile layout is responsive.
  Return both screenshots.
RecordingName: premium_ui_check
```

📝 **EXPECTED:** Stunning dark-mode UI with glassmorphism, gradient accents, and smooth animations.

---

### Step 7.3 — Test visualizer animation

**Tool:** 🖥️ `browser_subagent`
```
Task: 
  1. Open DJ dashboard (/dj) and start broadcasting with a Chrome tab playing music
  2. Open listener page (/) and click Play
  3. Observe the visualizer canvas — it should show animated frequency bars
  4. Record for 5 seconds to capture the animation
  Return whether bars are animating with color gradients.
RecordingName: visualizer_animation
```

📝 **EXPECTED:** Visualizer shows animated bars in blue-to-magenta gradient, synced with audio.

---

### Step 7.4 — Test album art glow animation

**Tool:** 🖥️ `browser_subagent`
```
Task: On the listener page with a song playing:
  1. Observe the album art container
  2. It should have a breathing glow shadow (pulsing between subtle and prominent)
  3. Hover over the album art — it should slightly scale up
  Return observation.
RecordingName: album_art_glow
```

📝 **EXPECTED:** `breathe` keyframe animation creates pulsing glow on album art.

---

# Phase 8 — Hardening & Security

> **Goal:** Add DJ authentication validation, CORS lockdown, reconnection logic, error handling.

---

### Step 8.1 — Add DJ secret validation on frontend

**Tool:** 👁️ `view_file`
```
AbsolutePath: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\app\dj\page.js
```

Verify that `process.env.NEXT_PUBLIC_DJ_SECRET` is read and sent in the `dj:start` event.

---

### Step 8.2 — Add reconnection logic to `useSocket.js`

**Tool:** ✏️ `replace_file_content`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\frontend\hooks\useSocket.js
```

Add reconnection event handlers:
```js
socket.on('reconnect', (attemptNumber) => {
  console.log(`🔌 Reconnected after ${attemptNumber} attempts`);
  setIsConnected(true);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`🔌 Reconnection attempt ${attemptNumber}`);
});

socket.on('reconnect_error', (err) => {
  console.error('🔌 Reconnection error:', err.message);
});
```

---

### Step 8.3 — Add error handling to backend stream handler

**Tool:** ✏️✏️ `multi_replace_file_content`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\socket\streamHandler.js
```

Chunk 1 — Wrap `dj:now-playing` handler in try/catch:
```
TargetContent: "const metadata = await lookupSong(title, artist);"
ReplacementContent: "let metadata;\n      try {\n        metadata = await lookupSong(title, artist);\n      } catch (err) {\n        console.error('Song lookup error:', err);\n        metadata = { title, artist, album: null, albumArt: null, songUrl: null, source: null };\n      }"
```

---

### Step 8.4 — Add CORS validation

**Tool:** 👁️ `view_file`
```
AbsolutePath: c:\Users\bhyra\OneDrive\Documents\radio101\backend\src\server.js
```

Verify CORS is configured with `config.frontendOrigin`. Already done in Step 1.7.

---

### ✅ TEST 8.1 — DJ authentication: invalid secret rejected

**Tool:** 🖥️ `browser_subagent`
```
Task: Open browser console and run:
  const socket = io('http://localhost:3001');
  socket.on('error', (data) => console.log('Error:', data));
  socket.emit('dj:start', { djSecret: 'wrong-secret' });
  
  Wait 2 seconds. Verify console shows:
  Error: { message: 'Invalid DJ secret' }
  Return console output.
RecordingName: auth_rejection_test
```

📝 **EXPECTED:** Server rejects invalid DJ secret with error event.

---

### ✅ TEST 8.2 — Reconnection after backend restart

**Tool:** 🖥️ `browser_subagent`
```
Task: 
  1. Open http://localhost:3000 (listener page, Socket connects)
  2. Restart the backend server (kill and restart npm run dev)
  3. Wait 10 seconds
  4. Verify the listener page reconnects automatically
  5. Check console for reconnection logs
  Return findings.
RecordingName: reconnection_test
```

📝 **EXPECTED:** Socket.IO automatically reconnects after backend restart.

---

# Phase 9 — Testing Suite

> **Goal:** Comprehensive unit, integration, and end-to-end tests.

---

### 9.1 — Unit Tests

#### 9.1.1 `testing/musicLookup.test.js`

Already created in Step 6.1. Contains 7 tests:

| # | Test | What it verifies |
|---|---|---|
| 1 | iTunes returns data for known song | API response parsing, artwork URL upgrade |
| 2 | iTunes returns null for garbage | Graceful no-result handling |
| 3 | Deezer returns data for known song | Fallback API works |
| 4 | Combined lookup finds song | Primary + fallback flow |
| 5 | Empty input returns defaults | Edge case handling |
| 6 | Cache prevents duplicate API calls | Performance optimization |
| 7 | Cache key is case-insensitive | Normalization |

**Run command:**
```
npx jest testing/musicLookup.test.js --verbose
```

---

#### 9.1.2 `testing/config.test.js` (NEW)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\testing\config.test.js
```

```js
describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses default port 3001 when PORT not set', () => {
    delete process.env.PORT;
    const config = require('../src/config');
    expect(config.port).toBe(3001);
  });

  test('reads PORT from environment', () => {
    process.env.PORT = '4000';
    const config = require('../src/config');
    expect(config.port).toBe('4000');
  });

  test('reads FRONTEND_ORIGIN from environment', () => {
    process.env.FRONTEND_ORIGIN = 'https://radio101.com';
    const config = require('../src/config');
    expect(config.frontendOrigin).toBe('https://radio101.com');
  });

  test('reads DJ_SECRET from environment', () => {
    process.env.DJ_SECRET = 'test-secret';
    const config = require('../src/config');
    expect(config.djSecret).toBe('test-secret');
  });
});
```

**Run command:**
```
npx jest testing/config.test.js --verbose
```

📝 **EXPECTED:** 4/4 tests pass.

---

#### 9.1.3 `testing/nowPlayingRoute.test.js` (NEW)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\testing\nowPlayingRoute.test.js
```

```js
const { getState, setState } = require('../src/routes/nowPlaying');

describe('nowPlaying route state', () => {
  test('getState returns default state initially', () => {
    const state = getState();
    expect(state.live).toBe(false);
    expect(state.title).toBeNull();
    expect(state.listenerCount).toBe(0);
  });

  test('setState merges partial updates', () => {
    setState({ live: true, title: 'Test Song' });
    const state = getState();
    expect(state.live).toBe(true);
    expect(state.title).toBe('Test Song');
    expect(state.artist).toBeNull(); // unchanged
  });

  test('setState overwrites existing values', () => {
    setState({ title: 'Song A' });
    setState({ title: 'Song B' });
    expect(getState().title).toBe('Song B');
  });
});
```

**Run command:**
```
npx jest testing/nowPlayingRoute.test.js --verbose
```

📝 **EXPECTED:** 3/3 tests pass.

---

### 9.2 — Integration Tests

#### 9.2.1 `testing/socketIntegration.test.js` (NEW)

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\backend\testing\socketIntegration.test.js
```

```js
const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { initStreamHandler } = require('../src/socket/streamHandler');

describe('Socket.IO Stream Handler', () => {
  let io, serverSocket, clientSocket, httpServer;
  const TEST_PORT = 3099;
  const DJ_SECRET = 'test-secret';

  beforeAll((done) => {
    // Override DJ secret for tests
    process.env.DJ_SECRET = DJ_SECRET;

    httpServer = http.createServer();
    io = new Server(httpServer, { cors: { origin: '*' } });
    initStreamHandler(io);

    httpServer.listen(TEST_PORT, () => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test('listener can join radio room', (done) => {
    clientSocket.emit('listener:join');
    clientSocket.on('stream:status', (data) => {
      expect(data).toHaveProperty('live');
      expect(data).toHaveProperty('listenerCount');
      expect(data.listenerCount).toBeGreaterThanOrEqual(1);
      done();
    });
  });

  test('invalid DJ secret is rejected', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`);
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: 'wrong' });
      djSocket.on('error', (err) => {
        expect(err.message).toBe('Invalid DJ secret');
        djSocket.close();
        done();
      });
    });
  });

  test('DJ can start broadcasting with valid secret', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`);
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: DJ_SECRET });
      // Listener should receive status update
      clientSocket.once('stream:status', (data) => {
        expect(data.live).toBe(true);
        djSocket.close();
        done();
      });
    });
  });

  test('audio chunks are relayed from DJ to listeners', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`);
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: DJ_SECRET });

      setTimeout(() => {
        const testChunk = Buffer.from('fake-audio-data');
        djSocket.emit('dj:audio-chunk', testChunk);

        clientSocket.once('stream:audio-chunk', (chunk) => {
          expect(chunk).toBeDefined();
          djSocket.close();
          done();
        });
      }, 100);
    });
  });

  test('now-playing is broadcast to listeners', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`);
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: DJ_SECRET });

      setTimeout(() => {
        djSocket.emit('dj:now-playing', { title: 'Test Song', artist: 'Test Artist' });

        clientSocket.once('stream:now-playing', (data) => {
          expect(data.title).toBeDefined();
          expect(data.artist).toBeDefined();
          djSocket.close();
          done();
        });
      }, 100);
    });
  }, 15000); // Extended timeout for API call

  test('DJ stop broadcasts offline status', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`);
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: DJ_SECRET });

      setTimeout(() => {
        djSocket.emit('dj:stop');

        clientSocket.once('stream:status', (data) => {
          expect(data.live).toBe(false);
          djSocket.close();
          done();
        });
      }, 100);
    });
  });
});
```

**Run command:**
```
npx jest testing/socketIntegration.test.js --verbose --detectOpenHandles
```

📝 **EXPECTED:** 6/6 tests pass.

---

### 9.3 — Run ALL Backend Tests

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: npx jest --verbose --detectOpenHandles
WaitMsBeforeAsync: 500
SafeToAutoRun: true
```

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 120
```

📝 **EXPECTED OUTPUT:**
```
 PASS  testing/config.test.js (4 tests)
 PASS  testing/nowPlayingRoute.test.js (3 tests)
 PASS  testing/musicLookup.test.js (7 tests)
 PASS  testing/socketIntegration.test.js (6 tests)

Test Suites: 4 passed, 4 total
Tests:       20 passed, 20 total
```

---

### 9.4 — Browser / E2E Tests

All browser tests use `browser_subagent`. Here is the full E2E test sequence:

#### ✅ E2E TEST 1 — Full streaming flow

**Tool:** 🖥️ `browser_subagent`
```
Task: Complete end-to-end streaming test:
  1. Open http://localhost:3000/dj (DJ Dashboard)
  2. Verify "Radio101 DJ Dashboard" heading visible
  3. Click "Start Broadcasting"
  4. Select a Chrome tab with audio playing
  5. Verify status changes to "🔴 LIVE"
  6. Open http://localhost:3000 in new tab (Listener page)
  7. Click Play button ▶
  8. Verify listener count shows "🎧 1 listening" (or more)
  9. In DJ tab: type song title "Bohemian Rhapsody" and artist "Queen", click "Update Now Playing"
  10. In Listener tab: verify album art appears with correct song info
  11. In DJ tab: click "Stop Broadcasting"
  12. Verify Listener tab shows offline status
  Take screenshots at each step.
RecordingName: full_e2e_test
```

#### ✅ E2E TEST 2 — Mobile responsive test

**Tool:** 🖥️ `browser_subagent`
```
Task: 
  1. Navigate to http://localhost:3000
  2. Set viewport to 375x812 (iPhone X)
  3. Verify layout is responsive:
     - Header stacks properly
     - Album art is smaller (220x220)
     - Audio player controls fit
     - No horizontal overflow
  4. Set viewport to 768x1024 (iPad)
  5. Verify tablet layout
  Take screenshots at both sizes.
RecordingName: responsive_test
```

#### ✅ E2E TEST 3 — Connection resilience

**Tool:** 🖥️ `browser_subagent`
```
Task:
  1. Open http://localhost:3000 (listener page)
  2. Verify Socket.IO connects (green dot)
  3. In terminal, stop the backend server
  4. Wait 3 seconds — verify the connection status changes to red/disconnected
  5. Restart the backend server
  6. Wait 10 seconds — verify the listener auto-reconnects (green dot returns)
  Return findings.
RecordingName: connection_resilience
```

#### ✅ E2E TEST 4 — Multiple listeners

**Tool:** 🖥️ `browser_subagent`
```
Task:
  1. Open http://localhost:3000 in 3 different tabs (Tab A, B, C)
  2. Each should show incrementing listener count
  3. Close Tab C
  4. Verify remaining tabs show decremented count
  Return listener counts at each step.
RecordingName: multi_listener_test
```

---

# Phase 10 — Production Build & Deployment

> **Goal:** Build production bundles, create README, and verify deployment readiness.

---

### Step 10.1 — Create root `README.md`

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\README.md
```

Content: Project overview, setup instructions, tech stack, screenshots, deployment guide.

---

### Step 10.2 — Frontend production build

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\frontend
CommandLine: npm run build
WaitMsBeforeAsync: 500
SafeToAutoRun: true
```

**Tool:** 📋 `command_status`
```
WaitDurationSeconds: 120
```

📝 **EXPECTED:**
```
✓ Compiled successfully
Route (app)                              Size
┌ ○ /                                    XX kB
├ ○ /dj                                  XX kB
└ ...
```

---

### ✅ PRODUCTION TEST 1 — Frontend production server

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\frontend
CommandLine: npm run start
WaitMsBeforeAsync: 5000
SafeToAutoRun: true
```

**Tool:** 🖥️ `browser_subagent`
```
Task: Navigate to http://localhost:3000. Verify the production build:
  1. Page loads fast (under 2 seconds)
  2. All styles are applied correctly
  3. No console errors
  4. Socket.IO connects to backend
  Return page load time and any errors.
RecordingName: production_build_test
```

---

### ✅ PRODUCTION TEST 2 — Backend health under load

**Tool:** 🔧 `run_command`
```
Cwd: c:\Users\bhyra\OneDrive\Documents\radio101\backend
CommandLine: node -e "const io=require('socket.io-client');const sockets=[];for(let i=0;i<20;i++){const s=io('http://localhost:3001');s.on('connect',()=>{s.emit('listener:join');if(i===19){setTimeout(()=>{fetch('http://localhost:3001/api/now-playing').then(r=>r.json()).then(d=>{console.log('Listener count:',d.listenerCount);sockets.forEach(s=>s.close());process.exit(0)})},1000)}});sockets.push(s)}"
WaitMsBeforeAsync: 10000
SafeToAutoRun: true
```

📝 **EXPECTED:** `Listener count: 20` — Server handles 20 concurrent connections.

---

### Step 10.3 — Create `.gitignore` at root

**Tool:** 📄 `write_to_file`
```
TargetFile: c:\Users\bhyra\OneDrive\Documents\radio101\.gitignore
```

```
node_modules/
.env
.env.local
.next/
```

---

## Complete File Manifest

| File | Phase Created | Phase Last Modified |
|---|---|---|
| `backend/package.json` | 1.1 | 1.10 |
| `backend/.env.example` | 1.4 | — |
| `backend/.env` | 1.5 | — |
| `backend/.gitignore` | 1.11 | — |
| `backend/src/config/index.js` | 1.6 | — |
| `backend/src/server.js` | 1.7 | — |
| `backend/src/routes/nowPlaying.js` | 1.8 | — |
| `backend/src/socket/streamHandler.js` | 1.9 | 3.2, 6.2, 8.3 |
| `backend/src/services/musicLookup.js` | 3.3 | 6.1 |
| `backend/testing/musicLookup.test.js` | 6.1 | — |
| `backend/testing/config.test.js` | 9.1.2 | — |
| `backend/testing/nowPlayingRoute.test.js` | 9.1.3 | — |
| `backend/testing/socketIntegration.test.js` | 9.2.1 | — |
| `frontend/package.json` | 2.2 | 2.3 |
| `frontend/.env.local` | 2.4 | — |
| `frontend/lib/socket.js` | 2.5 | — |
| `frontend/hooks/useSocket.js` | 2.6 | 8.2 |
| `frontend/hooks/useAudioStream.js` | 2.7 | — |
| `frontend/app/layout.js` | 5.6 | — |
| `frontend/app/page.js` | 5.5 | — |
| `frontend/app/globals.css` | 7.1 | — |
| `frontend/app/dj/page.js` | 4.2 | — |
| `frontend/components/DJControls.js` | 4.1 | 4.3 |
| `frontend/components/AudioPlayer.js` | 5.1 | — |
| `frontend/components/NowPlaying.js` | 5.2 | — |
| `frontend/components/Visualizer.js` | 5.3 | — |
| `frontend/components/ListenerCount.js` | 5.4 | — |
| `README.md` | 10.1 | — |
| `.gitignore` | 10.3 | — |

---

## Test Summary

### Unit Tests (20 total)

| File | Tests | What is Tested |
|---|---|---|
| `config.test.js` | 4 | Env var reading, defaults |
| `nowPlayingRoute.test.js` | 3 | State get/set, merge, overwrite |
| `musicLookup.test.js` | 7 | iTunes API, Deezer API, fallback, cache, edge cases |
| `socketIntegration.test.js` | 6 | Join, auth reject, broadcast start/stop, audio relay, now-playing relay |

### Browser/E2E Tests (9 total)

| Test | What is Tested |
|---|---|
| TEST 1.1 | Backend starts without errors |
| TEST 1.2 | Health check endpoint |
| TEST 1.3 | Now-playing endpoint default |
| TEST 2.1 | Frontend initial load |
| TEST 4.1 | DJ Dashboard renders |
| TEST 4.2 | DJ start/stop broadcast |
| TEST 5.1 | Listener page all components |
| TEST 5.2 | End-to-end audio streaming |
| E2E TEST 1 | Full streaming flow with metadata |
| E2E TEST 2 | Mobile responsive |
| E2E TEST 3 | Connection resilience |
| E2E TEST 4 | Multiple listeners |

### Production Tests (2 total)

| Test | What is Tested |
|---|---|
| PROD TEST 1 | Frontend production build loads correctly |
| PROD TEST 2 | Backend handles 20 concurrent connections |

---

## Execution Order Summary

```mermaid
gantt
    title Radio101 Build Execution Order
    dateFormat X
    axisFormat %s

    section Phase 1 - Backend
    npm init + deps           :p1a, 0, 3
    Config + Server + Routes  :p1b, 3, 7
    Stream Handler            :p1c, 7, 9
    Backend Tests             :p1t, 9, 10

    section Phase 2 - Frontend
    Next.js init + deps       :p2a, 10, 14
    Socket hooks              :p2b, 14, 17
    Audio stream hook         :p2c, 17, 19
    Frontend Test             :p2t, 19, 20

    section Phase 3 - Stream Core
    Fix listener tracking     :p3a, 20, 21
    Socket test               :p3t, 21, 22

    section Phase 4 - DJ Dashboard
    DJControls component      :p4a, 22, 25
    DJ page                   :p4b, 25, 27
    DJ Tests                  :p4t, 27, 28

    section Phase 5 - Listener Page
    Audio/NowPlaying/Viz      :p5a, 28, 33
    Listener page assembly    :p5b, 33, 35
    Layout + metadata         :p5c, 35, 36
    E2E streaming test        :p5t, 36, 38

    section Phase 6 - Metadata
    musicLookup full impl     :p6a, 38, 41
    Wire into handler         :p6b, 41, 42
    Unit tests (7)            :p6t, 42, 44
    Integration test          :p6t2, 44, 46

    section Phase 7 - Premium UI
    globals.css design system :p7a, 46, 50
    Visual verification       :p7t, 50, 52

    section Phase 8 - Hardening
    Auth + reconnect + errors :p8a, 52, 55
    Security tests            :p8t, 55, 56

    section Phase 9 - Test Suite
    All unit tests            :p9a, 56, 58
    All integration tests     :p9b, 58, 60
    All E2E browser tests     :p9c, 60, 64

    section Phase 10 - Production
    README + build            :p10a, 64, 67
    Production tests          :p10t, 67, 69
```

---

## Total Tool Calls Estimate

| Tool | Count |
|---|---|
| 📄 `write_to_file` | ~28 |
| ✏️ `replace_file_content` | ~5 |
| ✏️✏️ `multi_replace_file_content` | ~3 |
| 👁️ `view_file` | ~8 |
| 🔧 `run_command` | ~18 |
| 📋 `command_status` | ~12 |
| 🖥️ `browser_subagent` | ~11 |
| 🔍 `grep_search` | ~2 (debug only) |
| 🌐 `read_url_content` | ~2 (API verification) |
| **Total** | **~89 tool calls** |
