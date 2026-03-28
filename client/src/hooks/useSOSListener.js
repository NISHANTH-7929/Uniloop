import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useCommunity } from "../context/CommunityContext";

const SOCKET_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "http://localhost:5000";

/**
 * useSOSListener
 * Mounted at App root level so SOS alerts fire everywhere in the app.
 * Manages its own socket connection separate from the Chat socket (if any).
 */
const useSOSListener = () => {
    const { user } = useAuth();
    const { setActiveSOS, clearActiveSOS } = useCommunity();
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_user_room", user._id || user.id);
        });

        socket.on("emergency:sos", (data) => {
            setActiveSOS(data);
        });

        socket.on("emergency:resolved", (data) => {
            clearActiveSOS();
        });

        socket.on("badge:awarded", (data) => {
            // Could show a toast — import dynamically to avoid circular deps
            console.info(`🏅 Badge awarded: ${data.badge}`);
        });

        return () => {
            socket.off("emergency:sos");
            socket.off("emergency:resolved");
            socket.off("badge:awarded");
            socket.disconnect();
        };
    }, [user, setActiveSOS, clearActiveSOS]);
};

export default useSOSListener;
