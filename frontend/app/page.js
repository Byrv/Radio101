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
    const handleNowPlaying = (data) => {
      setSongData(data);
    };

    // Listen for status updates
    const handleStatus = (data) => {
      setStreamStatus(data);
    };

    socket.on('stream:now-playing', handleNowPlaying);
    socket.on('stream:status', handleStatus);

    return () => {
      socket.off('stream:now-playing', handleNowPlaying);
      socket.off('stream:status', handleStatus);
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
          live={streamStatus.live}
        />

        <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} />
      </main>

      <footer className="app-footer">
        <p>Powered by Radio101 • Built with ♥</p>
      </footer>
    </div>
  );
}
