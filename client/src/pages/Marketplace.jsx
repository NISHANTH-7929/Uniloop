import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchListings, fetchCategories, createListing, fetchMyListings, deleteListing, updateListingStatus } from "../api/listingApi";
import { createTradeRequest, fetchMyTrades, respondToTrade, completeTrade } from "../api/tradeApi";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "../api/wishlistApi";
import { fetchConversations, fetchMessages, sendMessageFallback } from "../api/chatApi";
import { toast } from "react-toastify";
import { Search, MapPin, Tag, Heart, MessageCircle, Package, RefreshCcw, Plus, Trash2, CheckCircle, XCircle, ShoppingBag, X, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { format } from "date-fns";

/* ─── helpers ─── */
const getListingBg = (type) => {
    switch (type) {
        case 'sell':   return 'rgba(0,212,255,0.08)';
        case 'rent':   return 'rgba(255,0,200,0.08)';
        case 'borrow': return 'rgba(112,0,255,0.08)';
        default:       return 'rgba(255,255,255,0.04)';
    }
};
const getListingColor = (type) => {
    switch (type) {
        case 'sell':   return 'var(--accent-cyan)';
        case 'rent':   return 'var(--accent-pink)';
        case 'borrow': return 'var(--accent-purple)';
        default:       return 'var(--text-secondary)';
    }
};
const statusBadge = (status) => {
    const map = {
        available: { bg: 'rgba(0,255,136,0.15)', color: '#00ff88', label: 'Available' },
        pending:   { bg: 'rgba(255,215,0,0.15)',  color: '#ffd700', label: 'Pending' },
        completed: { bg: 'rgba(0,212,255,0.15)',   color: 'var(--accent-cyan)', label: 'Completed' },
        expired:   { bg: 'rgba(255,68,68,0.15)',   color: '#ff4444', label: 'Expired' },
        cancelled: { bg: 'rgba(255,68,68,0.15)',   color: '#ff4444', label: 'Cancelled' },
    };
    return map[status] || { bg: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', label: status };
};
const tradeBadge = (status) => {
    const map = {
        pending:   { bg: 'rgba(255,215,0,0.15)',  color: '#ffd700', label: '⏳ Pending' },
        accepted:  { bg: 'rgba(0,255,136,0.15)',   color: '#00ff88', label: '✅ Accepted' },
        rejected:  { bg: 'rgba(255,68,68,0.15)',   color: '#ff4444', label: '❌ Rejected' },
        completed: { bg: 'rgba(0,212,255,0.15)',   color: 'var(--accent-cyan)', label: '🏁 Completed' },
        cancelled: { bg: 'rgba(255,68,68,0.15)',   color: '#ff4444', label: '🚫 Cancelled' },
    };
    return map[status] || { bg: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', label: status };
};

const inputStyle = {
    width: "100%", padding: "12px", borderRadius: "8px",
    border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)",
    color: "white", outline: "none"
};
const selectStyle = { ...inputStyle };

/* ─── tab definitions ─── */
const TABS = [
    { id: 'browse',     icon: <ShoppingBag size={16} />, label: 'Browse' },
    { id: 'mylistings', icon: <Package size={16} />,     label: 'My Listings' },
    { id: 'mytrades',   icon: <RefreshCcw size={16} />,  label: 'My Trades' },
    { id: 'messages',   icon: <MessageCircle size={16} />, label: 'Messages' },
];

/* ═══════════════════════════════════════ */
const Marketplace = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    /* global state */
    const [activeTab, setActiveTab] = useState('browse');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    /* browse */
    const [listings, setListings] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [listingTypeFilter, setListingTypeFilter] = useState("all");
    // Map<listingId, wishlistDocId> so we can remove by wishlist doc id
    const [wishlistMap, setWishlistMap] = useState(new Map());
    const [selectedListing, setSelectedListing] = useState(null);
    const [tradeMessage, setTradeMessage] = useState("");
    const [submittingTrade, setSubmittingTrade] = useState(false);

    /* my listings */
    const [myListings, setMyListings] = useState([]);
    const [myListingsLoading, setMyListingsLoading] = useState(false);

    /* my trades */
    const [myTrades, setMyTrades] = useState([]);
    const [myTradesLoading, setMyTradesLoading] = useState(false);

    /* create listing modal */
    const [isCreatingListing, setIsCreatingListing] = useState(false);
    const [newListing, setNewListing] = useState({ title: "", description: "", price: "", category: "", listingType: "sell", condition: "New" });

    /* ── messages tab state ── */
    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMsg, setNewChatMsg] = useState("");
    const { socket: chatSocket, connected: chatSocketConnected } = useSocket();
    const messagesEndRef = useRef(null);
    const activeConvoRef = useRef(activeConvo);

    /* ── initial load ── */
    useEffect(() => {
        const init = async () => {
            try {
                const [listingsRes, categoriesRes, wishlistRes] = await Promise.all([
                    fetchListings(),
                    fetchCategories(),
                    fetchWishlist().catch(() => ({ data: [] }))
                ]);
                setListings(listingsRes.data);
                setCategories(categoriesRes.data);
                // Build a map from listingId -> wishlistDocId
                const wMap = new Map();
                (wishlistRes.data || []).forEach(w => {
                    const lid = w.listing?._id || w.listing;
                    if (lid) wMap.set(String(lid), w._id);
                });
                setWishlistMap(wMap);
            } catch (err) {
                console.error(err);
                toast.error("Error loading marketplace");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    /* ── load my listings on tab switch ── */
    useEffect(() => {
        if (activeTab === 'mylistings' && myListings.length === 0) {
            loadMyListings();
        }
        if (activeTab === 'mytrades' && myTrades.length === 0) {
            loadMyTrades();
        }
        if (activeTab === 'messages') {
            fetchConversations().then(res => {
                setConversations(res.data);
                if (res.data.length > 0 && !activeConvo) selectConvo(res.data[0]);
            }).catch(() => {});
        }
    }, [activeTab]);

    const loadMyListings = async () => {
        setMyListingsLoading(true);
        try {
            const res = await fetchMyListings();
            setMyListings(res.data);
        } catch (err) {
            toast.error("Could not load your listings");
        } finally {
            setMyListingsLoading(false);
        }
    };

    const loadMyTrades = async () => {
        setMyTradesLoading(true);
        try {
            const res = await fetchMyTrades();
            setMyTrades(res.data);
        } catch (err) {
            toast.error("Could not load your trades");
        } finally {
            setMyTradesLoading(false);
        }
    };

    /* ── filtering ── */
    const filteredListings = listings.filter(l => {
        const matchesCat  = activeCategory === "All" || l.category?.name === activeCategory;
        const matchesQ    = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = listingTypeFilter === "all" || l.listingType === listingTypeFilter;
        return matchesCat && matchesQ && matchesType;
    });

    const isDefaultView = !searchQuery && listingTypeFilter === "all" && activeCategory === "All";
    let trendingListings = [], recentlyAddedListings = [], generalListings = filteredListings;

    if (isDefaultView && filteredListings.length > 0) {
        trendingListings = [...filteredListings].sort((a, b) => (b.seller?.trustScore || 0) - (a.seller?.trustScore || 0)).slice(0, 4);
        const trendIds = new Set(trendingListings.map(i => i._id));
        recentlyAddedListings = [...filteredListings].filter(i => !trendIds.has(i._id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
        const recentIds = new Set(recentlyAddedListings.map(i => i._id));
        generalListings = filteredListings.filter(i => !trendIds.has(i._id) && !recentIds.has(i._id));
    }

    /* ── actions ── */
    const handleWishlistToggle = async (e, listingId) => {
        e.stopPropagation();
        const key = String(listingId);
        try {
            if (wishlistMap.has(key)) {
                // Remove: send wishlist document ID
                await removeFromWishlist(wishlistMap.get(key));
                setWishlistMap(prev => { const next = new Map(prev); next.delete(key); return next; });
            } else {
                // Add: receive new wishlist doc
                const res = await addToWishlist(listingId);
                const docId = res.data?._id;
                setWishlistMap(prev => { const next = new Map(prev); next.set(key, docId); return next; });
            }
        } catch {
            toast.error("Could not update wishlist");
        }
    };

    const handleTradeSubmit = async (e) => {
        e.preventDefault();
        setSubmittingTrade(true);
        try {
            await createTradeRequest({ listingId: selectedListing._id, type: selectedListing.listingType, message: tradeMessage });
            toast.success("Trade request sent! Opening Messages…");
            setSelectedListing(null);
            setTradeMessage("");
            setActiveTab('messages');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send trade request");
        } finally {
            setSubmittingTrade(false);
        }
    };

    const handleCreateListing = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newListing, price: newListing.listingType === "borrow" ? 0 : Number(newListing.price) };
            const res = await createListing(payload);
            toast.success("Listing created!");
            setListings([res.data, ...listings]);
            setMyListings([res.data, ...myListings]);
            setIsCreatingListing(false);
            setNewListing({ title: "", description: "", price: "", category: "", listingType: "sell", condition: "New" });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create listing");
        }
    };

    const handleDeleteListing = async (id) => {
        if (!window.confirm("Delete this listing?")) return;
        try {
            await deleteListing(id);
            setMyListings(prev => prev.filter(l => l._id !== id));
            setListings(prev => prev.filter(l => l._id !== id));
            toast.success("Listing deleted");
        } catch {
            toast.error("Could not delete listing");
        }
    };

    const handleMarkSold = async (id) => {
        try {
            await updateListingStatus(id, 'completed');
            setMyListings(prev => prev.map(l => l._id === id ? { ...l, status: 'completed' } : l));
            toast.success("Marked as completed");
        } catch {
            toast.error("Could not update listing");
        }
    };

    const handleRespondTrade = async (id, response) => {
        try {
            await respondToTrade(id, { status: response });
            setMyTrades(prev => prev.map(t => t._id === id ? { ...t, status: response } : t));
            toast.success(`Trade ${response}`);
        } catch {
            toast.error("Could not update trade");
        }
    };

    const handleCompleteTrade = async (id) => {
        try {
            await completeTrade(id);
            setMyTrades(prev => prev.map(t => t._id === id ? { ...t, status: 'completed' } : t));
            toast.success("Trade marked complete!");
        } catch {
            toast.error("Could not complete trade");
        }
    };

    /* ── inline chat helpers ── */
    const openChat = async () => {
        setActiveTab('messages');
        try {
            const res = await fetchConversations();
            setConversations(res.data);
            if (res.data.length > 0 && !activeConvo) selectConvo(res.data[0]);
        } catch { /* silent */ }
    };

    const selectConvo = async (convo) => {
        setActiveConvo(convo);
        try {
            const res = await fetchMessages(convo._id);
            setChatMessages(res.data);
        } catch { /* silent */ }
    };

    useEffect(() => {
        activeConvoRef.current = activeConvo;
    }, [activeConvo]);

    // Global socket listeners for this component
    useEffect(() => {
        if (!chatSocket || !chatSocketConnected || activeTab !== 'messages') return;

        const handleReceiveMessage = (data) => {
            console.log("Marketplace message received via global socket:", data);
            const currentConvoId = activeConvoRef.current?._id;
            if (currentConvoId && String(data.conversationId) === String(currentConvoId)) {
                setChatMessages(prev => [...prev, data.messageData]);
            }
        };

        chatSocket.on('receive_message', handleReceiveMessage);
        return () => {
            chatSocket.off('receive_message', handleReceiveMessage);
        };
    }, [chatSocket, chatSocketConnected, activeTab]);

    // Join room when activeConvo or connection status changes
    useEffect(() => {
        if (chatSocketConnected && activeConvo && chatSocket) {
            const room = String(activeConvo._id);
            console.log(`[Marketplace] Emitting join_conversation for room: ${room}`);
            chatSocket.emit('join_conversation', room);
        }
    }, [activeConvo, chatSocketConnected, chatSocket, chatSocket?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendChatMsg = async (e) => {
        e.preventDefault();
        if (!newChatMsg.trim() || !activeConvo) return;
        const content = newChatMsg;
        setNewChatMsg("");
        try {
            const res = await sendMessageFallback(activeConvo._id, { content });
            const md = res.data;
            setChatMessages(prev => [...prev, { ...md, sender: { _id: user._id, email: user.email } }]);
            if (chatSocket) {
                chatSocket.emit('send_message', { 
                    conversationId: String(activeConvo._id), 
                    messageData: { ...md, sender: { _id: user._id, email: user.email } } 
                });
            }
        } catch { toast.error("Failed to send message"); }
    };

    /* ─────────────────── Render helpers ─────────────────── */
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };

    const ListingCard = ({ item, onClick }) => {
        const isWished = wishlistMap.has(String(item._id));
        const emoji = { sell: '🛒', rent: '🔑', borrow: '🤝' }[item.listingType] || '📦';
        return (
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
                whileHover={{ y: -5, boxShadow: `0 12px 40px ${getListingBg(item.listingType)}` }}
                className="glass-panel"
                style={{ padding: "22px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", cursor: "pointer" }}
                onClick={onClick}
            >
                {/* Glow blob */}
                <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "130px", height: "130px", background: getListingBg(item.listingType), filter: "blur(35px)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />

                {/* Wishlist button */}
                <button
                    onClick={(e) => handleWishlistToggle(e, item._id)}
                    style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2, transition: "transform 0.2s" }}
                    title={isWished ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart size={16} fill={isWished ? "#ff4081" : "none"} color={isWished ? "#ff4081" : "#888"} />
                </button>

                <div style={{ zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>{emoji}</span>
                        <span style={{ color: getListingColor(item.listingType), fontWeight: "bold", fontSize: "1.05rem" }}>
                            {item.listingType === 'borrow' ? 'Free (Borrow)' : `₹${item.price}`}
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <span style={{ background: "rgba(255,255,255,0.06)", padding: "3px 9px", borderRadius: "4px", fontSize: "0.73rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                            {item.category?.name || "General"}
                        </span>
                        <span style={{ background: getListingBg(item.listingType), color: getListingColor(item.listingType), padding: "3px 9px", borderRadius: "4px", fontSize: "0.73rem", textTransform: "capitalize", border: `1px solid ${getListingColor(item.listingType)}33` }}>
                            {item.listingType}
                        </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", color: "#fff", lineHeight: 1.3 }}>{item.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.description}
                    </p>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                            <MapPin size={13} />
                            {item.meetupLocations?.length > 0 ? item.meetupLocations[0].campus : "Campus General"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, background: item.seller?.trustScore > 80 ? "#00ff88" : item.seller?.trustScore > 50 ? "#ffd700" : "#ff4444" }} />
                            Trust Score: {item.seller?.trustScore || 100}%
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const SectionGrid = ({ items, title }) => (
        <div>
            <h2 style={{ color: "#fff", marginBottom: "18px", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "10px" }}>{title}</h2>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "22px" }}>
                {items.map(item => <ListingCard key={item._id} item={item} onClick={() => setSelectedListing(item)} />)}
            </motion.div>
        </div>
    );

    /* ─── My Listings tab body ─── */
    const MyListingsTab = () => (
        <div>
            {myListingsLoading ? (
                <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>Loading your listings…</div>
            ) : myListings.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: "center", padding: "60px 30px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📦</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>You haven't listed anything yet.</p>
                    <button className="btn-neon primary" onClick={() => setIsCreatingListing(true)} style={{ marginTop: "15px", padding: "10px 24px" }}>+ Create First Listing</button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {myListings.map(item => {
                        const badge = statusBadge(item.status);
                        const emoji = { sell: '🛒', rent: '🔑', borrow: '🤝' }[item.listingType] || '📦';
                        return (
                            <motion.div key={item._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "18px" }}>
                                <div style={{ fontSize: "2rem", flexShrink: 0 }}>{emoji}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                                        <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h3>
                                        <span style={{ background: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "bold" }}>{badge.label}</span>
                                        <span style={{ color: getListingColor(item.listingType), fontSize: "0.85rem", fontWeight: "bold" }}>
                                            {item.listingType === 'borrow' ? 'Free' : `₹${item.price}`}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
                                    {item.createdAt && <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.75rem" }}>Listed {format(new Date(item.createdAt), 'MMM d, yyyy')}</p>}
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                    {item.status === 'available' && (
                                        <button className="btn-neon" title="Mark as Completed" onClick={() => handleMarkSold(item._id)} style={{ padding: "7px 12px", fontSize: "0.8rem", background: "rgba(0,255,136,0.08)", borderColor: "#00ff8844" }}>
                                            <CheckCircle size={15} /> <span style={{ marginLeft: 4 }}>Sold</span>
                                        </button>
                                    )}
                                    <button className="btn-neon" title="Delete listing" onClick={() => handleDeleteListing(item._id)} style={{ padding: "7px 12px", fontSize: "0.8rem", background: "rgba(255,68,68,0.08)", borderColor: "#ff444444", color: "#ff4444" }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ─── My Trades tab body ─── */
    const MyTradesTab = () => {
        const incoming = myTrades.filter(t => t.owner === user?._id || t.owner?._id === user?._id);
        const outgoing = myTrades.filter(t => t.requester === user?._id || t.requester?._id === user?._id);

        const TradeCard = ({ trade, isIncoming }) => {
            const badge = tradeBadge(trade.status);
            const other = isIncoming ? (trade.requester?.email || 'Someone') : (trade.owner?.email || 'Seller');
            return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: "18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "1.8rem", flexShrink: 0 }}>🔄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
                            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "0.95rem" }}>{trade.listing?.title || "Unknown Item"}</span>
                            <span style={{ background: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "bold" }}>{badge.label}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            {isIncoming ? `From: ${other.split('@')[0]}` : `To: ${other.split('@')[0]}`}
                        </p>
                        {trade.message && <p style={{ margin: "0 0 4px", color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>"{trade.message}"</p>}
                        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.75rem" }}>{format(new Date(trade.createdAt || Date.now()), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                    {isIncoming && trade.status === 'pending' && (
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button className="btn-neon" onClick={() => handleRespondTrade(trade._id, 'accepted')} style={{ padding: "7px 12px", background: "rgba(0,255,136,0.08)", borderColor: "#00ff8855", color: "#00ff88", fontSize: "0.8rem" }}>
                                <CheckCircle size={14} /> Accept
                            </button>
                            <button className="btn-neon" onClick={() => handleRespondTrade(trade._id, 'rejected')} style={{ padding: "7px 12px", background: "rgba(255,68,68,0.08)", borderColor: "#ff444455", color: "#ff4444", fontSize: "0.8rem" }}>
                                <XCircle size={14} /> Reject
                            </button>
                        </div>
                    )}
                    {trade.status === 'accepted' && (
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button className="btn-neon primary" onClick={() => handleCompleteTrade(trade._id)} style={{ padding: "7px 14px", fontSize: "0.8rem" }}>
                                🏁 Complete
                            </button>
                            <button className="btn-neon" onClick={() => setActiveTab('messages')} style={{ padding: "7px 12px", fontSize: "0.8rem" }}>
                                <MessageCircle size={14} /> Chat
                            </button>
                        </div>
                    )}
                    {trade.status === 'completed' && (
                        <button className="btn-neon" onClick={() => setActiveTab('messages')} style={{ padding: "7px 12px", fontSize: "0.8rem", flexShrink: 0 }}>
                            <MessageCircle size={14} /> Chat
                        </button>
                    )}
                </motion.div>
            );
        };

        if (myTradesLoading) return <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>Loading trades…</div>;
        if (myTrades.length === 0) return (
            <div className="glass-panel" style={{ textAlign: "center", padding: "60px 30px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🔄</div>
                <p style={{ color: "var(--text-muted)" }}>No trade requests yet. Browse listings to make your first trade!</p>
            </div>
        );

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                {incoming.length > 0 && (
                    <div>
                        <h3 style={{ color: "var(--accent-cyan)", marginBottom: "14px", fontSize: "1.1rem" }}>📥 Incoming Requests ({incoming.length})</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {incoming.map(t => <TradeCard key={t._id} trade={t} isIncoming={true} />)}
                        </div>
                    </div>
                )}
                {outgoing.length > 0 && (
                    <div>
                        <h3 style={{ color: "var(--accent-purple)", marginBottom: "14px", fontSize: "1.1rem" }}>📤 Your Requests ({outgoing.length})</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {outgoing.map(t => <TradeCard key={t._id} trade={t} isIncoming={false} />)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /* ─── Main render ─── */
    return (
        <div style={{ padding: "100px 20px 60px", maxWidth: "1200px", margin: "0 auto" }}>

            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: "2.8rem", marginBottom: "6px" }}>Marketplace</h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>Buy, sell, rent &amp; borrow within the UniLoop network.</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.2)", padding: "6px 12px", borderRadius: "12px", border: "1px solid var(--border-glass)", marginLeft: "auto" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: chatSocketConnected ? "#00ff88" : "#ff4444" }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{chatSocketConnected ? "Live Connection" : "Offline"}</span>
                    </div>
                    <button onClick={() => setIsCreatingListing(true)} className="btn-neon primary" style={{ padding: "10px 22px", display: "flex", alignItems: "center", gap: "8px", height: "fit-content" }}>
                        <Plus size={18} /> List Item
                    </button>
                </div>
            </motion.div>

            {/* Tab Bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: "flex", gap: "6px", marginBottom: "28px", background: "rgba(0,0,0,0.3)", padding: "6px", borderRadius: "14px", border: "1px solid var(--border-glass)", flexWrap: "wrap" }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: "1 1 auto", padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            fontWeight: activeTab === tab.id ? "700" : "400",
                            fontSize: "0.9rem",
                            background: activeTab === tab.id ? "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(112,0,255,0.2))" : "transparent",
                            color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
                            boxShadow: activeTab === tab.id ? "0 0 20px rgba(0,212,255,0.1)" : "none",
                            outline: activeTab === tab.id ? "1px solid rgba(0,212,255,0.25)" : "none",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* ── Browse Tab ── */}
            {activeTab === 'browse' && (
                <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Search & Filter Row */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "400px" }}>
                            <Search size={17} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input type="text" placeholder="Search items…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }} />
                        </div>
                        <select value={listingTypeFilter} onChange={e => setListingTypeFilter(e.target.value)}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }}>
                            <option value="all">Any Type</option>
                            <option value="sell">For Sale</option>
                            <option value="rent">For Rent</option>
                            <option value="borrow">Borrow-Ready</option>
                        </select>
                        <button onClick={() => setListingTypeFilter(listingTypeFilter === 'borrow' ? 'all' : 'borrow')}
                            className="btn-neon"
                            style={{ padding: "10px 18px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "7px", background: listingTypeFilter === 'borrow' ? 'var(--accent-purple)' : 'rgba(112,0,255,0.1)', borderColor: 'var(--accent-purple)', color: listingTypeFilter === 'borrow' ? '#fff' : 'var(--accent-purple)' }}>
                            <Tag size={15} /> Borrow-Ready
                        </button>
                    </div>

                    {/* Category Row */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }} className="hide-scrollbar">
                        {["All", ...categories.map(c => c.name)].map((cat, i) => (
                            <button key={i} onClick={() => setActiveCategory(cat)} className={`btn-neon ${cat === activeCategory ? 'primary' : ''}`}
                                style={{ flexShrink: 0, padding: "5px 15px", fontSize: "0.82rem", borderRadius: "20px", background: cat === activeCategory ? '' : 'rgba(255,255,255,0.04)', borderColor: cat === activeCategory ? '' : 'rgba(255,255,255,0.09)' }}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading marketplace…</div>
                    ) : filteredListings.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>No listings match your search.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                            {trendingListings.length > 0 && isDefaultView && <SectionGrid items={trendingListings} title="🔥 Trending on Campus" />}
                            {recentlyAddedListings.length > 0 && isDefaultView && <SectionGrid items={recentlyAddedListings} title="✨ Recently Added" />}
                            {(generalListings.length > 0 || !isDefaultView) && (
                                <SectionGrid items={generalListings} title={!isDefaultView ? "Search Results" : "More Listings"} />
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── My Listings Tab ── */}
            {activeTab === 'mylistings' && (
                <motion.div key="mylistings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                        <h2 style={{ color: "#fff", margin: 0, fontSize: "1.4rem" }}>📦 My Listings</h2>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button className="btn-neon" onClick={loadMyListings} style={{ padding: "8px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                <RefreshCcw size={14} /> Refresh
                            </button>
                            <button className="btn-neon primary" onClick={() => setIsCreatingListing(true)} style={{ padding: "8px 18px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Plus size={14} /> New Listing
                            </button>
                        </div>
                    </div>
                    <MyListingsTab />
                </motion.div>
            )}

            {/* ── My Trades Tab ── */}
            {activeTab === 'mytrades' && (
                <motion.div key="mytrades" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                        <h2 style={{ color: "#fff", margin: 0, fontSize: "1.4rem" }}>🔄 My Trades</h2>
                        <button className="btn-neon" onClick={loadMyTrades} style={{ padding: "8px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                            <RefreshCcw size={14} /> Refresh
                        </button>
                    </div>
                    <MyTradesTab />
                </motion.div>
            )}

            {/* ── Listing Detail Modal ── */}
            <AnimatePresence>
                {selectedListing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(6px)" }}
                        onClick={() => setSelectedListing(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel"
                            style={{ maxWidth: "520px", width: "100%", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}
                            onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                                <div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                                        <span style={{ background: getListingBg(selectedListing.listingType), color: getListingColor(selectedListing.listingType), padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", textTransform: "capitalize", border: `1px solid ${getListingColor(selectedListing.listingType)}33` }}>
                                            {selectedListing.listingType}
                                        </span>
                                        <span style={{ background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                            {selectedListing.category?.name || "General"}
                                        </span>
                                        {selectedListing.condition && (
                                            <span style={{ background: "rgba(255,215,0,0.1)", color: "#ffd700", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem" }}>
                                                {selectedListing.condition}
                                            </span>
                                        )}
                                    </div>
                                    <h2 style={{ margin: 0, color: "#fff", fontSize: "1.4rem" }}>{selectedListing.title}</h2>
                                </div>
                                <span style={{ color: getListingColor(selectedListing.listingType), fontWeight: "bold", fontSize: "1.4rem", flexShrink: 0 }}>
                                    {selectedListing.listingType === 'borrow' ? 'Free' : `₹${selectedListing.price}`}
                                </span>
                            </div>

                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px", lineHeight: 1.6 }}>{selectedListing.description}</p>

                            {/* Seller info */}
                            <div className="glass-panel" style={{ padding: "14px 18px", marginBottom: "22px", display: "flex", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.03)" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,212,255,0.3), rgba(112,0,255,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                                    👤
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: "0.9rem" }}>{selectedListing.seller?.email?.split('@')[0] || "Seller"}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: selectedListing.seller?.trustScore > 80 ? "#00ff88" : selectedListing.seller?.trustScore > 50 ? "#ffd700" : "#ff4444" }} />
                                        <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Trust Score: {selectedListing.seller?.trustScore || 100}%</span>
                                    </div>
                                </div>
                                {selectedListing.meetupLocations?.length > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                        <MapPin size={13} /> {selectedListing.meetupLocations[0].campus}
                                    </div>
                                )}
                            </div>

                            {/* Trade form */}
                            <form onSubmit={handleTradeSubmit}>
                                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "8px" }}>
                                    Message to seller
                                </label>
                                <textarea rows="3" required
                                    placeholder={`Hi, I'm interested in "${selectedListing.title}"…`}
                                    value={tradeMessage} onChange={e => setTradeMessage(e.target.value)}
                                    style={{ ...inputStyle, resize: "none", marginBottom: "18px" }} />
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button type="button" className="btn-neon" onClick={() => setSelectedListing(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)" }}>Cancel</button>
                                    <button type="submit" className="btn-neon primary" disabled={submittingTrade} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        <MessageCircle size={17} /> {submittingTrade ? "Sending…" : `Request to ${selectedListing.listingType}`}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create Listing Modal ── */}
            <AnimatePresence>
                {isCreatingListing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(6px)" }}
                        onClick={() => setIsCreatingListing(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel"
                            style={{ maxWidth: "500px", width: "100%", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}
                            onClick={e => e.stopPropagation()}>

                            <h2 style={{ color: "white", marginBottom: "22px" }}>📦 Create New Listing</h2>
                            <form onSubmit={handleCreateListing} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div>
                                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "7px" }}>Title</label>
                                    <input required type="text" value={newListing.title} onChange={e => setNewListing({ ...newListing, title: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "7px" }}>Description</label>
                                    <textarea required rows="3" value={newListing.description} onChange={e => setNewListing({ ...newListing, description: e.target.value })} style={{ ...inputStyle, resize: "none" }} />
                                </div>
                                <div style={{ display: "flex", gap: "14px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "7px" }}>Type</label>
                                        <select required value={newListing.listingType} onChange={e => setNewListing({ ...newListing, listingType: e.target.value })} style={selectStyle}>
                                            <option style={{ color: "black" }} value="sell">Sell</option>
                                            <option style={{ color: "black" }} value="rent">Rent</option>
                                            <option style={{ color: "black" }} value="borrow">Borrow (Free)</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "7px" }}>Price (₹)</label>
                                        <input
                                            required={newListing.listingType !== "borrow"}
                                            disabled={newListing.listingType === "borrow"}
                                            type="number" min="0"
                                            value={newListing.price}
                                            onChange={e => setNewListing({ ...newListing, price: e.target.value })}
                                            style={{ ...inputStyle, opacity: newListing.listingType === "borrow" ? 0.5 : 1 }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "14px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "7px" }}>Category</label>
                                        <select required value={newListing.category} onChange={e => setNewListing({ ...newListing, category: e.target.value })} style={selectStyle}>
                                            <option style={{ color: "black" }} value="" disabled>Select Category</option>
                                            {categories.map(c => <option style={{ color: "black" }} key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "7px" }}>Condition</label>
                                        <select required value={newListing.condition} onChange={e => setNewListing({ ...newListing, condition: e.target.value })} style={selectStyle}>
                                            {["New", "Like New", "Good", "Fair", "Poor"].map(c => <option style={{ color: "black" }} key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                                    <button type="button" onClick={() => setIsCreatingListing(false)} className="btn-neon" style={{ flex: 1, background: "rgba(255,255,255,0.05)" }}>Cancel</button>
                                    <button type="submit" className="btn-neon primary" style={{ flex: 2 }}>Create Listing</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Messages Tab ── */}
            {activeTab === 'messages' && (
                <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: '500px', background: 'rgba(10,10,20,0.6)', borderRadius: '16px', border: '1px solid rgba(0,212,255,0.12)', overflow: 'hidden' }}>

                    {/* Split layout: sidebar + chat area */}
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                        {/* Conversations Sidebar */}
                        <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>💬 Conversations</h3>
                            </div>
                            {conversations.length === 0 ? (
                                <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>No conversations yet.</p>
                                    <p style={{ fontSize: '0.78rem', marginTop: '6px', color: 'var(--text-muted)' }}>Send a trade request to start chatting.</p>
                                </div>
                            ) : conversations.map(c => {
                                const other = c.participants?.find(p => p._id !== user?._id);
                                const isActive = activeConvo?._id === c._id;
                                return (
                                    <div key={c._id} onClick={() => selectConvo(c)}
                                        style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent', transition: 'background 0.15s', borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent' }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,212,255,0.04)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{ fontWeight: 600, color: isActive ? 'var(--accent-cyan)' : '#fff', fontSize: '0.88rem', marginBottom: '3px' }}>
                                            {other?.email?.split('@')[0] || 'User'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.tradeRequest?.listing?.title || 'Trade Negotiation'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Chat Area */}
                        {!activeConvo ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', gap: '12px' }}>
                                <div style={{ fontSize: '3rem' }}>👈</div>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a conversation to start messaging</p>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {/* Chat Header */}
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,212,255,0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => { setActiveConvo(null); setChatMessages([]); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>
                                            {activeConvo.participants?.find(p => p._id !== user?._id)?.email?.split('@')[0] || 'Conversation'}
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                            {activeConvo.tradeRequest?.listing?.title || 'Trade Negotiation'}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {chatMessages.length === 0 && (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', fontSize: '0.85rem' }}>No messages yet. Say hello! 👋</div>
                                    )}
                                    {chatMessages.map((msg, i) => {
                                        const isMe = msg.sender?._id === user?._id;
                                        return (
                                            <motion.div key={msg._id || i}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                style={{
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '75%',
                                                    background: isMe
                                                        ? 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(112,0,255,0.2))'
                                                        : 'rgba(255,255,255,0.06)',
                                                    border: isMe ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                                    padding: '10px 14px',
                                                    borderRadius: isMe ? '14px 14px 0 14px' : '14px 14px 14px 0'
                                                }}
                                            >
                                                <div style={{ color: '#fff', fontSize: '0.88rem', lineHeight: 1.45 }}>{msg.content}</div>
                                                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                                                    {format(new Date(msg.createdAt || Date.now()), 'p')}
                                                    {isMe && msg.isRead && <span style={{ color: 'var(--accent-cyan)', marginLeft: '4px' }}>✓✓</span>}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendChatMsg}
                                    style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
                                    <input
                                        type="text"
                                        value={newChatMsg}
                                        onChange={e => setNewChatMsg(e.target.value)}
                                        placeholder="Type a message…"
                                        style={{ flex: 1, padding: '10px 16px', borderRadius: '50px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.4)', color: '#fff', outline: 'none', fontSize: '0.88rem' }}
                                    />
                                    <button type="submit" disabled={!newChatMsg.trim()}
                                        style={{ width: '42px', height: '42px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: newChatMsg.trim() ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                                        <Send size={17} />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

        </div>
    );
};

export default Marketplace;
