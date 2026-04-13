'use client';
import { useEffect, useState, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      console.log('🔌 Socket connected:', socket.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('🔌 Socket disconnected');
    };

    const onError = (err) => {
      console.error('🔌 Socket connection error:', err.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    // Reconnection events
    socket.io.on('reconnect', (attemptNumber) => {
      console.log(`🔌 Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔌 Reconnection attempt ${attemptNumber}`);
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
