import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchConversations, fetchMessages, sendMessageFallback } from "../api/chatApi";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { Send, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";

const Chat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    // Initial setup
    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URI || "http://localhost:5000";
        const newSocket = io(API_BASE); // Adjust for prod
        setSocket(newSocket);

        loadConversations();

        return () => newSocket.close();
    }, []);

    const loadConversations = async () => {
        try {
            const res = await fetchConversations();
            setConversations(res.data);
            if (res.data.length > 0) {
                selectConversation(res.data[0]);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        }
    };

    const selectConversation = async (convo) => {
        setActiveConvo(convo);
        try {
            const res = await fetchMessages(convo._id);
            setMessages(res.data);

            if (socket) {
                socket.emit("join_conversation", convo._id);
            }
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    useEffect(() => {
        if (socket) {
            socket.on("receive_message", (data) => {
                if (activeConvo && data.conversationId === activeConvo._id) {
                    setMessages((prev) => [...prev, data.messageData]);
                }
            });
        }
        return () => {
            if (socket) socket.off("receive_message");
        };
    }, [socket, activeConvo]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvo) return;

        const msgContent = newMessage;
        setNewMessage("");

        try {
            // Use HTTP to persist map
            const res = await sendMessageFallback(activeConvo._id, { content: msgContent });

            const messageData = res.data;
            // Optimistic local update
            setMessages((prev) => [...prev, { ...messageData, sender: { _id: user._id, email: user.email } }]);

            // Broadcast via socket
            socket.emit("send_message", {
                conversationId: activeConvo._id,
                messageData: { ...messageData, sender: { _id: user._id, email: user.email } }
            });

        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message");
        }
    };

    const handleReport = () => {
        // Mock prompt to report a user in the chat
        const promptConfirm = window.confirm("Are you sure you want to report this conversation to UniLoop Moderation?");
        if (promptConfirm) {
            toast.success("Moderators have been notified. We will review the chat logs.");
        }
    };

    if (!user) return null;

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column" }}>
            <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "20px" }}>Messages</h1>

            <div className="glass-panel" style={{ display: "flex", flex: 1, overflow: "hidden", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>

                {/* Sidebar */}
                <div style={{ width: "300px", borderRight: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.2)" }}>
                    {conversations.length === 0 ? (
                        <div style={{ padding: "20px", color: "var(--text-muted)", textAlign: "center" }}>No active conversations</div>
                    ) : (
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {conversations.map((c) => {
                                const otherParticipant = c.participants.find(p => p._id !== user._id);
                                const isSelected = activeConvo?._id === c._id;

                                return (
                                    <div
                                        key={c._id}
                                        onClick={() => selectConversation(c)}
                                        style={{
                                            padding: "15px 20px", cursor: "pointer",
                                            background: isSelected ? "rgba(0,212,255,0.1)" : "transparent",
                                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                                            borderLeft: isSelected ? "3px solid var(--accent-cyan)" : "3px solid transparent",
                                            transition: "background 0.2s"
                                        }}
                                    >
                                        <div style={{ fontWeight: "bold", color: isSelected ? "#fff" : "var(--text-secondary)", marginBottom: "4px", fontSize: "0.95rem" }}>
                                            {otherParticipant?.email.split('@')[0]}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--accent-purple)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {c.tradeRequest?.listing?.title || "Trade Negotiation"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.4)", position: "relative" }}>
                    {activeConvo ? (
                        <>
                            {/* Chat Header */}
                            <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                                <div>
                                    <h3 style={{ margin: 0, color: "#fff", fontSize: "1.2rem" }}>
                                        {activeConvo.participants.find(p => p._id !== user._id)?.email.split('@')[0]}
                                    </h3>
                                    <p style={{ margin: "5px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                        Re: {activeConvo.tradeRequest?.listing?.title}
                                    </p>
                                </div>
                                <button onClick={handleReport} className="btn-neon" style={{ padding: "6px", background: "rgba(255,68,68,0.1)", borderColor: "transparent", color: "#ff4444", borderRadius: "8px" }}>
                                    <AlertTriangle size={18} />
                                </button>
                            </div>

                            {/* Messages Container */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender._id === user._id;
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg._id || i}
                                            style={{
                                                alignSelf: isMe ? "flex-end" : "flex-start",
                                                maxWidth: "70%",
                                                background: isMe ? "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(112,0,255,0.2) 100%)" : "rgba(255,255,255,0.05)",
                                                border: isMe ? "1px solid rgba(0,212,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                                                padding: "12px 16px",
                                                borderRadius: isMe ? "16px 16px 0 16px" : "16px 16px 16px 0",
                                            }}
                                        >
                                            <div style={{ color: "#fff", fontSize: "0.95rem", lineHeight: "1.4" }}>{msg.content}</div>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center", marginTop: "5px", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                                                {format(new Date(msg.createdAt || Date.now()), 'p')}
                                                {isMe && msg.isRead && <span style={{ color: "var(--accent-cyan)", marginLeft: "4px" }}>✓✓</span>}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "15px", background: "rgba(255,255,255,0.02)" }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    style={{
                                        flex: 1, padding: "12px 20px", borderRadius: "50px",
                                        border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.5)",
                                        color: "white", outline: "none"
                                    }}
                                />
                                <button type="submit" className="btn-neon primary" style={{ borderRadius: "50%", width: "50px", height: "50px", padding: "0", display: "flex", alignItems: "center", justifyContent: "center" }} disabled={!newMessage.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "15px", opacity: 0.5 }}>💬</div>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chat;
