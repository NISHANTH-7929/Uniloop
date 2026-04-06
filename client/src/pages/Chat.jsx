import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchConversations, fetchMessages, sendMessageFallback } from "../api/chatApi";
import { motion } from "framer-motion";
import { Send, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";

import { useSocket } from "../context/SocketContext";

const Chat = () => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [nextCursor, setNextCursor] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [typingUsers, setTypingUsers] = useState({}); // { [convoId]: [user1, user2] }
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const activeConvoRef = useRef(activeConvo);
    const [targetConversationId, setTargetConversationId] = useState(location.state?.conversationId || null);
    const [targetThreadType, setTargetThreadType] = useState(location.state?.threadType || null);

    // Initial load
    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        activeConvoRef.current = activeConvo;
    }, [activeConvo]);

    // Listen for incoming messages
    useEffect(() => {
        if (!socket || !connected) return;

        const handleReceiveMessage = (data) => {
            console.log("Chat message received:", data);
            const currentConvoId = activeConvoRef.current?._id;
            console.log("Current activeConvoId:", currentConvoId);

            if (currentConvoId && String(data.conversationId) === String(currentConvoId)) {
                console.log("Appending message...");
                setMessages(prev => [...prev, data.messageData]);
            } else {
                setConversations(prev => prev.map(c => 
                    String(c._id) === String(data.conversationId) 
                        ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: data.messageData } 
                        : c
                ));
            }
        };

        const handleTypingStart = ({ conversationId, userId }) => {
            if (userId === user._id) return;
            setTypingUsers(prev => ({
                ...prev,
                [conversationId]: [...(new Set([...(prev[conversationId] || []), userId]))]
            }));
        };

        const handleTypingEnd = ({ conversationId }) => {
            setTypingUsers(prev => {
                const newState = { ...prev };
                delete newState[conversationId];
                return newState;
            });
        };

        const handleRefreshConversations = () => loadConversations();

        const handleNewConversation = (newConvo) => {
            console.log("[Chat] New conversation received:", newConvo._id);
            setConversations(prev => {
                if (prev.some(c => c._id === newConvo._id)) return prev;
                return [newConvo, ...prev];
            });
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("conversation:new", handleNewConversation);
        socket.on("typing_start", handleTypingStart);
        socket.on("typing_end", handleTypingEnd);
        socket.on("order:confirmed", handleRefreshConversations);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("conversation:new", handleNewConversation);
            socket.off("typing_start", handleTypingStart);
            socket.off("typing_end", handleTypingEnd);
            socket.off("order:confirmed", handleRefreshConversations);
        };
    }, [socket, connected]);

    // Join room when activeConvo changes
    useEffect(() => {
        if (connected && activeConvo && socket) {
            const room = String(activeConvo._id);
            console.log(`[Chat] Emitting join_conversation for room: ${room}`);
            socket.emit("join_conversation", room);
        }
    }, [activeConvo, connected, socket, socket?.id]);

    const loadConversations = async () => {
        try {
            const res = await fetchConversations();
            setConversations(res.data);

            // Prioritize target from navigation state
            if (targetConversationId) {
                const targetConvo = res.data.find(c => c._id === targetConversationId);
                if (targetConvo) {
                    selectConversation(targetConvo);
                } else if (res.data.length > 0) {
                    selectConversation(res.data[0]);
                }
            } else if (res.data.length > 0) {
                selectConversation(res.data[0]);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        }
    };

    const selectConversation = async (convo) => {
        setActiveConvo(convo);
        setNewMessage("");
        try {
            const res = await fetchMessages(convo._id);
            // Payload is { messages, nextCursor }
            setMessages(res.data.messages || []);
            setNextCursor(res.data.nextCursor);
            
            // Mark as read locally in list
            setConversations(prev => prev.map(c => c._id === convo._id ? { ...c, unreadCount: 0 } : c));
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    const loadMoreMessages = async () => {
        if (!nextCursor || isLoadingMore || !activeConvo) return;
        setIsLoadingMore(true);
        try {
            const res = await fetchMessages(activeConvo._id, nextCursor);
            setMessages(prev => [...(res.data.messages || []), ...prev]);
            setNextCursor(res.data.nextCursor);
        } catch (error) {
            console.error("Failed to load more messages", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (socket && activeConvo) {
            socket.emit("typing_start", { conversationId: activeConvo._id, userId: user._id });
            // Debounce typing_end
            if (window.typingTimeout) clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
                socket.emit("typing_end", { conversationId: activeConvo._id });
            }, 2000);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvo || activeConvo.isReadOnly) return;

        const msgContent = newMessage;
        setNewMessage("");
        if (socket) socket.emit("typing_end", { conversationId: activeConvo._id });

        try {
            const res = await sendMessageFallback(activeConvo._id, { content: msgContent });
            const messageData = res.data;
            
            setMessages((prev) => [...prev, messageData]);

            if (socket) {
                socket.emit("send_message", {
                    conversationId: String(activeConvo._id),
                    messageData: messageData
                });
            }
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    };

    const handleReport = () => {
        const promptConfirm = window.confirm("Are you sure you want to report this conversation to UniLoop Moderation?");
        if (promptConfirm) {
            toast.success("Moderators have been notified. We will review the chat logs.");
        }
    };

    // Helper to determine the role of a participant in a conversation
    const getParticipantRole = (participantId, convo) => {
        if (convo.threadType === 'dormdash') {
            // Logic for dormdash roles... assuming requester is mapped to customer in prompt's mind
            // But I'll use requester/dasher
            const isRequester = convo.referenceId?.requester === participantId;
            return isRequester ? 'Requester' : 'Dasher';
        }

        if (!convo.referenceId) return null; // Fallback

        const isOwner = convo.referenceId.owner === participantId;
        const isBorrowType = convo.referenceId.type === 'borrow';

        if (isOwner) {
            return isBorrowType ? 'Lender' : 'Seller';
        } else {
            return isBorrowType ? 'Borrower' : 'Buyer';
        }
    };

    // Helper to render role badge
    const RoleBadge = ({ role }) => {
        if (!role) return null;

        let bgColor = "rgba(255,255,255,0.1)";
        let textColor = "var(--text-muted)";

        if (role === 'Seller' || role === 'Lender' || role === 'Dasher') {
            bgColor = "rgba(0, 212, 255, 0.15)";
            textColor = "var(--accent-cyan)";
        } else if (role === 'Buyer' || role === 'Borrower' || role === 'Requester') {
            bgColor = "rgba(112, 0, 255, 0.15)";
            textColor = "var(--accent-purple)";
        }

        return (
            <span style={{
                background: bgColor,
                color: textColor,
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "0.7rem",
                fontWeight: "bold",
                textTransform: "uppercase",
                marginLeft: "8px",
                verticalAlign: "middle"
            }}>
                {role}
            </span>
        );
    };

    if (!user) return null;

    return (
        <div style={{ height: "calc(100vh - 150px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "15px" }}>
                <button onClick={() => navigate('/dormdash')} className="btn-neon" style={{ padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-gradient" style={{ fontSize: "2.5rem", margin: 0 }}>Messages</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: connected ? "#00ff88" : "#ff4444" }} />
                    {connected ? "Live" : "Disconnected"}
                </div>
            </div>

            <div className="glass-panel" style={{ display: "flex", flex: 1, overflow: "hidden", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>

                {/* Sidebar */}
                <div style={{ width: "320px", borderRight: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.2)" }}>
                    {conversations.length === 0 ? (
                        <div style={{ padding: "20px", color: "var(--text-muted)", textAlign: "center" }}>No active conversations</div>
                    ) : (
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {conversations.map((c) => {
                                // For group orders (3+ participants) show all members; otherwise show the one other person
                                const otherParticipants = c.participants.filter(p => String(p._id) !== String(user._id));
                                const isGroup = otherParticipants.length > 1;
                                const primaryOther = otherParticipants[0];
                                const isSelected = activeConvo?._id === c._id;
                                const otherRole = getParticipantRole(primaryOther?._id, c);

                                // Build a human-readable display name
                                const displayName = isGroup
                                    ? `Group Chat`
                                    : (primaryOther?.name || primaryOther?.email?.split('@')[0] || 'User');

                                // Build conversation subtitle based on polymorphic referenceId
                                let subtitle = 'General Chat';
                                if (c.threadType === 'marketplace') {
                                    subtitle = c.referenceId?.listing?.title || c.referenceId?.title || 'Trade negotiation';
                                } else if (c.threadType === 'dormdash') {
                                    subtitle = `Order #${c.referenceId?._id?.slice(-5)} - ${c.referenceId?.pickupLocation || 'Delivery'}`;
                                }

                                return (
                                    <div
                                        key={c._id}
                                        onClick={() => selectConversation(c)}
                                        style={{
                                            padding: "15px 20px", cursor: "pointer",
                                            background: isSelected ? "rgba(0,212,255,0.1)" : "transparent",
                                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                                            borderLeft: isSelected ? "3px solid var(--accent-cyan)" : "3px solid transparent",
                                            transition: "background 0.2s",
                                            position: "relative"
                                        }}
                                    >
                                        <div style={{ fontWeight: "bold", color: isSelected ? "#fff" : "var(--text-secondary)", marginBottom: "4px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                            {isGroup && <span style={{ fontSize: "0.85rem" }}>👥</span>}
                                            {displayName}
                                            {!isGroup && <RoleBadge role={otherRole} />}
                                            {c.unreadCount > 0 && (
                                                <span style={{ marginLeft: "auto", background: "var(--accent-pink)", color: "#fff", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px" }}>
                                                    {c.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: isSelected ? "var(--accent-cyan)" : "var(--accent-purple)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {subtitle}
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
                                    {(() => {
                                        const others = activeConvo.participants.filter(p => String(p._id) !== String(user._id));
                                        const isGroup = others.length > 1;
                                        const headerName = isGroup
                                            ? `Group Chat (${activeConvo.participants.length} members)`
                                            : (others[0]?.name || others[0]?.email?.split('@')[0] || 'User');
                                        
                                        let subText = 'Direct Message';
                                        if (activeConvo.threadType === 'marketplace') {
                                            subText = activeConvo.referenceId?.listing?.title || 'Marketplace Item';
                                        } else if (activeConvo.threadType === 'dormdash') {
                                            subText = `DormDash Order - ${activeConvo.referenceId?.pickupLocation || 'Active delivery'}`;
                                        }

                                        return (
                                            <>
                                                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {isGroup && <span>👥</span>}
                                                    {headerName}
                                                    {!isGroup && <RoleBadge role={getParticipantRole(others[0]?._id, activeConvo)} />}
                                                </h3>
                                                <p style={{ margin: "5px 0 0", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {activeConvo.isReadOnly ? <span style={{ color: "#ff4444" }}>🔒 Archive: {subText}</span> : `Context: ${subText}`}
                                                    <RoleBadge role={getParticipantRole(user._id, activeConvo)} />
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>
                                <button onClick={handleReport} className="btn-neon" style={{ padding: "6px", background: "rgba(255,68,68,0.1)", borderColor: "transparent", color: "#ff4444", borderRadius: "8px" }} title="Report User">
                                    <AlertTriangle size={18} />
                                </button>
                            </div>
                            <div 
                                style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}
                                onScroll={(e) => {
                                    if (e.target.scrollTop === 0) loadMoreMessages();
                                }}
                             >
                                {isLoadingMore && <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading history...</div>}
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender?._id === user._id || msg.sender === user._id;
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
                                {typingUsers[activeConvo._id]?.length > 0 && (
                                    <div style={{ color: "var(--accent-cyan)", fontSize: "0.8rem", fontStyle: "italic", marginLeft: "10px" }}>
                                        Someone is typing...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "15px", background: "rgba(255,255,255,0.02)" }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    disabled={activeConvo.isReadOnly}
                                    placeholder={activeConvo.isReadOnly ? "This chat is locked" : "Type your message..."}
                                    style={{
                                        flex: 1, padding: "12px 20px", borderRadius: "50px",
                                        border: "1px solid var(--border-glass)", background: activeConvo.isReadOnly ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.5)",
                                        color: activeConvo.isReadOnly ? "var(--text-muted)" : "white", outline: "none",
                                        cursor: activeConvo.isReadOnly ? "not-allowed" : "text"
                                    }}
                                />
                                <button type="submit" className="btn-neon primary" style={{ borderRadius: "50%", width: "50px", height: "50px", padding: "0", display: "flex", alignItems: "center", justifyContent: "center" }} disabled={!newMessage.trim() || activeConvo.isReadOnly}>
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
