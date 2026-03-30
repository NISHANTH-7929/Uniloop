import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useCommunity } from "../context/CommunityContext";
import { toast } from "react-toastify";

const SOCKET_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URI || "http://localhost:5000";

/**
 * useCommunitySocket
 * Registers ALL community-specific socket listeners.
 * Used inside community pages only. Cleans up on unmount.
 */
const useCommunitySocket = () => {
    const { user } = useAuth();
    const { dispatch } = useCommunity();
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_user_room", user._id || user.id);
        });

        // Lost & Found
        socket.on("lostfound:match", (data) => {
            toast.info(`🔍 Match found! Item: "${data.foundItemTitle}" at ${data.locationTag}`);
        });
        socket.on("lostfound:claimRequest", (data) => {
            toast.info(`📦 ${data.claimerName} wants to claim your item!`);
        });
        socket.on("lostfound:claimed", (data) => {
            toast.success(`✅ Your claim was approved by ${data.finderName}!`);
        });
        socket.on("lostfound:expired", (data) => {
            toast.warn(`⏰ Your item "${data.itemTitle}" has expired and been archived.`);
        });
        socket.on("lostfound:reviewRevealed", () => {
            toast.info("⭐ Both reviews submitted — check your L&F item!");
        });

        // Emergency
        socket.on("emergency:blood", (data) => {
            toast.error(`🩸 Blood Needed (${data.bloodType}): ${data.title} at ${data.location}`);
        });
        socket.on("emergency:responded", (data) => {
            toast.info(`🆘 ${data.responder} responded to your emergency.`);
        });
        socket.on("emergency:resolved", () => {
            toast.success("Emergency resolved.");
        });

        // Tutoring
        socket.on("tutoring:matched", () => toast.success("🎓 Tutoring match found!"));
        socket.on("tutoring:scheduled", (data) => toast.info(`📅 Session scheduled for ${new Date(data.scheduledAt).toLocaleDateString()}`));
        socket.on("tutoring:completed", () => toast.success("✅ Session completed!"));
        socket.on("tutoring:reviewRevealed", () => toast.info("⭐ Tutoring reviews revealed!"));

        // Skills
        socket.on("skills:matched", () => toast.success("🤝 Skill exchange matched!"));
        socket.on("skills:completed", () => toast.success("✅ Skill exchange complete!"));
        socket.on("skills:reviewRevealed", () => toast.info("⭐ Skill reviews revealed!"));

        // Q&A
        socket.on("qa:answered", () => toast.info("💬 Someone answered your question!"));
        socket.on("qa:upvoted", () => toast.success("👍 Your answer got an upvote!"));
        socket.on("qa:solved", () => toast.success("🏆 Your answer was marked as the solution!"));

        // Complaints
        socket.on("complaint:responded", (data) => {
            toast.info(`📋 Admin responded to your complaint: ${data.adminResponse}`);
        });
        socket.on("complaint:metooed", (data) => {
            toast.info(`👥 Your complaint now has ${data.count} Me Too votes!`);
        });

        // Notices
        socket.on("notice:new", () => {
            dispatch({ type: "SET_LOADING", payload: false }); // trigger refetch hint
        });

        return () => {
            const events = [
                "lostfound:match","lostfound:claimRequest","lostfound:claimed",
                "lostfound:expired","lostfound:reviewRevealed",
                "emergency:blood","emergency:responded","emergency:resolved",
                "tutoring:matched","tutoring:scheduled","tutoring:completed","tutoring:reviewRevealed",
                "skills:matched","skills:completed","skills:reviewRevealed",
                "qa:answered","qa:upvoted","qa:solved",
                "complaint:responded","complaint:metooed","notice:new",
            ];
            events.forEach(e => socket.off(e));
            socket.disconnect();
        };
    }, [user, dispatch]);

    return socketRef;
};

export default useCommunitySocket;
