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
            try {
              sourceBuffer.appendBuffer(next);
            } catch (e) {
              console.error('Error appending queued buffer:', e);
            }
          }

          // Auto-cleanup: remove buffered data older than 30s
          try {
            if (sourceBuffer.buffered.length > 0) {
              const currentTime = audio.currentTime;
              const start = sourceBuffer.buffered.start(0);
              if (currentTime - start > 30) {
                sourceBuffer.remove(start, currentTime - 10);
              }
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        });

        setIsBuffering(false);
      } catch (e) {
        console.error('Failed to create SourceBuffer:', e);
      }
    });

    // Listen for audio chunks
    const handleChunk = (chunk) => {
      const buffer = chunk instanceof ArrayBuffer
        ? chunk
        : chunk.buffer || new Uint8Array(chunk).buffer;

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
        try { mediaSource.endOfStream(); } catch (e) { /* ignore */ }
      }
      URL.revokeObjectURL(audio.src);
    };
  }, [socket]);

  // Create AudioContext + AnalyserNode for visualizer
  const initAnalyser = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return analyserRef.current;

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
