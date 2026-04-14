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
  const hasDataRef = useRef(false);
  const pendingPlayRef = useRef(false);

  // Initialize MediaSource
  useEffect(() => {
    if (!socket || !audioRef.current) return;

    let aborted = false;
    hasDataRef.current = false;
    setIsBuffering(true);
    const audio = audioRef.current;
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    const objectUrl = URL.createObjectURL(mediaSource);
    audio.src = objectUrl;

    mediaSource.addEventListener('sourceopen', () => {
      if (aborted || mediaSource.readyState !== 'open') return;

      try {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/webm;codecs=opus');
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener('updateend', () => {
          if (aborted || mediaSource.readyState !== 'open') return;

          // Mark that we have data after first successful append
          if (!hasDataRef.current && sourceBuffer.buffered.length > 0) {
            hasDataRef.current = true;
            setIsBuffering(false);

            // If play was requested while buffering, start now
            if (pendingPlayRef.current) {
              pendingPlayRef.current = false;
              audio.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }

          // Process queue
          if (queueRef.current.length > 0 && !sourceBuffer.updating) {
            const next = queueRef.current.shift();
            try {
              sourceBuffer.appendBuffer(next);
            } catch (e) {
              // SourceBuffer may have been removed
            }
          }

          // Auto-cleanup: remove buffered data older than 30s
          try {
            if (!sourceBuffer.updating && sourceBuffer.buffered.length > 0) {
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
      } catch (e) {
        console.error('Failed to create SourceBuffer:', e);
      }
    });

    // Listen for audio chunks
    const handleChunk = (chunk) => {
      if (aborted) return;

      const buffer = chunk instanceof ArrayBuffer
        ? chunk
        : chunk.buffer || new Uint8Array(chunk).buffer;

      const sb = sourceBufferRef.current;
      if (sb && !sb.updating && mediaSourceRef.current?.readyState === 'open') {
        try {
          sb.appendBuffer(buffer);
        } catch (e) {
          // SourceBuffer removed or MediaSource closed
        }
      } else if (!aborted) {
        queueRef.current.push(buffer);
        // Limit queue size to prevent memory bloat
        if (queueRef.current.length > 50) {
          queueRef.current.shift();
        }
      }
    };

    socket.on('stream:audio-chunk', handleChunk);

    return () => {
      aborted = true;
      socket.off('stream:audio-chunk', handleChunk);
      sourceBufferRef.current = null;
      queueRef.current = [];
      hasDataRef.current = false;
      pendingPlayRef.current = false;
      if (mediaSource.readyState === 'open') {
        try { mediaSource.endOfStream(); } catch (e) { /* ignore */ }
      }
      URL.revokeObjectURL(objectUrl);
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
    if (!hasDataRef.current) {
      // No audio data yet — defer play until first chunk arrives
      pendingPlayRef.current = true;
      setIsBuffering(true);
      return;
    }
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
