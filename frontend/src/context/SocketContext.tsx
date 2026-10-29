import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SocketContext = createContext<ChatSocket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<ChatSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    const s: ChatSocket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
