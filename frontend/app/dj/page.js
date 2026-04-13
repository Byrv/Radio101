'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function DJPage() {
  const { socket, isConnected } = useSocket();
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
          const updated = { title: newTitle, artist: newArtist };
          setNowPlaying(updated);
          socket?.emit('dj:now-playing', updated);
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
        video: false,
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
    setNowPlaying((prev) => ({ ...prev, [field]: value }));
  };

  const sendNowPlaying = () => {
    socket?.emit('dj:now-playing', nowPlaying);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="dj-dashboard">
      <header className="dj-header">
        <h1>Radio101 DJ Dashboard</h1>
        <div className="listener-count">
          <span className="count-text">🎧 {listenerCount} online</span>
        </div>
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
          onClick={sendNowPlaying}
          disabled={autoDetect}
        >
          Update Now Playing
        </button>
      </section>

      <section className="dj-connection">
        <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        {isConnected ? 'Connected to server' : 'Disconnected — check backend'}
      </section>
    </div>
  );
}
