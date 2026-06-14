import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine backend host url (default port 5000)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://deskguard-4adh.onrender.com';
    
    // Connect socket with user details if available
    const socketOptions = {
      query: {
        userId: user ? user.id : 'anonymous'
      },
      autoConnect: true
    };

    const newSocket = io(backendUrl, socketOptions);
    setSocket(newSocket);

    console.log(`[Socket] Attempting connection for User: ${user ? user.username : 'anonymous'}`);

    newSocket.on('connect', () => {
      console.log(`[Socket] Connected: ID=${newSocket.id}`);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context; // Can be null if socket is not initialized
};
