import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    // Initialize socket ONCE on mount — independent of user state
    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || import.meta.env.VITE_API_URI || "http://localhost:5000";
        console.log("[SocketContext] Initializing socket with base:", API_BASE);

        const socketInstance = io(API_BASE, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            console.log("[SocketContext] Global socket connected:", socketInstance.id);
            setConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log("[SocketContext] Global socket disconnected");
            setConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error("[SocketContext] Connection error:", error);
        });

        return () => {
            console.log("[SocketContext] Cleaning up global socket");
            socketInstance.disconnect();
        };
    }, []);

    // Join personal room whenever user is available OR socket reconnects
    // This runs after both the socket is ready AND the user is loaded
    useEffect(() => {
        if (connected && socketRef.current && user?._id) {
            console.log("[SocketContext] Joining personal room:", user._id);
            socketRef.current.emit('join', user._id.toString());
        }
    }, [user?._id, connected]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
