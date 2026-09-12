import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4003';

export interface UseSocketOptions {
  crewId?: string;
  onEvent?: (event: string, payload: any) => void;
}

export function useSocket(options?: UseSocketOptions) {
  const { token, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        crewId: options?.crewId,
      },
      query: {
        crewId: options?.crewId || '',
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (options?.crewId) {
        socket.emit('subscribe:crew', options.crewId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen to standard emergency events
    const events = [
      'ticket:assigned',
      'ticket:status_changed',
      'ticket:returned',
      'ticket:new',
      'hazard:resolved',
      'hazard:created',
      'road:closed',
      'crew:sos',
      'crew:location_updated',
      'crew:availability_changed',
      'relief:sos_new',
      'relief:updated',
      'relief:shelter_updated',
      'relief:resource_allocated',
    ];

    events.forEach((event) => {
      socket.on(event, (payload: any) => {
        if (options?.onEvent) {
          options.onEvent(event, payload);
        }
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token, options?.crewId]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
