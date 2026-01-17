import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
}

export const useSocket = (url: string): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!url) return;

    // Initialize socket connection
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('message', (data: any) => {
      setLastMessage(data);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error);
      // Fallback or retry logic can be added here
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [url]);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
  };
};
