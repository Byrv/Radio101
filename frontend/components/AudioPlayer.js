'use client';
import { useState } from 'react';

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
